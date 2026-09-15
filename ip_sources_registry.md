# IP 工具箱 · 源记录（去重权威表）

> 用途：以后老板提交新源，先比对本表 URL/域名。命中 → 直接回"已存在（状态/批次）"，**不重测**；
> 未命中 → 跑 `ip_api_probe.sh` 探针、补状态、追加到本表。
> 判定铁律：浏览器本机直连、禁反代；通过 = HTTPS + 发 `Access-Control-Allow-Origin`（CORS 或 JSONP）。
> 状态含义：
> - **DEPLOYED** = 已部署进页面（直连/JSONP 可用）
> - **USABLE** = 评估通过铁律（HTTPS+CORS），可加卡片但尚未部署
> - **USABLE-JSONP** = 无 CORS 但支持 JSONP（需页面加 `<script>` 加载支持才可用）
> - **BLOCK** = 铁律下不可用（无 CORS/JSONP、HTTP 混合内容、403/5xx、离线等）
> - **REMOVED** = 曾评估通过但老板要求移出页面（仍按域名去重，不重测）

---

## 一、已部署（DEPLOYED · 整体对账 2026-08-19 校正）

> 共 **19 个逻辑源**已上线（ip.sb / wimi 各计 1 个，含 v4+v6 变体）。
> 卡片归属：独立卡 `src-*` 15 张；聚合卡 `src-domestic`（国内出口：12306+网易IP服务+网易邮箱）3 子行；`src-overseas`（海外出口：ipify）1 子行。2026-08-16 重构：IP.SB 由合并卡 `src-ipsb`(geoip) 拆为 `src-ipsb4`(api-ipv4.ip.sb/jsonip)+`src-ipsb6`(api-ipv6.ip.sb/jsonip) 两张独立纯 IP 卡；ipinfo.io 由 `src-overseas` 子行(`/ip`) 升级为独立卡 `src-ipinfo`(`ipinfo.io/json`，缺失字段自动隐藏)。**2026-08-19 再合并**：`src-ipsb4`+`src-ipsb6` 重新合并为单卡 `src-ipsb`，块级 `api.ip.sb/geoip` 填 6 个 geo 行（地址/运营商/ASN/经纬度/邮编/时区），IPv4/IPv6 行各自 `api-ipv4/ipv6.ip.sb/jsonip` 直连；**本次仅改本地仓库、尚未推送上线（部署待 GitHub 令牌）**。`src-ipsb` 仍为 1 个逻辑源，独立卡数 16→15。

