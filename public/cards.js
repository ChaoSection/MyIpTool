/* 卡片配置 + 字段派生（外置，仿 tables.js 模式）。
 * 由 index.html 经 <script src="./cards.js"></script> 在 tables.js 之后、主线脚本之前载入，挂为全局变量。
 * 加数据源 = 改本文件，index.html 引擎零改。
 * 依赖（运行时已加载）：CN_ISP_ABBR（来自 tables.js，仅 DERIVE 专属函数 src-iqiyi 用到）。 */
var DERIVE = {
  'src-pconline': function(d){
    var v = (d.addr != null) ? d.addr : (d.pro != null ? d.pro : '');
    var s = String(v).replace(/^\s+/, '').trim();   /* 去前导空格（如海外 IP " 美国"） */
    if (!s) return;
    var idx = s.lastIndexOf(' ');
    if (idx > 0){ d.addr_addr = s.slice(0, idx).trim(); d.addr_isp = s.slice(idx+1).trim(); }
    else { d.addr_addr = s; d.addr_isp = ''; }
  },
  /* ipip.net：location 为数组，末项是运营商，其余拼为地址 */
  'src-ipipnet': function(d){
    var loc = d.data && d.data.location;
    if (!Array.isArray(loc) || !loc.length) return;
    d.loc_isp = (loc[loc.length - 1] == null ? '' : String(loc[loc.length - 1])).trim();
    d.loc_addr = loc.slice(0, -1)
      .filter(function(x){ return x !== '' && x != null; })
      .join(' ').replace(/\s+/g, ' ').trim();
  },
  /* 爱奇艺：t = "CMNET|HeNan_ZhengZhou-111.6.193.195" => [ISP码]|[省_市拼音]-[IP]
   * 地址/运营商原值（拼音/英文）交 baiduTranslateRemaining 走百度翻译；Worker 失效时按用户决策回退拼音/英文 */
  'src-iqiyi': function(d){
    var t = d.t;
    if (!t || typeof t !== 'string') return;
    var parts = t.split('|');
    var ispCode = (parts[0] || '').trim();
    var rest = parts[1] || '';
    var m = rest.split('-');
    var geo = (m[0] || '').trim();          /* 省_市 拼音（可能仅省，如 HeNan） */
    var ip = m.slice(1).join('-').trim();
    d.iqiyi_isp = CN_ISP_ABBR[ispCode] || ispCode;   /* 爱奇艺 ISP 码 -> 中文简称（命中静态表显中文，未命中回退原始码） */
    d.iqiyi_addr = geo;      /* 省_市 拼音，交给百度翻译 */
    d.iqiyi_ip = ip;
  },
  /* WhatIsMyIP（wimi-api-v4/v6）：响应包在 data 下，提到顶层供模板直接取；v4/v6 同源双栈，地理一致 */
  'src-wimi': function(d){
    if (d && d.data && typeof d.data === 'object'){
      for (var k in d.data){ if (Object.prototype.hasOwnProperty.call(d.data, k)) d[k] = d.data[k]; }
    }
  },
  /* FreeIPAPI：无独立 ISP 名字段，用 asnOrganization 充当运营商（别名 isp 走 CN_ISP_ABBR 静态表）；
   * 组装 asnLine（AS+编号+组织），避免空值出现 "AS " 残留 */
  'src-freeipapi': function(d){
    if (d.asnOrganization != null) d.isp = d.asnOrganization;
    if (d.asn != null && d.asnOrganization != null) d.asnLine = 'AS' + d.asn + ' ' + d.asnOrganization;
    else if (d.asnOrganization != null) d.asnLine = d.asnOrganization;
  },
  /* GeoJS.io：响应为数组 [{}]，解包首元素为对象供模板取用（applyDerive 返回值被 loadAll 采用） */
  'src-geojs': function(d){
    if (Array.isArray(d) && d[0] && typeof d[0] === 'object'){
      var o = {};
      for (var k in d[0]){ if (Object.prototype.hasOwnProperty.call(d[0], k)) o[k] = d[0][k]; }
      return o;
    }
    return d;
  }
};
/* DERIVE 通用规则注册表（P2）：新增数据源若结构可被子规则覆盖，无需写专属函数。
 * 仅当该源无专属 DERIVE 函数时生效（applyDerive 顺序：专属优先，通用兜底）。
 * 规则形态：function(d, id){ 直接改 d 或 return 新对象 }，返回对象则替换。 */
