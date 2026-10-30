# ==============================================================================
# Damayanti OTP - Installation Script for Windows 11
# Damayanti Technologies
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Damayanti OTP - Environment Setup & Installation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Inspect Node.js & npm
Write-Host "[1/5] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVer = & node -v
    Write-Host "  -> Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Error "Node.js is not found on PATH. Please install Node.js v20+ or v24+."
}

# 2. Inspect Java & Android Studio
Write-Host "[2/5] Checking Android Toolchain..." -ForegroundColor Yellow
$asJbrPath = "C:\Program Files\Android\Android Studio\jbr\bin\java.exe"
if (Test-Path $asJbrPath) {
    $javaVer = & $asJbrPath -version 2>&1 | Select-Object -First 1
    Write-Host "  -> Android Studio OpenJDK detected: $javaVer" -ForegroundColor Green
} else {
    Write-Host "  -> Note: Android Studio JBR not at default path. Ensure Java 17/21 is on PATH." -ForegroundColor Gray
}

# 3. Setup backend environment file
Write-Host "[3/5] Checking backend environment configuration..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "..\backend"
$envFile = Join-Path $backendDir ".env"
$envExample = Join-Path $PSScriptRoot "..\.env.example"

if (-not (Test-Path $envFile)) {
    Write-Host "  -> Copying .env.example to backend/.env..." -ForegroundColor Gray
    Copy-Item $envExample $envFile
    Write-Host "  -> backend/.env created. Remember to configure secrets for production." -ForegroundColor Green
} else {
    Write-Host "  -> backend/.env already exists." -ForegroundColor Green
}

# 4. Install backend dependencies
Write-Host "[4/5] Installing backend dependencies..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    & cmd.exe /c "npm.cmd install"
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "  -> Dependencies installed successfully." -ForegroundColor Green

    # 5. Initialize database & Prisma
    Write-Host "[5/5] Generating Prisma client & synchronizing database..." -ForegroundColor Yellow
    & cmd.exe /c "npx.cmd prisma generate"
    & cmd.exe /c "npx.cmd prisma db push"
    & cmd.exe /c "npx.cmd tsx prisma/seed.ts"
    Write-Host "  -> Prisma Client generated and database seeded." -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Installation completed successfully!" -ForegroundColor Green
Write-Host " Run .\scripts\dev.ps1 to start the backend server." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