| 源 URL | 名称 | 状态 | 批次 | 备注 |
|------|------|------|------|------|
| https://api.ip.sb/geoip （块级）<br>https://api-ipv4.ip.sb/geoip （IPv4 行）<br>https://api-ipv6.ip.sb/geoip （IPv6 行） | IP.SB | DEPLOYED | 2026-08-19 合并 | 单卡 `src-ipsb`：块级 `api.ip.sb/geoip`(CORS:*，返回 country/region/city/organization/isp/asn/asn_organization/postal_code/latitude/longitude/timezone/offset) 填 6 个 geo 行（地址/运营商/ASN/经纬度/邮编/时区）；IPv4 行 `api-ipv4.ip.sb/geoip`、IPv6 行 `api-ipv6.ip.sb/geoip`（各自直连、返回同 geoip 字段集含 `{ip}`、按返回值自动标注协议）。**按老板指示将原 jsonip 改为 geoip（2026-08-19 修正）。2026-08-19 19:33 字节级推送成功（commit `357c8111`，blob `178cc9a0`）。本地仓库已同步。生产域名 `ip.chaosection.top` 缓存延迟，GitHub raw 已确认上线** |
| https://ipinfo.io/json | IPInfo.io | DEPLOYED | 2026-08-20 字段精简 | 独立卡 `src-ipinfo`；CORS:*；返回 `ip/city/region/country/loc(经纬度逗号串)/org/postal/timezone`；**当前页面字段：IP / 地址(country region city) / 运营商(org) / 经纬度(loc)**——邮编(postal)与时区(timezone)已移除；缺失字段整行隐藏。**原 2026-08-16 升级独立卡含 6 字段（IP/地址/运营商/经纬度/邮编/时区），2026-08-20 老板指示精简为 4 字段** |
| https://exservice.12306.cn/excater/bonree/grip | 12306 | DEPLOYED | 第二批→2026-08-15 | CORS:*；`{"di":"公网IP"}` 极简；`src-domestic` 子行「国内出口」 |
| https://api.ipify.org?format=json | ipify | DEPLOYED | 第四批→2026-08-15 | CORS:*；`{"ip":"..."}` 海外；`src-overseas` 子行 |
| https://data.video.iqiyi.com/v.f4v | 爱奇艺 | DEPLOYED | 第三批→2026-08-15 | CORS:*；`t`=`ISP\|省_市拼音-IP`；DERIVE 拆 iqiyi_isp/iqiyi_addr/iqiyi_ip（爱奇艺 ISP 码→CN_ISP_ABBR 中文简称）；地址原值交百度翻译兜底；独立卡 `src-iqiyi` |
| https://www.hsselite.com/ipinfo | Hsselite | DEPLOYED | 第四批→2026-08-15 | CORS:*；ASN/组织/经纬度；独立卡 `src-hsselite` |
| https://ipservice.ws.126.net/locate/api/getLocByIp?callback=__cbNeteaseIP | 网易IP服务 | DEPLOYED | 第三批→2026-08-15 | JSONP(__cbNeteaseIP)；`src-domestic` 子行 |
| https://mail.163.com/fgw/mailsrv-ipdetail/detail?callback=__cb163mail | 网易邮箱 | DEPLOYED | 第三批→2026-08-15 | JSONP(__cb163mail)；`src-domestic` 子行 |
| https://dashi.163.com/fgw/mailsrv-ipdetail/detail?callback=__cb163 | 网易邮箱大师 | DEPLOYED | 早期→2026-08-15 | JSONP(__cb163)；独立卡 `src-163` |
| https://api.myip.la/cn?json | MyIP.la | DEPLOYED | 早期(纠正2026-08-19) | CORS:*；原生中文 省/市/国名+经纬度（无 ISP）；独立卡 `src-myipla`；渲染验证✓ 地址=美国 加利福尼亚州 洛杉矶 / 中国 河南 郑州 |
| https://myip.ipip.net/json | IPIP(myip) | DEPLOYED | 早期(纠正2026-08-19) | 须用 `/json` 变体（裸`/`为纯文本非JSON）；CORS:*；`location` 数组[国,省,市,区,运营商] DERIVE 拆 `loc_addr`/`loc_isp`；**唯一带运营商(电信/联通/移动)的源**；独立卡 `src-ipipnet`；渲染验证✓ 地址=中国 河南 郑州 / 运营商=电信 |
| https://uapis.cn/api/v1/network/myip | UAPIS | DEPLOYED | 早期(补录2026-08-19) | 探针✓ 200 / ACAO=回显请求 Origin(=ip.chaosection.top) / JSON；`{"ip","beginip","endip","region":"中国 河南 郑州","isp":"Chinanet","asn":"AS4134","llc":"电信",lat,lon}` 原生中文 地址+**ISP**+**ASN**；独立卡 `src-uapis`。**此前权威表漏录，本次补** |
| https://whois.pconline.com.cn/ipJson.jsp | 太平洋电脑网 | DEPLOYED(JSONP) | 早期(纠正2026-08-19) | **此前误列 BLOCK（无CORS），实际页面以 JSONP(`IPCallBack`)+GBK(`data-charset=gbk`) 部署**，DERIVE 拆 `addr_addr`/`addr_isp`；独立卡 `src-pconline`；GBK 由 fetchJsonp 解码，可用。**状态纠正：BLOCK→DEPLOYED(JSONP)** |
| https://bdip.chaosection.top/ | bdip(本域Worker) | DEPLOYED | 早期 | 本域 Cloudflare Worker，ACAO:*，返回**访客自身**出口 IP+geo（非第三方反代、不伪造 IP）；独立卡 `src-bdip`。**老板拍板 2026-08-19：本域回声端点仅回显访客自身 IP、无第三方上游，不算铁律「禁服务器反代」违规** |
| https://wimi-api-v4.whatismyip.com/app/ip （POST）<br>https://wimi-api-v6.whatismyip.com/app/ip （POST,IPv6） | WhatIsMyIP(wimi) | DEPLOYED | 早期(补录2026-08-19) | 探针✓ 200 / ACAO=回显请求 Origin + ACAC=true / POST `{}`；`{"data":{ip,city,region,countryName,isp,asn,...}}`；DERIVE 提升 data 字段；独立卡 `src-wimi`；v4/v6 同源双栈。**此前权威表漏录，本次补** |
| https://ipwho.is/ | ipwho.is | DEPLOYED | 第五批→2026-08-19 | 探针✓ 200/ACAO:*/JSON/完整 geo(国/省/市/ISP/经纬度)；无 key；独立卡 `src-ipwho` |
| https://free.freeipapi.com/api/json | FreeIPAPI.com | DEPLOYED | 第五批→2026-08-19 | 裸域 freeipapi.com/api/json 302→free. 子域且 302 无 ACAO 致 CORS 失败；已用 canonical 主机 `free.freeipapi.com/api/json` 直连（200/ACAO:*）；DERIVE 组装 isp/asnLine；独立卡 `src-freeipapi` |
| https://get.geojs.io/v1/ip/geo.json | GeoJS.io | DEPLOYED | 第五批→2026-08-19 | 探针✓ 200/ACAO:*/JSON/完整 geo+ASN；响应为数组[{}]经 DERIVE 解包；独立卡 `src-geojs` |
| https://api.ipquery.io/?format=json | IPQuery.io | DEPLOYED | 第五批→2026-08-19 | 部署端点须 `?format=json`（根路径返裸IP文本非JSON）；探针✓ 200/ACAO:*/JSON/完整 geo(isp+location)；无 key；独立卡 `src-ipquery` |
| https://weather.cma.cn/api/now/ | 中国气象局 | REMOVED | 第二批→2026-08-15 | CORS:*；不返回 IP，老板要求移出页面（仍可按域名去重，不重测）|
| https://ws.qunar.com/ips.jcp | 去哪儿网 | REMOVED | 第三批→2026-08-15 | JSONP(callback)；不返回 IP，老板要求移出页面 |