var DERIVE_RULES = [
  /* 响应包在数组 [{}] 中：解包首元素（如 GeoJS 类） */
  function(d){ if (Array.isArray(d) && d[0] && typeof d[0] === 'object'){ var o={}; for (var k in d[0]){ if (Object.prototype.hasOwnProperty.call(d[0],k)) o[k]=d[0][k]; } return o; } },
  /* 响应包在 data 子对象下（如 WhatIsMyIP 类）：提升为顶层 */
  function(d){ if (d && d.data && typeof d.data === 'object' && !Array.isArray(d.data)){ for (var k in d.data){ if (Object.prototype.hasOwnProperty.call(d.data,k)) d[k]=d.data[k]; } } },
  /* 顶层 query 为 IP 且 ip 缺失：复制到 ip（ip-api.com 类 {query,country,...}） */
  function(d){ if (d && typeof d.query === 'string' && !('ip' in d) && /^\d{1,3}(\.\d{1,3}){3}$|^[0-9a-fA-F:]+$/.test(d.query.trim())){ d.ip = d.query.trim(); } },
  /* country 为 ISO2 且 country_code 缺失：归一到 country_code（统一模板取码） */
  function(d){ if (d && typeof d.country === 'string' && /^[A-Za-z]{2}$/.test(d.country) && !('country_code' in d)){ d.country_code = d.country; } }
];
function applyDerive(el, d){
  var f = DERIVE[el.id];
  if (f && d && typeof d === 'object'){
    var r = f(d);
    return (r && typeof r === 'object') ? r : d;   /* 专属函数优先：原地改 d 则返回 d，返回对象则替换；绝不进入通用分支 */
  }
  /* 无专属函数：跑通用规则兜底（现有 6 个专属源绝不走此分支，输出零回归） */
  if (d && typeof d === 'object'){
    for (var i=0;i<DERIVE_RULES.length;i++){ var rr = DERIVE_RULES[i](d, el.id); if (rr && typeof rr === 'object') d = rr; }
  }
  return d;
}
/* 字段选项写入 DOM 属性（纯设置，无 DOM 树依赖） */
function setCardOpt(el, opt){
  if (!opt) return;
  if (opt.jsonp) el.setAttribute('data-jsonp', '1');
  if (opt.charset) el.setAttribute('data-charset', opt.charset);
  if (opt.method) el.setAttribute('data-method', opt.method);
  if (opt.body) el.setAttribute('data-body', opt.body);
}
/* IP 卡片排序：数据行数从多到少（descending）；同行数按 id 字典序稳定排序。
 * 聚合卡 src-domestic / src-overseas 锁末两位（不进入行数排序）。返回新数组，不改原配置。 */
function sortIpCards(list){
  var agg = ['src-domestic', 'src-overseas'];
  var mains = list.filter(function(c){ return agg.indexOf(c.id) < 0; });
  var tails = list.filter(function(c){ return agg.indexOf(c.id) >= 0; });
  mains.sort(function(a, b){
    var ra = (a.rows ? a.rows.length : 0), rb = (b.rows ? b.rows.length : 0);
    if (rb !== ra) return rb - ra;                       /* 行数多者在前 */
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);    /* 同行数按 id 字典序 */
  });
  return mains.concat(tails);
}
/* ===== IP 卡片数组绑定（v7 重构）：用数据数组生成卡片 DOM，消除重复 HTML =====
 * 每条 = 一张卡片：id(对应 DERIVE 键) / title / api(块级接口,可选) / opt(块级 fetch 选项,可选) / rows
 * row 形态：
 *   {ip:1, tpl, label?, api?, opt?}  -> IP 行（data-role=ip；可带独立 api/opt，用于双栈、聚合卡）
 *   {label, tpl, tag?}              -> 字段行（tag 仅聚合卡用于源标签） */
