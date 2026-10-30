# Damayanti SMS Gateway – Android Configuration Guide

**Target Hardware:** Samsung Galaxy A35  
**Operating System:** Android 14+ (One UI 6+)  
**Carrier SIM:** Bharat Sanchar Nigam Limited (BSNL)  
**Package Name:** `com.damayanti.smsgateway`

---

## 1. Operating Concept
The Android device operates as an outbound-only transmission gateway. It connects to the Windows 11 laptop server over the local network (or private tunnel) using mutual cryptographic authentication. It polls for jobs assigned by the backend, transmits them through the BSNL SIM via `SmsManager`, and reports delivery intents back to the server.

## 2. Required Permissions
The application requests the following Android runtime permissions:
- `android.permission.SEND_SMS` – Hardware SMS dispatch via BSNL SIM.
- `android.permission.READ_PHONE_STATE` – Telephony carrier detection & SIM slot mapping.
- `android.permission.FOREGROUND_SERVICE` – Continuous operation while screen is off.
- `android.permission.POST_NOTIFICATIONS` – Foreground service status notification.
- `android.permission.INTERNET` – HTTPS communication with the laptop server.

## 3. Battery Optimization & Background Execution
To ensure Samsung One UI does not pause the gateway service when the phone is locked:
1. Navigate to **Settings -> Apps -> Damayanti SMS Gateway**.
2. Tap **Battery** and select **Unrestricted**.
3. Under **Permissions**, ensure **Pause app activity if unused** is turned **OFF**.
4. The application uses a Foreground Service displaying an ongoing notification with real-time connectivity status and an immediate **Pause Gateway** toggle switch.

## 4. Multi-SIM & Carrier Selection
On dual-SIM devices:
- The app interrogates `SubscriptionManager.getActiveSubscriptionInfoList()`.
- It identifies the SIM with `carrierName == "BSNL"` (or matching MNC/MCC).
- The user can explicitly lock the transmitter to SIM Slot 1 or SIM Slot 2 from the Settings screen.