---

## 二、可用（USABLE · CORS，尚未部署）

| 源 URL | 名称 | 状态 | 批次 | 备注 |
|------|------|------|------|------|
| https://ip.apps.cntv.cn/whereis?client=json | 央视网 | USABLE(间歇/待复核) | 第二批 | 本测 reflects 本域 ACAO，但历史多次间歇失败；复活需重加 city_code→中文 映射（未加入本次）|

## 三、可用-JSONP（USABLE-JSONP · 需页面支持 `<script>` 加载）

| 源 URL | 名称 | 状态 | 批次 | 备注 |
|------|------|------|------|------|
| https://api.map.so.com/local?apikey=3a141df397801104f2bf&ad=1 | 360地图 | USABLE-JSONP | 第二批 | 无 CORS；JSONP 支持（带 Referer: https://map.360.cn/）；apikey 可能失效需确认（未加入本次）|

## 四、不可用（BLOCK）

| 源 URL | 名称 | 状态 | 批次 | 备注 |
|------|------|------|------|------|
| https://ip9.com.cn/get | ip9 | BLOCK | 第一批 | 无 CORS；60次/分钟 |
| http://ip-api.com/json/?lang=zh-CN | ip-api.com | BLOCK | 第一批 | 仅 HTTP→混合内容被拦；45次/分钟/源IP |
| http://www.nmc.cn/rest/position | 中央气象台 | BLOCK | 第二批 | 仅 HTTP→混合内容（CORS:* 但无用）|
| https://webapi.designkit.com/common/ip_location | 美图设计室 | BLOCK | 第二批 | 无 CORS（file:// 假阳性）；结构 {code,data}，IP 是 data 的键（data["1.2.3.4"]={city_id,province_id,country_id,nation_code,lat,lng}），province_id/city_id 为 GB/T2260 码 |
| https://webapi-pc.meitu.com/common/ip_location | 美图PC端 | BLOCK | 第三批 | Service offline |
| https://b.cloud.189.cn/getWebImUrl.action | 电信云 | BLOCK | 第三批 | 无 CORS |
| https://https-play-g3proxy.lecloud.com/vod/v2/ | 乐视云 | BLOCK | 第三批 | 420 非 IP 接口 |
| https://r.inews.qq.com/api/ip2city?otype=json | 腾讯新闻 | BLOCK | 第三批 | 403 |
| https://api.live.bilibili.com/client/v1/Ip/getInfoNew | Bilibili | BLOCK | 第三批 | 无 CORS |
| https://www.uc.cn/ip | UC浏览器 | BLOCK | 第三批 | 无 CORS；纯文本 IP |
| https://10000.gd.cn/getClientIP.php | 广东电信 | BLOCK | 第三批 | 不可达(000) |
| https://portal-portm.meituan.com/sully/v2/native/api/getSourceCityCdnList | 美团CDN | BLOCK | 第三批 | 无 CORS |
| https://httpdns.meituan.com/fetch?dm=httpdnsvip.meituan.com&appid=1 | 美团HTTPDNS | BLOCK | 第三批 | 无 CORS；非归属 |
| https://httpdns.kg.qq.com/api/v1/d?host=wns.kg.qq.com&sign=09f1e75d0296fc07e4aabef21cd1cc57 | 全民K歌 | BLOCK | 第三批 | 无 CORS |
| https://v6r.ipip.net/ | IPIP | BLOCK | 第四批 | 502 端点挂 |
| http://jsonip.com | jsonip | BLOCK | 第四批 | HTTP→混合内容；ACAO `*,*` 非标准 |
| http://httpbin.org/ip | httpbin | BLOCK | 第四批 | HTTP→混合内容；503 |
| https://ip.taobao.com/outGetIpInfo?accessKey=alibaba-inc&ip=114.114.114.114 | 淘宝 | BLOCK | 早期批 | 无 CORS；需指定 IP 参数 |
| https://apimobile.meituan.com/locate/v2/ip/loc?client_source=yourAppKey&rgeo=true&ip=1.1.11.1 | 美团 | BLOCK | 早期批 | 403 |
| https://disp-qryapi.3g.qq.com/v1/dispatch | 腾讯视频 | BLOCK | 早期批 | 无 CORS |
| https://opendata.baidu.com/api.php?co=&resource_id=6006&oe=utf8&query=1.1.1.1 | 百度OpenData | BLOCK | 早期批 | 无 CORS；需指定 IP 参数 |

