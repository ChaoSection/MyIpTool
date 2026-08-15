#!/usr/bin/env bash
# build.sh — 供 Cloudflare Workers Builds（Git 集成）使用的部署脚本
# 部署命令（Builds 控制台）：bash build.sh
# 依赖 Build 密钥：CLOUDFLARE_API_TOKEN（Workers 编辑权限，供 npx wrangler 鉴权）
# 运行时密钥（Worker Secrets，不进仓库，控制台一次性添加）：BAIDU_API_KEY、BAIDU_SECRET_KEY
# 仓库根 wrangler.toml 已声明 main + assets（真实 Worker），本脚本直接部署，无需模板替换。
set -e
npx wrangler deploy
