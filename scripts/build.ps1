# ==============================================================================
# Damayanti OTP - Build Script
# Damayanti Technologies
# ==============================================================================

$backendDir = Join-Path $PSScriptRoot "..\backend"
$dashboardDir = Join-Path $PSScriptRoot "..\dashboard"
$portalDir = Join-Path $PSScriptRoot "..\test-portal"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Building Damayanti OTP Platform..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build Backend
Write-Host "[1/3] Compiling Backend (TypeScript)..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    & cmd.exe /c "npm.cmd run build"
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Write-Host "  -> Backend dist/ compiled successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# 2. Build Dashboard
Write-Host "[2/3] Compiling Admin Dashboard (React + Tailwind + Vite)..." -ForegroundColor Yellow
Push-Location $dashboardDir
try {
    & cmd.exe /c "npm.cmd run build"
    if ($LASTEXITCODE -ne 0) { throw "Dashboard build failed" }
    Write-Host "  -> Dashboard dist/ compiled successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# 3. Build Test Portal
Write-Host "[3/3] Compiling Live Testing Portal (React + Tailwind + Vite)..." -ForegroundColor Yellow
Push-Location $portalDir
try {
    & cmd.exe /c "npm.cmd run build"
    if ($LASTEXITCODE -ne 0) { throw "Test Portal build failed" }
    Write-Host "  -> Test Portal dist/ compiled successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " All components built successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