## 五、第五批探测结果（2026-08-18 · 真实 CORS 探针）

> 探针：每源带 `Origin: https://ip.chaosection.top` + 真实 Chrome UA 请求（模拟本页发出），非服务器裸 curl 绕过 CORS。
> 铁律判定：HTTPS + `Access-Control-Allow-Origin`（CORS）即 `USABLE`；无 CORS / 端点失效为 `BLOCK`。

| 源 URL | 名称 | 状态 | 批次 | 备注 |
|------|------|------|------|------|
| https://ipwho.is/ | ipwho.is | DEPLOYED | 第五批 | 见一区（已上线 `src-ipwho`）|
| https://api.ipapi.is/ | ipapi.is | USABLE(限流) | 第五批 | 探针 CORS✓ ACAO:*；但本次 429「Free tier exhausted」免费额度耗尽，可靠性待观察/或需付费档 |
| https://free.freeipapi.com/api/json | FreeIPAPI.com | DEPLOYED | 第五批 | 见一区（已上线 `src-freeipapi`）|
| https://api.iplocate.io/ | IPLocate.io | USABLE(geo路径待确认) | 第五批 | 探针 base 仅返 IP(ACAO:*)；geo 需 `https://www.iplocate.io/api/lookup/<IP>`（本次未实测，待确认）；CORS✓ |
| https://get.geojs.io/v1/ip/geo.json | GeoJS.io | DEPLOYED | 第五批 | 见一区（已上线 `src-geojs`）|
| https://api.ipquery.io/?format=json | IPQuery.io | DEPLOYED | 第五批 | 见一区（已上线 `src-ipquery`）|
| https://api.ipregistry.co/ | ipregistry.co | USABLE(需key) | 第五批 | 探针 401/ACAO:*（无 key）；带 key 后 CORS 可用；免费 100k/月 |
| https://api.ipdata.co/ | ipdata.co | USABLE(需key) | 第五批 | 探针 401/ACAO:*（无 key）；带 key 后可用；免费 1500/月 |
| https://api.ip2location.io/ | IP2Location.io | BLOCK | 第五批 | 探针 200 返回完整geo，但**无 ACAO→浏览器跨域被拦**；且需 key。铁律下不可用 |
| https://ipwhois.app/json/ | ipwhois.app | BLOCK | 第五批 | 探针 403「Free plan 不支持 CORS」；付费档才开放。铁律下不可用 |
| https://api.ipinfo.es/ | IPInfo.ES | BLOCK | 第五批 | 探针 `/json` 与 `/<IP>/json` 均 404（端点无效）；CORS 头存在但无数据。不可用 |

