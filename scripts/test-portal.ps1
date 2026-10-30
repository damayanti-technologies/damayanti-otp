# ==============================================================================
# Damayanti OTP - Live Testing Portal Launcher
# Damayanti Technologies
# ==============================================================================

$portalDir = Join-Path $PSScriptRoot "..\test-portal"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Damayanti OTP Live Testing Portal..." -ForegroundColor Cyan
Write-Host " Website URL: http://localhost:5000" -ForegroundColor Green
Write-Host " Authoritative Server: http://localhost:4000" -ForegroundColor Green
Write-Host " Branded: DAMAYANTI OTP" -ForegroundColor Yellow
Write-Host " Tagline: Secure Authentication. Your Own Infrastructure." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

Push-Location $portalDir
try {
    if (!(Test-Path "node_modules")) {
        Write-Host "Installing test portal dependencies..." -ForegroundColor Gray
        & cmd.exe /c "npm.cmd install"
    }
    & cmd.exe /c "npm.cmd run dev"
} finally {
    Pop-Location
}
