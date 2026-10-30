# Damayanti OTP – Deployment & Operational Guide

## 1. Local Network Topology (Windows 11 Laptop Server)

In the local development phase, the Samsung Galaxy Book 4 and the Samsung Galaxy A35 connect to the same trusted Wi-Fi router.

1. **Find Laptop Local IP:**
   ```powershell
   ipconfig | findstr /i "IPv4"
   # Example: 192.168.1.150
   ```
2. **Backend Binding:**
   The backend binds to `0.0.0.0:4000`, making it accessible on the local network at `http://192.168.1.150:4000`.
3. **Windows Firewall Rule:**
   Before external devices can reach port 4000, Windows Defender Firewall may prompt to allow Node.js on Private Networks.

---

## 2. Remote Connectivity Architecture (Phase 9 Preview)

To connect remote websites (such as `arrout.damayanticrest.online`) to the laptop without opening public router ports or exposing home IP addresses:
- **Option A (Recommended):** Cloudflare Zero Trust Tunnel (`cloudflared`). Maps an encrypted HTTPS tunnel directly to `localhost:4000`.
- **Option B:** WireGuard or Tailscale Mesh VPN between the laptop server and the production web server hosting `arrout.damayanticrest.online`.

---

## 3. Regulatory & Carrier Compliance (BSNL & TRAI DLT)

- **Development Mode:** The default mode `COMPLIANCE_MODE=DEVELOPMENT_MOCK` prevents sending physical SMS while you build and test logic.
- **Restricted Testing:** `COMPLIANCE_MODE=DEVELOPMENT_RESTRICTED` allows SMS only to authorized telephone numbers listed in `WHITELISTED_TEST_NUMBERS`.
- **Production Commercial Sending:** Indian TRAI guidelines require registration on a DLT portal (such as BSNL DLT / Vilpower) with approved Principal Entity (PE) ID, Sender Headers (e.g. `DMYOTP`), and registered Consent/Content Templates. Personal SIM cards should not be used for high-volume commercial blasts.