---

## 对账记录（2026-08-19 整体对账）

以线上 `index.html`（本地仓库 blob `b31db9f` = 生产）为事实来源，逐卡枚举 19 个已部署逻辑源，与本表比对，修正如下：

1. **补录 4 个漏录的已部署源**（均已在模板中、生产已上线，表从未收录）：
   - `uapis.cn/api/v1/network/myip`（`src-uapis`，原生中文 地址+ISP+ASN）
   - `whois.pconline.com.cn/ipJson.jsp`（`src-pconline`，JSONP+GBK）
   - `bdip.chaosection.top/`（`src-bdip`，本域 Worker 回声）
   - `wimi-api-v4/v6.whatismyip.com/app/ip`（`src-wimi`，POST+DERIVE）
2. **状态纠正**：pconline 由 `BLOCK` 改为 `DEPLOYED(JSONP)`（页面以 JSONP 部署，非无 CORS 不可用）。
3. **URL 纠正**：`ip.sb` 由 `api.ip.sb/json` 改为实际 `api-ipv4.ip.sb/geoip/`（+`/ip` 子行）；`ipinfo.io` 由 `ipinfo.io/json` 改为实际 `ipinfo.io/ip` 子行。
4. **结构澄清**：明确 14 张独立卡 + 2 张聚合卡（`src-domestic` 3 子行、`src-overseas` 4 子行）的归属，避免"子源单列但不知落在哪张卡"的错位。
5. **DERIVE 映射核验**：`src-ipipnet`(618-625)、`src-pconline`(609-616)、`src-wimi`(642-646)、`src-geojs`(655-662)、`src-freeipapi`(649-653) 均实存在于 `index.html`，字段映射无误。
6. **bdip 铁律判定（2026-08-19 老板拍板）**：`bdip.chaosection.top` **不算违规**——本域 Cloudflare Worker 仅回显访客自身出口 IP（无第三方上游、不伪造），满足「保留访客真实出口 IP」立场，不触发铁律「禁服务器反代/Cloudflare Worker 同源代理路由」条款。状态已写为 DEPLOYED（去掉"铁律待确认"）。
7. **未部署候选**（不在一区，仍按域名去重）：cntv(USABLE间歇)、360地图(USABLE-JSONP)、ipapi.is/iplocate.io/ipregistry/ipdata(USABLE需key或限流)、ip2location/ipwhois/ipinfo.es(BLOCK)。

## 对账记录（2026-08-16 卡片拆分重构）

以线上 `index.html`（blob `add50b41`）为事实来源，按老板要求重构三张卡片：

1. **IP.SB 拆分**：原合并卡 `src-ipsb`（`api-ipv4.ip.sb/geoip/` 取地址/经纬度）移除，拆为两张独立纯 IP 卡：
   - `src-ipsb4` → `https://api-ipv4.ip.sb/jsonip`（返回 `{ip}`）
   - `src-ipsb6` → `https://api-ipv6.ip.sb/jsonip`（返回 `{ip}`）
   两卡均 CORS:*、浏览器直连、无 key；IP 行按返回值自动标注 IPv4/IPv6。
