#!/usr/bin/env bash
# deploy.sh — 自动解析 MT_KV id 与 Worker 名称并部署（无需手填真实 id，也不进仓库）
set -e
TEMPLATE="wrangler-unified.toml.template"
TOML="wrangler-unified.toml"
[ -f "$TEMPLATE" ] || { echo "找不到 $TEMPLATE"; exit 1; }

# 1) Worker 名称：环境变量优先，否则提示（默认 ip-toolbox）
if [ -n "$WORKER_NAME" ]; then
  NAME="$WORKER_NAME"
else
  read -r -p "Worker 名称（回车默认 ip-toolbox）: " NAME
  NAME="${NAME:-ip-toolbox}"
fi

# 2) 自动获取 MT_KV id
ID=""
if command -v wrangler >/dev/null 2>&1; then
  NS=$(wrangler kv namespace list 2>/dev/null | grep -o '"title":"MT_KV"[^}]*}' || true)
  if [ -n "$NS" ]; then
    ID=$(echo "$NS" | grep -o '"id":"[a-f0-9]*"' | head -1 | sed 's/"id":"//;s/"//')
  fi
fi
# 3) 不存在则创建
if [ -z "$ID" ]; then
  OUT=$(wrangler kv namespace create MT_KV 2>&1 || true)
  echo "$OUT"
  ID=$(echo "$OUT" | grep -oE 'id = "[a-f0-9]+"' | head -1 | sed 's/id = "//;s/"//')
fi
# 4) 仍拿不到，请用户粘贴
if [ -z "$ID" ]; then
  read -r -p "未能自动获取 MT_KV id，请粘贴 MT_KV 命名空间 id: " ID
fi
[ -n "$ID" ] || { echo "缺少 MT_KV id，部署中止"; exit 1; }

# 5) 用模板生成 toml（替换名称 + KV id）
sed -e "s/__WORKER_NAME__/$NAME/" -e "s/__MT_KV_ID__/$ID/" "$TEMPLATE" > "$TOML"
echo "已生成 $TOML（Worker: $NAME, MT_KV id: $ID）"

# 6) 部署
wrangler deploy --config "$TOML"
