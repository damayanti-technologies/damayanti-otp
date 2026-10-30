# ==============================================================================
# Damayanti OTP - Development Server Launcher
# Damayanti Technologies
# ==============================================================================

$backendDir = Join-Path $PSScriptRoot "..\backend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Damayanti OTP Server & Admin Dashboard..." -ForegroundColor Cyan
Write-Host " Server Host: http://localhost:4000" -ForegroundColor Green
Write-Host " Admin Dashboard: http://localhost:4000" -ForegroundColor Green
Write-Host " Sample Client Portal: Open sample-portal\index.html" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

Push-Location $backendDir
try {
    & cmd.exe /c "npm.cmd run dev"
} finally {
    Pop-Location
}
