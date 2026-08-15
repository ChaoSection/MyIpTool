#!/usr/bin/env bash
# deploy.sh — 自动解析 MT_KV id 并部署（无需手填真实 id，也不进仓库）
set -e
TEMPLATE="wrangler-unified.toml.template"
TOML="wrangler-unified.toml"
[ -f "$TEMPLATE" ] || { echo "找不到 $TEMPLATE"; exit 1; }

ID=""
# 1) 自动获取
if command -v wrangler >/dev/null 2>&1; then
  NS=$(wrangler kv namespace list 2>/dev/null | grep -o '"title":"MT_KV"[^}]*}' || true)
  if [ -n "$NS" ]; then
    ID=$(echo "$NS" | grep -o '"id":"[a-f0-9]*"' | head -1 | sed 's/"id":"//;s/"//')
  fi
fi
# 2) 不存在则创建
if [ -z "$ID" ]; then
  OUT=$(wrangler kv namespace create MT_KV 2>&1 || true)
  echo "$OUT"
  ID=$(echo "$OUT" | grep -oE 'id = "[a-f0-9]+"' | head -1 | sed 's/id = "//;s/"//')
fi
# 3) 仍拿不到，请用户粘贴
if [ -z "$ID" ]; then
  read -r -p "未能自动获取 MT_KV id，请粘贴 MT_KV 命名空间 id: " ID
fi
[ -n "$ID" ] || { echo "缺少 MT_KV id，部署中止"; exit 1; }

# 4) 用模板生成 toml
sed "s/__MT_KV_ID__/$ID/" "$TEMPLATE" > "$TOML"
echo "已生成 $TOML（MT_KV id: $ID）"

# 5) 部署
wrangler deploy --config "$TOML"