2. **ipinfo.io 升级独立卡**：原 `src-overseas` 子行 `ipinfo.io/ip`（纯 IP）移除，改为独立卡 `src-ipinfo` → `https://ipinfo.io/json`，**当前**字段：IP / 地址(country region city) / 运营商(org) / 经纬度(loc)；**2026-08-20 老板指示移除邮编(postal)与时区(timezone)**；缺失字段整行隐藏。
3. **src-overseas 收敛**：删去 ipinfo.io 与 api-ipv4/ipv6.ip.sb 三个子行，仅保留 ipify 子行（海外出口现由 `src-ipsb4`/`src-ipsb6`/`src-ipinfo` 独立呈现）。
4. **缺失字段处理（老板明确）**：并非每个 IP 都有全部字段，缺失字段直接从响应中省略（`.f-row` 整行 `display:none`），不返回空值——沿用既有 `fillSpan`/`setRow`/`cleanup` 逻辑，无需改 JS。
5. **部署与分叉消除**：走连接器 `create_or_update_file` 内联推送（commit `87fd5eb0`，blob `add50b41`，54751 字节）。推送后拉回比对发现相对本地草稿 2 字节漂移（单处 `<div>` 缩进多 2 空格，纯空白、功能无影响），已用 raw.githubusercontent 拉回 `add50b41` 精确字节覆盖本地仓库，消除分叉。生产 `ip.chaosection.top` 实测 HTTP 200 且三张新卡均在。

## 对账记录（2026-08-19 IP.SB 合并重做 · 仅本地、未上线）

按老板要求将 2026-08-16 拆出的 `src-ipsb4`/`src-ipsb6` 重新合并为单卡 `src-ipsb`：

1. **合并卡结构（2026-08-19 修正）**：单卡 `src-ipsb`，块级 `data-api="https://api.ip.sb/geoip"`（拉一次，回填 6 个 geo `f-row`）；IPv4 行 `data-api="https://api-ipv4.ip.sb/geoip"`、IPv6 行 `data-api="https://api-ipv6.ip.sb/geoip"`（各自直连、返回同 geoip 字段集含 `{ip}`、自动标协议）。沿用 `loadAll` 的「块级填无自带 data-api 子 span + 子 span 自带 data-api 独立拉」机制（与 `src-wimi` 同构）。**原 jsonip 按老板指示改为 geoip**。
2. **geo 字段来源**：老板给的 `https://api.ip.sb/jsonip/172.225.7.7` 实测 **404**（jsonip 家族仅返 `{ip}`，无 geo）。改用 `api.ip.sb/geoip`（页面搜索框已在用）返回字段集比对添加：地址(country/region/city)、运营商(organization)、ASN(asn/asn_organization)、经纬度(latitude,longitude)、邮编(postal_code)、时区(timezone)。`172.225.7.7` 正是 `geoip/<ip>` 回显示例 IP，印证比对意图。
3. **缺失字段**：沿用既有 `fillSpan`/`setRow`/`cleanup`——某源未返该字段则 `.f-row` 整行隐藏，不显示空值，符合「缺失字段直接从响应省略」。无需改 JS。
4. **本地校验**：合并卡在场、旧 `src-ipsb4`/`src-ipsb6` 已移除、`src-overseas` 仍仅 ipify；共 31 个 `.box`（15 独立卡 + 2 聚合卡 + 14 连通性卡）。
5. **部署状态（待令牌）**：按老板「禁用连接器内联」要求，推送须走字节级 PUT（PAT + Contents API）。当前环境无 PAT、无 `gh` CLI，GitHub 连接器为 OAuth 型不暴露令牌给 agent，且 agent 无重启连接器工具。基础 blob SHA 已取（`add50b41`，线上仍是旧拆分卡）。推送脚本 `push_ipsb_merge.py` 已就绪，**待 GitHub 令牌后运行**；运行即字节级精确 PUT 并校验 blob 一致。本次改动**仅落本地仓库、未上线**，生产仍为旧拆分卡。

## 维护约定
- 新增测试通过 `ip_api_probe.sh ip_endpoints.txt` 跑；新源先查本表，命中不打。
- 本表为去重唯一权威，且含探针请求头（如 360地图 `Referer: https://map.360.cn/`、美图设计室结构说明）。`ip_endpoints.txt` **不再单独留存**——探测前由本表筛"未测"行 + 备注里的头重新生成输入队列。
- 若发现某源状态变化（如央视网稳定性、360地图 apikey、pconline JSONP 可用性），更新对应行并标注日期。

