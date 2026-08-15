# deploy.ps1 — 自动解析 MT_KV id 并部署（无需手填真实 id，也不进仓库）
$ErrorActionPreference = 'Stop'
$template = 'wrangler-unified.toml.template'
$toml = 'wrangler-unified.toml'

if (-not (Test-Path $template)) { Write-Error "找不到 $template"; exit 1 }

# 1) 自动获取 MT_KV id
$id = $null
try {
    $raw = wrangler kv namespace list 2>$null
    $list = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($list) {
        $ns = $list | Where-Object { $_.title -eq 'MT_KV' } | Select-Object -First 1
        if ($ns) { $id = $ns.id }
    }
} catch {
    Write-Host "读取 KV 列表失败，转为尝试创建 / 手动输入"
}

# 2) 不存在则创建
if (-not $id) {
    try {
        $out = wrangler kv namespace create MT_KV 2>&1 | Out-String
        Write-Host $out
        if ($out -match 'id\s*=\s*"([a-f0-9]+)"') { $id = $Matches[1] }
    } catch {
        Write-Host "创建 MT_KV 失败"
    }
}

# 3) 仍拿不到，请用户粘贴
if (-not $id) {
    $id = Read-Host -Prompt "未能自动获取 MT_KV id，请粘贴 MT_KV 命名空间 id（wrangler kv namespace list 可查）"
}

if (-not $id) { Write-Error "缺少 MT_KV id，部署中止"; exit 1 }

# 4) 用模板生成 toml
$content = (Get-Content $template -Raw) -replace '__MT_KV_ID__', $id
Set-Content -Path $toml -Value $content -NoNewline
Write-Host "已生成 $toml（MT_KV id: $id）"

# 5) 部署
wrangler deploy --config $toml
