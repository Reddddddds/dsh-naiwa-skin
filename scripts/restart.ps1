# restart-web.ps1 — 重启 DSH web 服务（皮肤/插件变更后使用）
# 用法: powershell -ExecutionPolicy Bypass -File scripts\restart.ps1
param(
  [int]$Port = 8086
)
$ErrorActionPreference = 'Stop'
$bin = 'C:\Users\30902\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\lib\bin.js'
$outLog = 'C:\Users\30902\.dsh\profiles\web\server.log'
$errLog = 'C:\Users\30902\.dsh\profiles\web\server.err.log'

Write-Host "[restart] stopping old server on :$Port ..."
$old = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty OwningProcess
if ($old) {
  Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

Write-Host "[restart] starting: node $bin --profile web"
$proc = Start-Process -FilePath 'node' -ArgumentList @($bin, '--profile', 'web') `
  -WorkingDirectory 'C:\Users\30902' `
  -RedirectStandardOutput $outLog -RedirectStandardError $errLog `
  -PassThru -WindowStyle Hidden

for ($i = 1; $i -le 60; $i++) {
  Start-Sleep -Seconds 1
  if ($proc.HasExited) {
    Write-Host "[restart] FAILED: node exited with $($proc.ExitCode)"
    if (Test-Path $errLog) { Get-Content $errLog -Tail 25 }
    exit 1
  }
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) {
      Write-Host "[restart] READY pid=$($proc.Id) after ${i}s -> http://127.0.0.1:$Port"
      exit 0
    }
  } catch { }
}
Write-Host "[restart] TIMEOUT waiting for :$Port"
exit 2
