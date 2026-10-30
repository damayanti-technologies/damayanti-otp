# Damayanti SMS Gateway – Android Application Guide

**Package Name:** `com.damayanti.smsgateway`  
**Target Hardware:** Samsung Galaxy A35 (Android 14 / Upside Down Cake, API 34/35)  
**Cellular Carrier:** BSNL Mobile SIM  
**Build System:** Gradle 8.10.2 + Android Gradle Plugin 8.7.2 + Kotlin 2.0.21 + Java 21 JBR  

---

## 1. Generated APK Artifacts

All compiled, aligned, and signed APK packages are located in the repository root under `release-apk/`:

| APK File | Type | File Size | Description |
| :--- | :--- | :--- | :--- |
| `release-apk/damayanti-gateway-debug.apk` | **Debug APK** | **8.14 MB** | Built with Android debug certificate; suitable for developer testing and USB debugging. |
| `release-apk/damayanti-gateway-v1.0.0-release.apk` | **Signed Release APK** | **6.54 MB** | Optimized, zipaligned, and signed with the official Damayanti Technologies release key. |
| `release-apk/app-release.apk` | **Signed Release APK** | **6.54 MB** | Standard release alias for direct deployment and automated CI/CD pickup. |

---

## 2. Cryptographic Signature Verification

The release APK is verified using the official Android SDK `apksigner` tool:

```
Verifies: YES
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
Signer: CN=Damayanti Technologies, OU=Security, O=Damayanti Technologies, L=Bhubaneswar, ST=Odisha, C=IN
Key Algorithm: RSA 2048-bit
Validity: 10,000 days (~27 years)
```

---

## 3. Installation on Samsung Galaxy A35

### Method A: Direct Installation via ADB (Recommended)

1. Connect your Samsung Galaxy A35 to your Windows 11 laptop using a USB data cable.
2. On your Galaxy A35, open **Settings → Developer Options** and enable **USB Debugging**.
   *(If Developer Options is hidden, go to Settings → About Phone → Software Information and tap "Build number" 7 times).*
3. On your phone screen, accept the prompt: **"Allow USB debugging from this computer?"**.
4. Open PowerShell on your laptop and verify ADB connection:
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices -l
   ```
5. Install the signed release APK directly:
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "C:\Users\savva\.gemini\antigravity\scratch\damayanti-otp\release-apk\damayanti-gateway-v1.0.0-release.apk"
   ```

### Method B: Wireless / Direct Sideloading (No PC cable required)

1. Copy `damayanti-gateway-v1.0.0-release.apk` from `release-apk/` to your Samsung Galaxy A35 via Quick Share, Google Drive, WhatsApp, or local Wi-Fi.
2. Tap the APK file on your Galaxy A35 in **My Files / Downloads**.
3. If prompted by One UI, toggle **"Allow from this source"**.
4. Tap **Install**.

---

## 4. First-Time Phone Configuration & Permissions

Once the application is installed on your Samsung Galaxy A35:

1. **Launch App:** Open **Damayanti Gateway** from your launcher.
2. **Grant Permissions Transparently:**
   - **Send SMS:** Required by Android `SmsManager` to transmit outgoing OTP dispatch messages.
   - **Phone State:** Required to detect the active BSNL SIM card and SIM slot index (Slot 0 or Slot 1).
   - **Notifications:** Required to display the foreground service status indicator.
3. **Configure Backend URL:**
   - In the app connection settings, enter your laptop server URL:
     - Local Wi-Fi: `http://<your-laptop-lan-ip>:4000` (e.g. `http://192.168.1.5:4000`)
     - Cloudflare Tunnel / Public HTTPS: `https://otp-gateway.damayanti.online`
4. **Tap "Register Device":**
   - Handshakes with laptop backend `/api/v1/device/register`.
   - Obtains a 30-day authenticated bearer token and HMAC-SHA256 signing secret.
