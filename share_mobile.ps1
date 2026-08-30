# TrackMate - Auto-Reconnecting Mobile Share Tunnel
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Generating Secure Mobile HTTPS Link for TrackMate..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

while ($true) {
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:localhost:3000 serveo.net
    Write-Host "Tunnel disconnected. Reconnecting in 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

