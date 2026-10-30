# Damayanti OTP – Architecture Specification

## 1. High-Level System Architecture

Damayanti OTP decouples the cryptographic authentication logic from physical SMS delivery:

```
[ Client Application ] -> (HTTPS POST /api/v1/auth/request-otp)
       │
       ▼
[ Damayanti Backend (Laptop Server) ]
       │ ── 1. Validate API Key & Origin
       │ ── 2. Enforce Rate Limits & Request ID
       │ ── 3. Generate Crypto 6-digit OTP
       │ ── 4. Hash OTP with Argon2id & Persist (Plaintext Discarded)
       │ ── 5. Insert SMSJob into Persistent Database Queue (QUEUED)
       ▼
[ Device Polling & Dispatch Engine ]
       ▲
       │ (Periodic Authenticated Polling over local Wi-Fi / Private Tunnel)
       │
[ Samsung Galaxy A35 Android Gateway ]
       │ ── 1. Fetch Assigned Job
       │ ── 2. Acknowledge Job (ASSIGNED -> SENDING)
       │ ── 3. Select BSNL SIM Subscription via SubscriptionManager
       │ ── 4. Transmit via Android SmsManager
       │ ── 5. Capture Radio Intent Confirmation
       │ ── 6. Report Submission Status (SUBMITTED / FAILED)
       ▼
[ Carrier Network (BSNL Cellular) ] -> [ End User Mobile Device ]
```

## 2. Key Design Principles

1. **Laptop Authority:** The Windows 11 laptop server is the sole source of truth for generating, approving, and verifying OTPs. The Android device is an unprivileged peripheral transmitter.
2. **Zero Plaintext Storage:** Neither OTP values, API keys, nor passwords are ever stored in plain text or emitted in logs.
3. **Status Disambiguation:** The system strictly separates `SENDING`, `SUBMITTED` (carrier accepted), and `FAILED`. A message is never falsely marked as delivered simply because the Android OS queued it.
4. **Resilience & Reconciliation:** SMS jobs are tracked with a state machine. In the event of network interruption between the phone and laptop, jobs are locked and reconciled rather than blindly re-transmitted, eliminating duplicate SMS deliveries.