var IP_CARDS = [
  { id:'src-ipipnet', title:'ipip.net', api:'https://myip.ipip.net/json', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{loc_addr}'}, {label:'运营商', tpl:'{loc_isp}'} ] },
  { id:'src-iqiyi', title:'爱奇艺', api:'https://data.video.iqiyi.com/v.f4v', rows:[
    {ip:1, tpl:'{iqiyi_ip}'}, {label:'地址', tpl:'{iqiyi_addr}'}, {label:'运营商', tpl:'{iqiyi_isp}'} ] },
  { id:'src-myipla', title:'MyIP.la', api:'https://api.myip.la/cn?json', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{country_name} {province} {city}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-pconline', title:'太平洋网络', api:'https://whois.pconline.com.cn/ipJson.jsp', opt:{jsonp:true, charset:'gbk'}, rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{addr_addr}'}, {label:'运营商', tpl:'{addr_isp}'} ] },
  { id:'src-163', title:'网易大师', api:'https://dashi.163.com/fgw/mailsrv-ipdetail/detail?callback=__cb163', opt:{jsonp:true}, rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{country} {province} {city}'}, {label:'运营商', tpl:'{isp}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-ipinfo', title:'IPInfo.io', api:'https://ipinfo.io/json', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{country} {region} {city}'}, {label:'运营商', tpl:'{org}'}, {label:'经纬度', tpl:'{loc}'} ] },
  { id:'src-bdip', title:'Cloudflare', api:'https://bdip.chaosection.top/', rows:[
    {ip:1, tpl:'{IP.IP}'}, {label:'地址', tpl:'{IP.Country} {IP.Region} {IP.City}'}, {label:'ASN', tpl:'{IP.ASN}'}, {label:'运营商', tpl:'{IP.ASOrganization}'}, {label:'经纬度', tpl:'{IP.Latitude}, {IP.Longitude}'} ] },
  { id:'src-freeipapi', title:'FreeIPAPI', api:'https://free.freeipapi.com/api/json', rows:[
    {ip:1, tpl:'{ipAddress}'}, {label:'地址', tpl:'{countryName} {regionName} {cityName}'}, {label:'ASN', tpl:'{asnLine}'}, {label:'运营商', tpl:'{isp}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-geojs', title:'GeoJS', api:'https://get.geojs.io/v1/ip/geo.json', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{country}'}, {label:'ASN', tpl:'AS{asn} {organization_name}'}, {label:'运营商', tpl:'{organization_name}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-hsselite', title:'Hsselite', api:'https://www.hsselite.com/ipinfo', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{country_name}'}, {label:'ASN', tpl:'AS{asn} {organization}'}, {label:'运营商', tpl:'{isp}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-ipquery', title:'IPQuery', api:'https://api.ipquery.io/?format=json', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{location.country} {location.state} {location.city}'}, {label:'ASN', tpl:'{isp.asn} {isp.org}'}, {label:'运营商', tpl:'{isp.isp}'}, {label:'经纬度', tpl:'{location.longitude},{location.latitude}'} ] },
  { id:'src-ipwho', title:'ipwho.is', api:'https://ipwho.is/', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{country} {region} {city}'}, {label:'ASN', tpl:'AS{connection.asn} {connection.org}'}, {label:'运营商', tpl:'{connection.isp}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-uapis', title:'UAPIs', api:'https://uapis.cn/api/v1/network/myip', rows:[
    {ip:1, tpl:'{ip}'}, {label:'地址', tpl:'{region}'}, {label:'ASN', tpl:'{asn}'}, {label:'运营商', tpl:'{llc}（{isp}）'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-ipsb', title:'IP.SB', api:'https://api.ip.sb/geoip', rows:[
    {ip:1, label:'IPv4', tpl:'{ip}', api:'https://api-ipv4.ip.sb/geoip'},
    {ip:1, label:'IPv6', tpl:'{ip}', api:'https://api-ipv6.ip.sb/geoip'},
    {label:'地址', tpl:'{country} {region} {city}'}, {label:'ASN', tpl:'{asn} {asn_organization}'}, {label:'运营商', tpl:'{organization}'}, {label:'经纬度', tpl:'{latitude},{longitude}'} ] },
  { id:'src-wimi', title:'WhatIsMyIP', api:'https://wimi-api-v4.whatismyip.com/app/ip', opt:{method:'POST', body:'{}'}, rows:[
    {ip:1, label:'IPv4', tpl:'{ip}'},
    {ip:1, label:'IPv6', tpl:'{ip}', api:'https://wimi-api-v6.whatismyip.com/app/ip', opt:{method:'POST', body:'{}'}},
    {label:'地址', tpl:'{countryName} {region} {city}'}, {label:'ASN', tpl:'AS{asn}'}, {label:'运营商', tpl:'{isp}'}, {label:'经纬度', tpl:'{longitude},{latitude}'} ] },
  { id:'src-domestic', title:'国内出口', rows:[
    {ip:1, tpl:'{di}', api:'https://exservice.12306.cn/excater/bonree/grip', tag:'12306'},
    {ip:1, tpl:'{result.ip}', api:'https://ipservice.ws.126.net/locate/api/getLocByIp?callback=__cbNeteaseIP', opt:{jsonp:true}, tag:'网易IP服务'},
    {ip:1, tpl:'{ip}', api:'https://mail.163.com/fgw/mailsrv-ipdetail/detail?callback=__cb163mail', opt:{jsonp:true}, tag:'网易邮箱'} ] },
  { id:'src-overseas', title:'海外出口', rows:[
    {ip:1, tpl:'{ip}', api:'https://api.ipify.org?format=json', tag:'ipify'} ] }
];
var CONN_CARDS = [
  { id:'google', title:'Google', url:'https://www.google.com/', img:'https://www.google.com/favicon.ico' },
  { id:'youtube', title:'YouTube', url:'https://www.youtube.com/', img:'https://www.youtube.com/favicon.ico' },
  { id:'github', title:'Github', url:'https://github.com/', img:'https://github.com/favicon.ico' },
  { id:'cloudflare', title:'CloudFlare', url:'https://www.cloudflare.com/', img:'https://www.cloudflare.com/favicon.ico' },
  { id:'chatgpt', title:'ChatGPT', url:'https://chatgpt.com/', img:'https://chatgpt.com/favicon.ico' },
  { id:'wechat', title:'微信', url:'https://weixin.qq.com/', img:'https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon64_appwx_logo.png' },
  { id:'baidu', title:'百度', url:'https://www.baidu.com/', img:'https://www.baidu.com/favicon.ico' },
  { id:'vqq', title:'腾讯视频', url:'https://v.qq.com/', img:'https://v.qq.com/favicon.ico' },
  { id:'iqiyi', title:'爱奇艺', url:'https://www.iqiyi.com/', img:'https://www.iqiyi.com/favicon.ico' },
  { id:'mgtv', title:'芒果TV', url:'https://www.mgtv.com/', img:'https://www.mgtv.com/favicon.ico' },
  { id:'youku', title:'优酷', url:'https://www.youku.com/', img:'https://www.youku.com/favicon.ico' }
];
