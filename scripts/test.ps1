# ==============================================================================
# Damayanti OTP - Automated Test Runner
# Damayanti Technologies
# ==============================================================================

$backendDir = Join-Path $PSScriptRoot "..\backend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Running Damayanti OTP Automated Test Suite..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Push-Location $backendDir
try {
    & cmd.exe /c "npm.cmd run test"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "All tests passed successfully!" -ForegroundColor Green
    } else {
        Write-Error "Tests failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
