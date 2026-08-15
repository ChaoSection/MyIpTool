#!/usr/bin/env bash
# build.sh — 供 Cloudflare Workers Builds（Git 集成）使用的非交互构建脚本
# 由控制台 Builds 的 Deploy command 调用：bash build.sh
# 依赖控制台设置：
#   Build 变量 MT_KV_ID   —— 手动 `wrangler kv namespace create MT_KV` 得到的真实 id（必需）
#   Build 变量 WORKER_NAME（可选）—— Worker 名称，缺省默认 ip-toolbox
#   Secrets：BAIDU_API_KEY、BAIDU_SECRET_KEY、CLOUDFLARE_API_TOKEN（Workers 编辑权限，供 npx wrangler 登录）
set -e

TEMPLATE="wrangler-unified.toml.template"
TOML="wrangler-unified.toml"
[ -f "$TEMPLATE" ] || { echo "找不到 $TEMPLATE"; exit 1; }

# Worker 名称：缺省 ip-toolbox
WORKER_NAME="${WORKER_NAME:-ip-toolbox}"

# MT_KV id：必需
[ -n "$MT_KV_ID" ] || { echo "缺少 Build 变量 MT_KV_ID"; exit 1; }

# 用模板生成 toml（替换名称 + KV id）
sed -e "s/__WORKER_NAME__/$WORKER_NAME/" -e "s/__MT_KV_ID__/$MT_KV_ID/" "$TEMPLATE" > "$TOML"
echo "已生成 $TOML（Worker: $WORKER_NAME, MT_KV: $MT_KV_ID）"

npx wrangler deploy --config "$TOML"
