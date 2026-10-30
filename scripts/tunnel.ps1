# ==============================================================================
# Damayanti OTP - Secure Remote Tunnel Helper (Cloudflare Tunnel)
# Damayanti Technologies
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Damayanti OTP - Secure Remote Tunnel Configuration" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script configures a private, encrypted outbound tunnel" -ForegroundColor Yellow
Write-Host "connecting your laptop server to external websites (e.g. arrout.damayanticrest.online)" -ForegroundColor Yellow
Write-Host "WITHOUT opening router ports, VPS hosting, or exposing public IP addresses." -ForegroundColor Yellow
Write-Host ""

Write-Host "Option A: Cloudflare Quick Tunnel (Free & Zero Config):" -ForegroundColor Green
Write-Host "  1. Download cloudflared: winget install Cloudflare.cloudflared" -ForegroundColor Gray
Write-Host "  2. Run quick tunnel: cloudflared tunnel --url http://localhost:4000" -ForegroundColor Gray
Write-Host "  3. Use the generated *.trycloudflare.com HTTPS URL in your website SDK." -ForegroundColor Gray
Write-Host ""

Write-Host "Option B: Named Tunnel for arrout.damayanticrest.online:" -ForegroundColor Green
Write-Host "  1. cloudflared tunnel login" -ForegroundColor Gray
Write-Host "  2. cloudflared tunnel create damayanti-auth" -ForegroundColor Gray
Write-Host "  3. Route hostname: cloudflared tunnel route dns damayanti-auth auth.damayanticrest.online" -ForegroundColor Gray
Write-Host "  4. cloudflared tunnel run damayanti-auth" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
