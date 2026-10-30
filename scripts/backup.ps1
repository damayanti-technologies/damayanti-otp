# ==============================================================================
# Damayanti OTP - Database Backup Script
# Damayanti Technologies
# ==============================================================================

$backendDir = Join-Path $PSScriptRoot "..\backend"
$dbPath = Join-Path $backendDir "prisma\dev.db"
$backupDir = Join-Path $PSScriptRoot "..\backups"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$targetFile = Join-Path $backupDir "dev_db_backup_$timestamp.db"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Backing up SQLite database..." -ForegroundColor Cyan
Write-Host " Source: $dbPath" -ForegroundColor Gray
Write-Host " Target: $targetFile" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

if (Test-Path $dbPath) {
    Copy-Item $dbPath $targetFile
    $size = (Get-Item $targetFile).Length / 1KB
    Write-Host "Backup completed successfully ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "Warning: Database file $dbPath does not exist yet. Run installation first." -ForegroundColor Yellow
}
