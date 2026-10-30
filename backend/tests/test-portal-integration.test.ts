import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();
const PORTAL_API_KEY = 'dmy_live_secret_dev_key_arrout_2026';
const TEST_PHONE = '+919876543210';

beforeAll(async () => {
  // Clear any active OTPs for this phone so cooldown does not trigger initially
  await prisma.oTPRequest.deleteMany({
    where: { phoneNumber: TEST_PHONE },
  });
});

describe('Damayanti OTP – Live Testing Portal Integration Suite', () => {
  let correlationId: string;
  let devCode: string;
  let sessionToken: string;

  it('Step 1: Verify Backend Connectivity and Diagnostic Telemetry', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('damayanti-otp-backend');
    expect(res.body).toHaveProperty('gateway');
    expect(res.body).toHaveProperty('queue');
    expect(res.body.database.connected).toBe(true);
  });

  it('Step 2: Request OTP via Test Portal (Mock Mode Dispatch)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', PORTAL_API_KEY)
      .send({ phoneNumber: TEST_PHONE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.correlationId).toBeDefined();
    expect(res.body.cooldownSeconds).toBe(60);
    expect(res.body.expiresInSeconds).toBe(300);
    expect(res.body.devCode).toMatch(/^\d{6}$/);

    correlationId = res.body.correlationId;
    devCode = res.body.devCode;
  });

  it('Step 3: Verify SMS Queue Job Status via API', async () => {
    const res = await request(app)
      .get(`/api/v1/sms/status?correlationId=${correlationId}`)
      .set('X-Api-Key', PORTAL_API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.job).toBeDefined();
    expect(res.body.job.recipientNumber).toBe(TEST_PHONE);
    expect(['QUEUED', 'ASSIGNED', 'SUBMITTED']).toContain(res.body.job.status);
  });

  it('Step 4: Test Resend Cooldown Protection (Should Reject Immediate Resend)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/resend-otp')
      .set('X-Api-Key', PORTAL_API_KEY)
      .send({ correlationId });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('COOLDOWN_ACTIVE');
  });

  it('Step 5: Test Incorrect OTP Submission (Must Reject & Decrement Attempts)', async () => {
    const wrongCode = devCode === '123456' ? '654321' : '112233';
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', PORTAL_API_KEY)
      .send({ correlationId, code: wrongCode });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('OTP_INVALID');
    expect(res.body.error.attemptsRemaining).toBe(4);
  });

  it('Step 6: Test Successful OTP Verification (Must Issue Session Token)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', PORTAL_API_KEY)
      .send({ correlationId, code: devCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('VERIFIED');
    expect(res.body.sessionToken).toBeDefined();
    expect(res.body.user.phoneNumber).toBe(TEST_PHONE);

    sessionToken = res.body.sessionToken;
  });

  it('Step 7: Test Session Validation via GET /api/v1/auth/session', async () => {
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phoneNumber).toBe(TEST_PHONE);
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('Step 8: Test Sign Out / Session Revocation via POST /api/v1/auth/logout', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ sessionToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify session is now rejected
    const checkRes = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(checkRes.status).toBe(401);
  });

  it('Step 9: Test Expired OTP Rejection', async () => {
    // Clear cooldown for fresh request
    await prisma.oTPRequest.deleteMany({ where: { phoneNumber: '+919999900008' } });

    const reqRes = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', PORTAL_API_KEY)
      .send({ phoneNumber: '+919999900008' });

    expect(reqRes.status).toBe(200);
    const expCorrelationId = reqRes.body.correlationId;
    const expDevCode = reqRes.body.devCode;

    // Simulate OTP expiration in database
    await prisma.oTPRequest.update({
      where: { correlationId: expCorrelationId },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    // Attempt verification with expired code
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', PORTAL_API_KEY)
      .send({ correlationId: expCorrelationId, code: expDevCode });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.error.code).toBe('OTP_EXPIRED');
  });
});
