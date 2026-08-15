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
- 中文翻译：百度翻译代理，按 GB/T 2260-2007 静态表 + 百度翻译兜底，把归属地字段译为中文
- bdip 卡片重标为 Cloudflare

## 架构

```
cf-mt-worker.js              # Cloudflare Worker：翻译接口（/mt/text 等）+ Static Assets 托管页面
wrangler-unified.toml.template  # 统一部署配置模板（Worker + KV + 密钥 + assets，含占位符）
public/index.html            # 站点页面（声明式渲染，唯一页面源）
```

- 一个 Worker 通过 **Static Assets** 同时托管 `public/index.html` 与处理翻译路由 `/mt/*`
- 页面内 `BAIDU_WORKER = './cf-mt-worker.js'`（同域相对路径，无 CORS）
- 部署后页面与翻译同域一体，无需额外 Worker 路由
- `wrangler-unified.toml` 由部署脚本从 `.template` 生成（含真实 KV id / Worker 名称），已 gitignore，不进仓库

## 部署

### 本地部署

```bash
# 1. 安装并登录 wrangler
npm i -g wrangler
wrangler login

# 2. KV 命名空间：无需手动——部署脚本会自动读取/创建 MT_KV 并填入 id
#    （如需手动：wrangler kv namespace create MT_KV，记录返回的 id）

# 3. 注入百度翻译密钥（不落盘，仅存于 Cloudflare，首次部署后执行一次）
wrangler secret put BAIDU_API_KEY
wrangler secret put BAIDU_SECRET_KEY

# 4. 部署（须在仓库根目录执行；脚本会生成 wrangler-unified.toml 并 wrangler deploy）
#    Windows（PowerShell）：     ./deploy.ps1
#    Git Bash / macOS / Linux：  ./deploy.sh
#    （脚本会提示 Worker 名称，回车即默认 ip-toolbox；KV id 自动读取/创建）

# 5. （可选）自定义域名：在 Cloudflare 给 ip.example.com 加路由 <worker>/* → 该 Worker
```

### 通过 GitHub 自动部署（Cloudflare Workers Builds）

把仓库连到 Cloudflare，每次 `git push` 自动构建并部署，无需本地运行 wrangler。

**控制台配置**

1. Dashboard → **Workers & Pages** → 新建或选择 Worker → **Settings → Builds** → **Connect Git repository**
2. 授权 GitHub，选择本仓库（如 `ChaoSection/MyIpTool`）
3. 分支：`main`；**Root directory**：`/`
4. **Deploy command**：`bash build.sh`
5. 保存

**需要在控制台设置**

- **Build 变量（非机密）**
  - `MT_KV_ID`：手动执行 `wrangler kv namespace create MT_KV` 得到的真实 id（必需）
  - `WORKER_NAME`（可选）：Worker 名称，缺省默认 `ip-toolbox`（与模板占位符一致即可）
- **Secrets（机密）**
  - `BAIDU_API_KEY`、`BAIDU_SECRET_KEY`：百度翻译密钥（与 `wrangler secret put` 同源）
  - `CLOUDFLARE_API_TOKEN`：具备 Workers 编辑权限的 API Token，供 `npx wrangler` 在 CI 登录

**说明**

- `build.sh` 用 `MT_KV_ID` / `WORKER_NAME` 把模板占位符替换成真实值，生成 `wrangler-unified.toml`（已被 gitignore，不进仓库），再执行 `npx wrangler deploy --config wrangler-unified.toml`
- Workers Builds **不读取** `wrangler.toml` 内的 `[build]` 段，构建命令以控制台 Builds 填写为准；密钥 / 绑定以控制台设置为准
- 仓库内永远只包含模板占位符，不含任何真实 id 或密钥

## 如何获取部署参数

部署前需要准备以下参数，全部通过 Cloudflare / 百度控制台获取，**不要写进仓库**（Worker 名称为可选，缺省 `ip-toolbox`）：

| 参数 | 用途 | 获取方式 |
|---|---|---|
| `WORKER_NAME`（可选） | 部署后的 Worker 名称 / 访问地址前缀 | 模板占位符 `__WORKER_NAME__`，部署时填写或沿用默认 `ip-toolbox`；部署后自动分配 `<name>.<subdomain>.workers.dev`，自定义域名需在 Cloudflare DNS + Routes 配置 |
| `MT_KV` 的 id | 缓存百度 token + 限流计数（KV 绑定，必需） | **部署脚本自动完成**（自动读取；没有则自动创建），无需手动写；手动查：`wrangler kv namespace list`；手动建：`wrangler kv namespace create MT_KV` |
| `BAIDU_API_KEY` | 百度翻译 API 鉴权 | 百度翻译开放平台 <https://fanyi-api.baidu.com/> → 控制台 → 创建应用（通用翻译服务）→ 获取 API Key |
| `BAIDU_SECRET_KEY` | 百度翻译 API 鉴权 | 同上，与 API Key 配对获取 Secret Key |

> 密钥通过 `wrangler secret put` 或控制台 Secrets 注入，存于 Cloudflare，不在代码或仓库中明文出现。`wrangler-unified.toml` 里仅保留 KV 绑定的 id 与名称占位，真实值由部署脚本 / CI 变量填充。

## 回退

删除自定义域名上的 Worker 路由即可恢复原有站点（若保留 Pages 项目）；本仓库不含 Pages 配置，纯 Worker 部署。

## 目录

```
.
├── cf-mt-worker.js            # Worker 代码（翻译路由 + 页面托管）
├── wrangler-unified.toml.template  # 部署配置模板（含 __WORKER_NAME__ / __MT_KV_ID__ 占位符）
├── build.sh                  # 供 Cloudflare Workers Builds（Git 集成）自动部署
├── deploy.sh                 # 本地部署（Git Bash / macOS / Linux）
├── deploy.ps1                # 本地部署（Windows PowerShell）
├── public/
│   └── index.html            # 站点页面（唯一页面源）
└── README.md
```