## 独立卡字段统一顺序（2026-08-20 老板定 · 已上线）
- **适用范围**：除聚合卡 `src-domestic`/`src-overseas` 外**所有** `src-*` 独立卡（含 15 张现有卡 + 未来新卡直接复用）。
- **统一顺序**：IP → 地址 → ASN → 运营商 → 经纬度（IP 在 `ip-row`；后四字段在 `f-row`）。
- **缺失字段处理**：源端点不返某字段时，沿用既有 `fillSpan`/`setRow`——对应 `.f-row` 整行 `display:none`，不显示空值。所以**顺序按 TARGET_ORDER 单调递增取值即合规**（子集允许空缺），无需每卡补齐所有字段模板。
- **新卡片模板（直接复用）**：
  ```html
  <div class="box">
    <div class="box-title">源名称</div>
    <div class="box-info" id="src-xxx" data-api="https://.../geoip">
      <div class="ip-row"><span class="ip-lbl">IP</span>：<span class="ip-val" data-role="ip" data-tpl="{ip}">测试中...</span></div>
      <div class="f-row">地址：<span data-tpl="{country} {region} {city}">测试中...</span></div>
      <div class="f-row">ASN：<span data-tpl="{asn} {asn_organization}">测试中...</span></div>
      <div class="f-row">运营商：<span data-tpl="{organization}">测试中...</span></div>
      <div class="f-row">经纬度：<span data-tpl="{latitude},{longitude}">测试中...</span></div>
    </div>
  </div>
  ```
- **本次改动**：仅 src-ipsb 调整（地址→ASN→运营商→经纬度）；其他 14 张已合规无需改动。部署 commit `96ecc536`，blob `b780c06b`，54866 字节，local=remote 无漂移。

## 独立卡重排规则（2026-08-20 老板定 · 已上线）
- **范围**：除聚合卡 `src-domestic`/`src-overseas` 外的 15 张 `src-*` 独立卡。连通性测试卡（google/youtube/...共 10 张）保持原位，不参与重排。
- **规则**：**行数升序**（行数 = `ip-row` 数 + `f-row` 数，模板行数与 fillSpan 隐藏无关）；**同行数按 id 字典序**。
- **当前顺序（line up: 3→4→5→6 行）**：
  1. src-ipipnet (3)
  2. src-iqiyi (3)
  3. src-myipla (3)
  4. src-pconline (3)
  5. src-163 (4)
  6. src-ipinfo (4)
  7. src-bdip (5)
  8. src-freeipapi (5)
  9. src-geojs (5)
  10. src-hsselite (5)
  11. src-ipquery (5)
  12. src-ipwho (5)
  13. src-uapis (5)
  14. src-ipsb (6)
  15. src-wimi (6)
  16. src-domestic [聚合卡]
  17. src-overseas [聚合卡]
- **新卡片复用**：未来新增 `src-*` 独立卡插入时按当前规则插入对应位置；聚合卡 `src-domestic`/`src-overseas` 永远在 src-* 区域末尾。
- **部署 commit `b0bd64d2`**，blob `7d584a45`，54866 字节（与原文件同大小，纯重排），local=remote 无漂移。
- **⚠️ 故障记录**：首次推送时因脚本 `c2b` 转换+立即覆盖 local 形成**字节级计算错位**（new file 63527 vs orig 54866，差 8661），线上 main 被覆盖为损坏版本（30 张 src-*，独立卡重复一份）。**立即 revert 恢复**到 commit `96ecc536` 的正确版（commit `7f568ceeb`），然后以**先校验后推送**脚本（计算 `expected_region == old_region_bytes` 不符即 abort）重做，正确推送 commit `b0bd64d2`。修复要点：永远先打印 `bytes diff`，为 0 才允许推送。
- 第五批（ipwho.is / FreeIPAPI / GeoJS / IPQuery）4 卡片上线：commit `dc26c1c8`（2026-08-19，字节级 PUT，blob `25ae4bcf` 与本地一致）。
- 整体对账：2026-08-19 以生产 `index.html`(blob `b31db9f`) 为基准校正，见上「对账记录」。
