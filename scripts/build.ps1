# ==============================================================================
# Damayanti OTP - Build Script
# Damayanti Technologies
# ==============================================================================

$backendDir = Join-Path $PSScriptRoot "..\backend"
$dashboardDir = Join-Path $PSScriptRoot "..\dashboard"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Building Damayanti OTP Platform..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build Backend
Write-Host "[1/2] Compiling Backend (TypeScript)..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    & cmd.exe /c "npm.cmd run build"
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Write-Host "  -> Backend dist/ compiled successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# 2. Build Dashboard
Write-Host "[2/2] Compiling Admin Dashboard (React + Tailwind + Vite)..." -ForegroundColor Yellow
Push-Location $dashboardDir
try {
    & cmd.exe /c "npm.cmd run build"
    if ($LASTEXITCODE -ne 0) { throw "Dashboard build failed" }
    Write-Host "  -> Dashboard dist/ compiled successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " All components built successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
