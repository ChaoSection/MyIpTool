# MyIpTool（IP 工具箱）

多源 IP 归属地查询 / 连通性探测在线工具，附带中文翻译（百度翻译代理）。

## 项目来源

本项目参考 [TwoThreeWang/MyIpTool](https://github.com/TwoThreeWang/MyIpTool) 的思路与 UI 实现。

在原项目完成**底层架构更新**（部署与渲染机制重构）后，本项目依据原项目的设计思路与界面风格进行了**重新实现**：保留多源 IP 探测的产品形态与交互布局，底层改为单一 Cloudflare Worker 同时托管页面与翻译接口，去掉跨域依赖、统一部署。

## Demo / 在线示例

实际部署示例：**<https://ip.chaosection.top/>**

## 功能

- 多源 IP 探测：ipify / ipinfo.io / ipv4.ip.sb / ipv6.ip.sb / 12306 等多个数据源合并展示
- 出口 IP 速览：每卡片最多 4 个源，超出自动拆分新卡片（标题统一「多源IP」）
- IP 搜索框：`api.ip.sb` 主源 + `ipwho.is` 兜底
- 中文翻译：国家/省/州由静态表即时翻译（零调用）；城市/运营商等表外值经百度翻译代理兜底
- 运营商简称静态表 `CN_ISP_ABBR`：爱奇艺 ISP 码、英文全称同步翻中文，不依赖百度 Worker（Worker 失效也生效）

## 架构

```
cf-mt-worker.js              # Cloudflare Worker：翻译接口（/mt/text 等）+ Static Assets 托管 public/index.html
wrangler.toml                # 真实 Worker 配置（main + assets），由 Workers Builds 从 GitHub 自动同步
build.sh                     # 供 Cloudflare Workers Builds 的部署命令（npx wrangler deploy）
public/index.html            # 站点页面（声明式渲染，唯一页面源）
```

- 一个 Worker 通过 **Static Assets** 同时托管 `public/index.html` 与处理翻译路由 `/mt/*`
- 页面内 `BAIDU_WORKER = './cf-mt-worker.js'`（同域相对路径）
- 同域调用时 Worker 自动放行（无需配置 `ALLOWED_ORIGIN`）；仅跨域站点调用时才需显式设置
- KV（`MT_KV`）**可选**：绑定后开启 token/结果缓存与限流；不绑定 Worker 自动降级（翻译仍可用，仅无限流与缓存）

> 历史本地部署脚本 `deploy.sh` / `deploy.ps1` / `wrangler-unified.toml.template` 仍保留，可作一次性手动部署用（会生成 `wrangler-unified.toml` 并 `wrangler deploy`），**已不是主路径**；日常推荐走下方「GitHub 自动部署」。

## 部署

### 通过 GitHub 自动部署（Cloudflare Workers Builds，推荐）

把仓库连到 Cloudflare，每次 `git push` 自动构建并部署，无需本地运行 wrangler。

**控制台配置**

1. Dashboard → **Workers & Pages** → 选择 Worker → **Settings → Builds** → **Connect Git repository**
2. 授权 GitHub，选择本仓库（如 `ChaoSection/MyIpTool`）
3. 分支：`main`；**Root directory**：`/`
4. **Deploy command**：`bash build.sh`
5. 保存

**需要在控制台设置（Secrets，机密）**

- `BAIDU_API_KEY`、`BAIDU_SECRET_KEY`：百度翻译密钥（通用翻译服务）
- `CLOUDFLARE_API_TOKEN`：具备 Workers 编辑权限的 API Token，供 `npx wrangler` 在 CI 鉴权

> `build.sh` 仅执行 `npx wrangler deploy`，直接读取仓库根 `wrangler.toml`（已声明 `main` + `assets`），**无需模板替换、无需 `MT_KV_ID` 等 Build 变量**。KV 未绑定也能部署成功，只是无缓存/限流。

### 本地部署（可选，历史脚本）

```bash
npm i -g wrangler
wrangler login
# 注入百度翻译密钥（不落盘，仅存于 Cloudflare，首次部署后执行一次）
wrangler secret put BAIDU_API_KEY
wrangler secret put BAIDU_SECRET_KEY
# 生成 wrangler-unified.toml 并部署（Windows PowerShell：./deploy.ps1）
./deploy.sh
```

### 自定义域名 / 路由

若要让统一 Worker 接管生产域名（如 `ip.chaosection.top`），在 Cloudflare 给该域名加 Worker 路由 `ip.chaosection.top/*` → 本 Worker。
页面用相对路径 `./cf-mt-worker.js` 时，该路由必须覆盖 `ip.chaosection.top/cf-mt-worker.js*`，翻译接口才能同域命中 Worker（否则落到 Pages 返回 404）。

## 如何获取部署参数

| 参数 | 用途 | 获取方式 |
|---|---|---|
| `BAIDU_API_KEY` | 百度翻译 API 鉴权 | 百度翻译开放平台 <https://fanyi-api.baidu.com/> → 控制台 → 创建应用（通用翻译服务）→ 获取 API Key |
| `BAIDU_SECRET_KEY` | 百度翻译 API 鉴权 | 同上，与 API Key 配对获取 Secret Key |
| `CLOUDFLARE_API_TOKEN` | CI 内 `npx wrangler` 鉴权 | Cloudflare → My Profile → API Tokens → 新建（Workers 编辑权限） |
| `MT_KV`（可选） | 缓存百度 token + 限流计数 | 控制台 Workers → 本 Worker → 绑定 KV；不绑定则跳过缓存与限流 |

> 密钥通过控制台 Secrets 注入，存于 Cloudflare，不在代码或仓库中明文出现。

## 回退

删除自定义域名上的 Worker 路由即可恢复原有站点（若保留 Pages 项目）；本仓库不含 Pages 配置，纯 Worker 部署。

## 目录

```
.
├── cf-mt-worker.js            # Worker 代码（翻译路由 + 页面托管）
├── wrangler.toml              # 真实 Worker 配置（main + assets），供 Workers Builds 自动部署
├── build.sh                   # Workers Builds 部署命令（npx wrangler deploy）
├── deploy.sh                  # 本地部署（Git Bash / macOS / Linux，可选）
├── deploy.ps1                 # 本地部署（Windows PowerShell，可选）
├── wrangler-unified.toml.template  # 本地部署模板（__WORKER_NAME__ / __MT_KV_ID__ 占位符，可选）
├── public/
│   └── index.html            # 站点页面（唯一页面源）
└── README.md
```

## 浏览器支持矩阵

页面依赖现代 Web API：`fetch` / `Promise` / `IntersectionObserver` / `AbortController` / `async/await` / `Proxy`(无) / `WeakMap`(无)。最低支持版本如下；低于下界的浏览器会做运行时守卫（不白屏，但部分卡片不回填或连通性探测降级为 img 兜底）。

| 浏览器 | 最低版本 | 说明 |
|---|---|---|
| Chrome / Edge | 51+（2016-07） | 全功能；`text-justify:inter-character` 两端分散生效 |
| Firefox | 55+（2017-08） | 全功能；标签两端分散走 `-moz-text-align-last:justify` 兜底（拉丁短标签如 IP/ASN 不逐字分散，由 `--lbl-w` 统一宽度保证冒号对齐） |
| Safari | 11+（2017-09） | 全功能；`-webkit-mask-image` 截断遮罩生效 |
| iOS Safari | 11+ | 同 Safari |
| Opera | 38+ | 同 Chrome |
| IE 11 及更低 | 不支持 | 无 `fetch`/`Promise`，页面不可用（运行时守卫仅防崩溃，数据不展示） |

> 标注：`IntersectionObserver` 不可用时自动回退为全量并发加载（功能不变，仅首屏并发略高）；`AbortController` 不可用时连通性探测走 `<img>` 兜底（超时仍生效）。

## CSP 域名清单

页面通过 `<meta http-equiv="Content-Security-Policy">` 声明白名单（详见 `public/index.html` 头部的 `default-src 'none'` 策略）。所有外链均为 HTTPS，无 HTTP 混合内容。新增数据源若涉及新域名，需同步更新此处与 `index.html` 的 CSP。

| 指令 | 允许的源 | 用途 |
|---|---|---|
| `script-src` | `'self'` `'unsafe-inline'` + 以下 4 个 JSONP 域 | 页面脚本 + JSONP 回调脚本 |
| | `https://whois.pconline.com.cn` | 太平洋网络（GBK 编码 JSONP） |
| | `https://dashi.163.com` | 网易大师 JSONP |
| | `https://ipservice.ws.126.net` | 国内出口·网易 IP 服务 JSONP |
| | `https://mail.163.com` | 国内出口·网易邮箱 JSONP |
| `connect-src` | `'self'` `https:` | 所有 `fetch` 数据源（ip.sb / ipinfo.io / ipify / 12306 / 百度翻译 Worker `/mt/text` 等同域相对路径等） |
| `img-src` | `'self'` `https:` `data:` | 连通性卡 favicon + 内联 SVG 失败兜底（`data:`） |
| `style-src` | `'unsafe-inline'` | 页面内联 `<style>` |
| `font-src` | `'self'` `https:` | 系统字体回退 |
| `base-uri` / `form-action` | `'self'` | 防基址劫持 / 表单外跳 |
| `frame-ancestors` | `'none'` | 禁止被 iframe 嵌入 |
| `object-src` | `'none'` | 禁用 `<object>`/`<embed>` |

> JSONP 回调名由 `fetchJsonp` 内部自动生成（`__jp_<n>`），卡片只需声明 `jsonp:true`；服务端约定的 `?callback=xxx` 查询参数不在此列。**新增 JSONP 源必须把它所在的域名加入上表 `script-src`**，否则会被 CSP 拦截。
