# Damayanti OTP – API Documentation (v1)

Base URL: `http://localhost:4000/api/v1`

---

## 1. System Health

### `GET /health`
Liveness check for container / process supervisors.
- **Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-10-30T17:35:00.000Z",
  "service": "damayanti-otp-backend"
}
```

### `GET /api/v1/health`
Readiness check verifying database connectivity, process memory, and compliance mode.
- **Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-10-30T17:35:00.000Z",
  "service": "damayanti-otp-backend",
  "version": "1.0.0",
  "uptimeSeconds": 42,
  "complianceMode": "DEVELOPMENT_MOCK",
  "database": {
    "connected": true,
    "latencyMs": 4
  }
}
```

---

## 2. Authentication APIs (`/api/v1/auth/*`)
All endpoints require `X-Api-Key` or `Authorization: Bearer <key>`.

### `POST /api/v1/auth/request-otp`
- **Request Body:**
```json
{
  "phoneNumber": "9876543210"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "correlationId": "068ba015-fae5-4f40-8b17-062e24d27f80",
  "cooldownSeconds": 60,
  "expiresInSeconds": 300
}
```

### `POST /api/v1/auth/verify-otp`
- **Request Body:**
```json
{
  "correlationId": "068ba015-fae5-4f40-8b17-062e24d27f80",
  "code": "123456"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "status": "VERIFIED",
  "sessionToken": "4e1a9c8f0b72a...",
  "user": {
    "id": "user-uuid",
    "phoneNumber": "+919876543210"
  }
}
```

### `POST /api/v1/auth/resend-otp`
- **Request Body:**
```json
{
  "correlationId": "068ba015-fae5-4f40-8b17-062e24d27f80"
}
```

### `POST /api/v1/auth/logout`
- **Headers:** `Authorization: Bearer <sessionToken>`
- **Response:** `200 OK` `{"success": true, "message": "Session terminated successfully"}`

### `GET /api/v1/auth/session`
- **Headers:** `Authorization: Bearer <sessionToken>`
- **Response:** `200 OK` `{"success": true, "user": {...}, "expiresAt": "..."}`

---

## 3. Device Management APIs (`/api/v1/device/*`)

### `POST /api/v1/device/register`
Pairs an Android phone with the server. Returns one-time credentials.
- **Request Body:**
```json
{
  "deviceId": "samsung_galaxy_a35_uuid",
  "name": "Samsung Galaxy A35 (BSNL Gateway)",
  "model": "SM-A356E",
  "androidVersion": "14",
  "simCarrier": "BSNL",
  "simSlot": 0
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "device": { "id": "...", "deviceId": "...", "name": "..." },
  "token": "dmy_dev_tok_...",
  "signingSecret": "64_char_hmac_secret"
}
```

### `POST /api/v1/device/heartbeat`
Keepalive sent every 30 seconds by the Android Foreground Service.
- **Headers:** `X-Device-Id`, `X-Device-Token`, `X-Device-Timestamp`, `X-Device-Signature`
- **Request Body:**
```json
{
  "batteryLevel": 88,
  "isCharging": true,
  "simCarrier": "BSNL",
  "simSlot": 0
}
```

### `POST /api/v1/device/poll-jobs`
Polls pending SMS jobs assigned to this device.
- **Response `200 OK`:**
```json
{
  "success": true,
  "count": 1,
  "jobs": [
    {
      "id": "job-uuid",
      "recipientNumber": "+919876543210",
      "messageBody": "Your Damayanti OTP verification code is: 123456.",
      "createdAt": "..."
    }
  ]
}
```

### `POST /api/v1/device/ack-job`
Reports radio transmission outcome.
- **Request Body:**
```json
{
  "jobId": "job-uuid",
  "status": "SUBMITTED",
  "rawResponse": "RESULT_OK: Message submitted to cellular radio"
}
```

---

## 4. Administrative APIs (`/api/v1/admin/*`)
Requires `X-Admin-Secret: <SESSION_SECRET>` or Admin Bearer Token.

- `GET /api/v1/admin/dashboard` - Global KPIs & metrics
- `GET /api/v1/admin/messages` - Paginated SMS job history
- `GET /api/v1/admin/devices` - Registered devices list
- `GET /api/v1/admin/statistics` - 7-day usage time-series
- `POST /api/v1/admin/device/disable` - Disable a device
