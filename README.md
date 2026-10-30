# Damayanti OTP – Self-Hosted Authentication Platform

**Owner:** Damayanti Technologies  
**Mission:** Complete, sovereign, self-hosted OTP authentication platform without reliance on paid or third-party SMS gateway providers (e.g., Twilio, MSG91, Firebase Phone Auth, Meta WhatsApp API).

---

## Hardware & Architecture Highlights

- **Server Host:** Windows 11 Laptop (Samsung Galaxy Book 4, 16 GB RAM) hosting the authoritative Node.js + Express + TypeScript Core API, Prisma ORM, SQLite/PostgreSQL Database, and React Dashboard on `http://localhost:4000`.
- **SMS Gateway Transmitter:** Samsung Galaxy A35 Android phone equipped with an active BSNL SIM card, running the native Kotlin `Damayanti SMS Gateway` application (`com.damayanti.smsgateway`).
- **Network Model:** Outbound authenticated requests from Android device to laptop server via short-lived tokens and HMAC-SHA256 request signatures. The phone never accepts unsolicited incoming commands and never independently generates or validates OTPs.

---

## Monorepo Layout

```
damayanti-otp/
├── backend/                  # Node.js + Express + TypeScript + Prisma Engine
│   ├── src/
│   │   ├── config/           # Zod environment configuration
│   │   ├── constants/        # Status enums (JobStatus, DeviceStatus, ErrorCode)
│   │   ├── controllers/      # Auth, Device, SMS, and Admin controllers
│   │   ├── db/               # PrismaClient singleton with health check probe
│   │   ├── middlewares/      # ApiKey, DeviceAuth, AdminAuth, RateLimiter, Error
│   │   ├── routes/           # REST endpoints (/api/v1/*)
│   │   ├── services/         # OTP engine, SMS queue, Device pairing, Crypto
│   │   └── utils/            # Zero-leak logger, phone number normalizer
│   ├── prisma/               # Database schema & seed scripts
│   └── tests/                # 26 automated integration & unit tests
├── android/                  # Native Android Kotlin SMS Gateway application
│   └── app/src/main/
│       ├── AndroidManifest.xml # SMS, phone state, and foreground service permissions
│       ├── java/com/damayanti/smsgateway/
│       │   ├── data/         # Models, GatewayPreferences, GatewayApiClient
│       │   ├── service/      # GatewayForegroundService (30s heartbeat & polling)
│       │   ├── telephony/    # SimManagerHelper (BSNL detection) & SmsTransmitter
│       │   └── ui/           # MainActivity dashboard & diagnostics
│       └── res/              # Dark Navy/Violet Material 3 resources
├── dashboard/                # Admin Web UI (React, Vite, TypeScript, Tailwind)
│   ├── src/
│   │   ├── components/       # Sidebar, Header, StatCard
│   │   ├── views/            # Overview, Apps, Gateway, Devices, Messages, Security
│   │   └── services/         # API integration client
│   └── dist/                 # Pre-compiled static assets served by backend
├── sample-portal/            # Website Integration Demo (arrout.damayanticrest.online)
│   ├── index.html            # Interactive OTP login interface
│   └── damayanti-auth.js     # Standalone Client SDK
├── scripts/                  # Windows 11 PowerShell automation scripts
│   ├── install.ps1           # Full platform installer & DB synchronizer
│   ├── dev.ps1               # Server & Dashboard launcher
│   ├── build.ps1             # Backend & Dashboard compiler
│   ├── test.ps1              # Automated test runner (26/26 tests)
│   ├── backup.ps1            # Timestamped SQLite database backup utility
│   └── tunnel.ps1            # Cloudflare Zero Trust Tunnel setup helper
├── backups/                  # Database backups
├── README.md                 # Project guide
├── ARCHITECTURE.md           # Architecture specifications & state machine
├── API_DOCUMENTATION.md      # Full REST API endpoint reference
├── SECURITY.md               # Cryptographic security & threat defenses
├── ANDROID_SETUP.md          # Samsung Galaxy A35 & BSNL configuration
└── DEPLOYMENT.md             # Windows 11 network & compliance guide
```

---

## Quick Start on Windows 11

### 1. Prerequisites
- **Node.js:** v20+ or v24+ (Installed: v24.21.0)
- **npm:** v11+
- **Android Studio & SDK:** Installed for Android development
- **Git:** Installed

### 2. Run Automated Test Suite (26/26 Tests)
```powershell
cd C:\Users\savva\.gemini\antigravity\scratch\damayanti-otp
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

### 3. Build All Components (Backend & Dashboard)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1
```

### 4. Start the Server & Admin Dashboard
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```
- **Admin Dashboard & API:** Open `http://localhost:4000`
- **Health Probe:** `http://localhost:4000/health`
- **Sample Client Portal (`arrout.damayanticrest.online` demo):** Open `sample-portal\index.html` in any browser

---

## Android Gateway APK Packages (Samsung Galaxy A35)

Ready-to-install packages are generated and stored in `release-apk/`:
- **Debug APK:** [`release-apk/damayanti-gateway-debug.apk`](file:///C:/Users/savva/.gemini/antigravity/scratch/damayanti-otp/release-apk/damayanti-gateway-debug.apk) (8.14 MB)
- **Signed Release APK:** [`release-apk/damayanti-gateway-v1.0.0-release.apk`](file:///C:/Users/savva/.gemini/antigravity/scratch/damayanti-otp/release-apk/damayanti-gateway-v1.0.0-release.apk) (6.54 MB)
- **Installation Guide:** Refer to [`android/README.md`](file:///C:/Users/savva/.gemini/antigravity/scratch/damayanti-otp/android/README.md) for ADB install commands and BSNL SIM configuration.

---

## All Completed Phases

- [x] **Phase 1 – Project Foundation:** Monorepo, Node.js + Express + TypeScript, Prisma SQLite database, health endpoints, automated testing suite, Windows 11 scripts.
- [x] **Phase 2 – OTP Engine:** Cryptographic 6-digit OTP generator, Argon2id hashing, 5-minute expiry, 5-attempt limit, 60s cooldown, mock SMS delivery adapter.
- [x] **Phase 3 – SMS Queue System:** Persistent DB-backed SMS queue, status reconciliation (QUEUED, ASSIGNED, SENDING, SUBMITTED, FAILED, EXPIRED), duplicate prevention, worker dispatcher.
- [x] **Phase 4 – Android Application:** Kotlin Android app `com.damayanti.smsgateway`, Material 3 UI, SIM subscription manager, Android SmsManager, Foreground service.
- [x] **Phase 5 – Device Communication:** Mutual authentication, device pairing, short-lived tokens, HMAC-SHA256 request signing, 30-second heartbeat.
- [x] **Phase 6 – Real SMS Dev Test:** Compliance gate, TRAI/DLT rules check, restricted whitelist testing with authorized personal test numbers via BSNL SIM.
- [x] **Phase 7 – Admin Dashboard:** React + TypeScript + Tailwind CSS, Dark Navy/Violet UI, live statistics, devices management, message history, API key generation.
- [x] **Phase 8 – Website Integration:** Client SDK wrapper (`damayanti-auth.js`) and sample portal simulating `arrout.damayanticrest.online`.
- [x] **Phase 9 – Remote Connectivity:** Secure private tunnel configuration script (`tunnel.ps1`) without public IP port forwarding.
- [x] **Phase 10 – Production Readiness:** Automated backups (`backup.ps1`), monitoring health check, recovery runbook, security auditing.
