// cf-mt-worker.js  —  百度文档翻译 v3 安全代理
// 设计要点（对应"保密 + 省调用"需求）：
//   1. API Key / Secret Key 只存在 Cloudflare Secrets，绝不出现在任何前端代码
//   2. access_token 缓存 29 天（百度给 30 天），避免每次重复获取
//   3. 相同 from+to+内容 的结果缓存 7 天，二次翻译 0 次百度调用
//   4. CORS 仅放行你的网站域名；每 IP 60 秒限 30 次，防盗用/滥用
//
// 部署步骤：
//   wrangler kv namespace create MT_KV        # 记下返回的 id 填进 wrangler.toml
//   wrangler secret put BAIDU_API_KEY
//   wrangler secret put BAIDU_SECRET_KEY
//   wrangler deploy

const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const BAIDU_CREATE    = 'https://aip.baidubce.com/rpc/2.0/mt/v3/doc-translation/create';
const BAIDU_QUERY     = 'https://aip.baidubce.com/rpc/2.0/mt/v3/doc-translation/query';
const BAIDU_TEXT      = 'https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1'; // 文本翻译（同步，适合短文本/IP 地理字段）

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function cors(resp, origin) {
  resp.headers.set('Access-Control-Allow-Origin', origin);
  resp.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  resp.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  resp.headers.set('Vary', 'Origin');
  return resp;
}
function json(data, status = 200, origin = '*') {
  return cors(new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }), origin);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- 1. access_token 缓存（省去重复获取）----
async function getToken(env) {
  const cached = await env.MT_KV.get('baidu_mt_token', { type: 'json' });
  if (cached && cached.expire > Date.now()) return cached.token;
  const u = `${BAIDU_TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(env.BAIDU_API_KEY)}&client_secret=${encodeURIComponent(env.BAIDU_SECRET_KEY)}`;
  const r = await fetch(u);
  const j = await r.json();
  if (!j.access_token) throw new Error('获取 token 失败: ' + JSON.stringify(j));
  const ttl = Math.max(60, j.expires_in - 3600); // 比 30 天少 1 小时，稳妥刷新
  await env.MT_KV.put('baidu_mt_token', JSON.stringify({ token: j.access_token, expire: Date.now() + ttl * 1000 }), { expirationTtl: ttl });
  return j.access_token;
}

