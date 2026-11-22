# Stop existing
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 1

# Start Server
$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "c:\Users\soich\sunsun" -PassThru -WindowStyle Hidden

# Start Cloudflared Tunnel
$logPath = "c:\Users\soich\sunsun\tunnel.log"
if (Test-Path $logPath) { Remove-Item $logPath -Force }
$tunnel = Start-Process -FilePath "c:\Users\soich\sunsun\bin\cloudflared.exe" -ArgumentList "tunnel --url http://127.0.0.1:3001" -WorkingDirectory "c:\Users\soich\sunsun" -RedirectStandardError $logPath -PassThru -WindowStyle Hidden

# Poll for URL in log
$publicUrl = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logPath) {
        $raw = Get-Content $logPath -Raw
        if ($raw -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
            $publicUrl = $matches[1]
            break
        }
    }
}

if ($publicUrl) {
    Set-Content -Path "c:\Users\soich\sunsun\PUBLIC_URL.txt" -Value $publicUrl -Encoding utf8
    Write-Host "===================================================="
    Write-Host "PUBLIC_URL: $publicUrl"
    Write-Host "===================================================="
    Start-Sleep -Seconds 3
    # Verify local
    try {
        $localResp = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/health" -TimeoutSec 5
        Write-Host "LOCAL_HEALTH: OK"
    } catch {
        Write-Host "LOCAL_HEALTH_ERR: $_"
    }
} else {
    Write-Host "FAILED_TO_OBTAIN_URL"
}
