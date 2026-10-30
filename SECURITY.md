# Damayanti OTP – Security Architecture & Threat Model

**Damayanti Technologies – Cybersecurity Policy**

---

## 1. Zero Plaintext OTP Policy
- OTP codes are generated using Node.js `crypto.randomInt(100000, 1000000)`.
- The raw code is hashed using **Argon2id** (memory-hard password hashing algorithm: `m=65536, t=3, p=4`) before storage in the database.
- The raw code is dispatched exclusively to the SMS transmission job payload and immediately removed from RAM.
- OTP values are **never logged**, never returned in API responses, and never stored in plain text.

## 2. Brute-Force & Enumeration Defenses
- **Maximum Verification Attempts:** 5 attempts per issued OTP. Upon the 5th failed attempt, the record is immediately invalidated (`isInvalidated = true`).
- **Expiry:** Strict 5-minute lifespan (`OTP_EXPIRY_SECONDS = 300`).
- **Resend Cooldown:** 60-second compulsory delay between OTP requests for the same phone number.
- **Rate Limiting:** Route-level and IP-level limits using `express-rate-limit`.

## 3. Device Pairing & Authentication
- The Android phone authenticates via short-lived bearer tokens and cryptographically signs outbound requests with HMAC-SHA256 using a shared device signing secret.
- Device requests include an incremental nonce or timestamp to prevent replay attacks.
- If a device misses 3 consecutive heartbeats (90 seconds), its status transitions to `OFFLINE`.
- Administrators can revoke a device key at any time, instantly dropping its authorization.

## 4. Input Sanitization & Payload Protection
- Strict runtime payload validation via **Zod**.
- Body payload size capped at **100 KB** to eliminate JSON memory-exhaustion attacks.
- Phone numbers are normalized to the **E.164 standard** (`+91XXXXXXXXXX`) before any database queries.

## 5. Structured Log Redaction
The logging system (`pino`) employs mandatory path redacting for:
- `req.headers.authorization`
- `req.headers.cookie`
- `req.headers['x-api-key']`
- `req.headers['x-device-token']`
- `req.body.otp`
- `req.body.password`
- `req.body.secret`
- `otpHash`
- `signingSecret`