// ---- 2. 结果缓存（相同内容直接命中，0 次百度调用）----
async function hashKey(from, to, format, content) {
  const data = new TextEncoder().encode(`${from}|${to}|${format}|${content}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return 'res:' + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- 3. 简易限流（每 IP 60 秒最多 30 次）----
async function rateOK(env, ip) {
  const k = 'rl:' + ip;
  const c = await env.MT_KV.get(k);
  const n = c ? parseInt(c, 10) : 0;
  if (n >= 30) return false;
  await env.MT_KV.put(k, String(n + 1), { expirationTtl: 60 });
  return true;
}

async function translate(env, { from, to, format, content }) {
  const key = await hashKey(from, to, format, content);
  const hit = await env.MT_KV.get(key, { type: 'json' });
  if (hit) return { ...hit, cached: true };

  const token = await getToken(env);
  const cr = await fetch(`${BAIDU_CREATE}?access_token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, domain: 'general', input: { format, content } })
  });
  const cj = await cr.json();
  const id = cj?.result?.id;
  if (!id) throw new Error('创建任务失败: ' + JSON.stringify(cj));

  let data = null, status = 'Running';
  for (let i = 0; i < 10; i++) {
    await sleep(Math.min(8000, 1200 * Math.pow(1.4, i))); // 指数退避轮询
    const qr = await fetch(`${BAIDU_QUERY}?access_token=${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const qj = await qr.json();
    data = qj?.result?.data; status = data?.status || 'Running';
    if (status === 'Succeeded' || status === 'Failed') break;
  }
  if (status !== 'Succeeded' || !data) throw new Error('翻译未成功: ' + status);

  const file = data.output?.files?.[0];
  if (!file) throw new Error('无译文文件');

  let text = null;
  if (file.format === 'txt') {
    try { text = await (await fetch(file.url)).text(); } catch (_) {}
  }
  const result = { id, status, format: file.format, filename: file.filename, url: file.url, text, cached: false };
  await env.MT_KV.put(key, JSON.stringify(result), { expirationTtl: 7 * 86400 }); // 缓存 7 天
  return result;
}

// ---- 4. 文本翻译（同步接口，把短文本 / IP 地理字段批量翻成中文，1 次调用）----
async function translateText(env, { q, from = 'auto', to = 'zh' }) {
  const key = 'txt:' + from + '|' + to + '|' + q;
  const hit = await env.MT_KV.get(key, { type: 'json' });
  if (hit) return { ...hit, cached: true };
  const token = await getToken(env);
  const r = await fetch(`${BAIDU_TEXT}?access_token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, from, to })
  });
  const j = await r.json();
  const list = j?.result?.trans_result || [];
  const result = { results: list, cached: false };
  if (list.length) await env.MT_KV.put(key, JSON.stringify(result), { expirationTtl: 7 * 86400 }); // 缓存 7 天
  return result;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 兼容同域相对路径挂载：若经 /cf-mt-worker.js 前缀路由进来，去掉前缀再匹配路由
    let p = url.pathname;
    const MT_PREFIX = '/cf-mt-worker.js';
    if (p.startsWith(MT_PREFIX)) p = p.slice(MT_PREFIX.length) || '/';
    // 统一部署（Workers Static Assets）：绑定了 ASSETS 时，非翻译路由直接托管静态站点（index.html）；
    // 未绑定 ASSETS（独立翻译 Worker）时此分支自动跳过，行为与旧版一致
    if (env.ASSETS && p !== '/mt/download' && p !== '/mt/translate' && p !== '/mt/text') {
      return env.ASSETS.fetch(request);
    }
    const ALLOWED = env.ALLOWED_ORIGIN || 'https://ip.example.com';
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), ALLOWED);

    const origin = request.headers.get('Origin') || '';
    if (origin && origin !== ALLOWED) return json({ error: 'forbidden origin' }, 403, ALLOWED);

    // 下载译文（代理百度 CDN，绕开可能的跨域/过期限制）
    if (p === '/mt/download' && request.method === 'POST') {
      let b; try { b = await request.json(); } catch { return json({ error: 'bad json' }, 400, ALLOWED); }
      if (!b.url) return json({ error: 'missing url' }, 400, ALLOWED);
      const fr = await fetch(b.url);
      if (!fr.ok) return json({ error: 'download failed' }, 502, ALLOWED);
      const buf = await fr.arrayBuffer();
      const ct = fr.headers.get('Content-Type') || 'application/octet-stream';
      const resp = new Response(buf, { status: 200, headers: { 'Content-Type': ct, 'Content-Disposition': 'attachment' } });
      return cors(resp, ALLOWED);
    }

    if (p === '/mt/translate' && request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!(await rateOK(env, ip))) return json({ error: 'rate limited' }, 429, ALLOWED);
      let body; try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, ALLOWED); }
      const { from = 'auto', to, format = 'txt', content } = body;
      if (!to || !content) return json({ error: '缺少 to 或 content' }, 400, ALLOWED);
      if (to === 'auto') return json({ error: '目标语言不能为 auto' }, 400, ALLOWED);
      try {
        const result = await translate(env, { from, to, format, content });
        return json(result, 200, ALLOWED);
      } catch (e) {
        return json({ error: String(e.message || e) }, 502, ALLOWED);
      }
    }
    // 文本翻译（供 IP 工具箱把英文归属地批量翻成中文，1 次调用返回有序译文）
    if (p === '/mt/text' && request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!(await rateOK(env, ip))) return json({ error: 'rate limited' }, 429, ALLOWED);
      let body; try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, ALLOWED); }
      const { q, from = 'auto', to = 'zh' } = body;
      if (!q) return json({ error: '缺少 q' }, 400, ALLOWED);
      try {
        const result = await translateText(env, { q, from, to });
        return json(result, 200, ALLOWED);
      } catch (e) {
        return json({ error: String(e.message || e) }, 502, ALLOWED);
      }
    }

    return json({ error: 'not found' }, 404, ALLOWED);
  }
};