5. **Tap "Start Gateway Service":**
   - Spawns `GatewayForegroundService` with a persistent status notification in your notification tray.
   - Transmits heartbeat every 30 seconds.
   - Polls `/api/v1/device/poll-jobs` for queued SMS jobs and transmits via BSNL SIM.

---

## 5. How to Generate Future APK Updates

To sign subsequent version updates (e.g., `v1.0.1`, `v1.1.0`) so that existing installations can be upgraded seamlessly without uninstalling:

### Signing Credentials:
- **Keystore Location (Local only, git-ignored):** `android/keystore/damayanti-release.jks`
- **Key Alias:** `damayanti-gateway`
- **Store & Key Password:** `Damayanti@2026`

### Automated Build & Sign Command:
Run the following PowerShell command in the repository root:

```powershell
# 1. Compile release APK
cd C:\Users\savva\.gemini\antigravity\scratch\damayanti-otp\android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
.\gradlew.bat assembleRelease

# 2. Zipalign and sign with official key
$zipalign = "C:\Users\savva\AppData\Local\Android\Sdk\build-tools\34.0.0\zipalign.exe"
$apksigner = "C:\Users\savva\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat"
$keystore = "C:\Users\savva\.gemini\antigravity\scratch\damayanti-otp\android\keystore\damayanti-release.jks"
$src = "C:\Users\savva\.gemini\antigravity\scratch\damayanti-otp\android\app\build\outputs\apk\release\app-release-unsigned.apk"
$out = "C:\Users\savva\.gemini\antigravity\scratch\damayanti-otp\release-apk\damayanti-gateway-v1.0.0-release.apk"

& $zipalign -p -f -v 4 $src "release-aligned.apk"
& $apksigner sign --ks $keystore --ks-key-alias damayanti-gateway --ks-pass pass:Damayanti@2026 --key-pass pass:Damayanti@2026 --out $out "release-aligned.apk"
Remove-Item "release-aligned.apk" -Force
```

---

## 6. Android 14 Telephony Architecture Fixes Applied

1. **BroadcastReceiver Export Security (Android 14 / Upside Down Cake):**
   - Telephony radio ACK broadcasts originate from `com.android.phone`.
   - On Android 13/14+, receivers for system radio events must be registered with `Context.RECEIVER_EXPORTED`.
   - Fixed in `SmsTransmitter.kt` to ensure cellular tower delivery receipts are never silently dropped by OS security.
2. **Multipart SMS PendingIntent Alignment:**
   - In `SmsTransmitter.kt`, multipart SMS payloads are partitioned with `smsManager.divideMessage(text)`.
   - `smsManager.sendMultipartTextMessage` requires `sentIntents.size() == parts.size()`.
   - Corrected to dynamically repeat `sentIntent` for all message fragments.
3. **Dual-SIM BSNL Preference:**
   - `SimManagerHelper.kt` inspects carrier strings for `"BSNL"`, `"CellOne"`, or user-configured preferred slot.
   - Automatically directs `SmsManager` to the BSNL subscription ID without hardcoding.

---

## 7. Current Testing Status & Real-Device Constraints

- [x] **Gradle Build:** Clean compilation with 0 errors across 47 release tasks.
- [x] **Static & Manifest Analysis:** Fully valid adaptive icons (`ic_launcher`, `ic_launcher_round`), Proguard rules, and view binding.
- [x] **Security Scheme:** Verified v2 + v3 signature integrity.
- [x] **Backend Integration:** 26/26 automated Vitest integration tests passing.
- [!] **Telephony ACK Verification:** Must be verified on the physical Samsung Galaxy A35 with the active BSNL SIM inserted.
- [!] **Regulatory Compliance Note (India TRAI DLT):** Commercial transactional SMS messages in India typically require TRAI DLT template registration if sent via commercial sender IDs. Because the Samsung Galaxy A35 transmits directly using standard SIM P2P cellular channels, standard domestic cellular SMS rates and daily regulatory limits apply.
