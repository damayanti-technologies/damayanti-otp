import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import argon2 from 'argon2';

const app = createApp();

const TEST_RAW_API_KEY = 'dmy_live_secret_test_suite_key_2026';
const TEST_PHONE = '+919876543210';
let testAppId: string;

beforeAll(async () => {
  // Ensure a test application and hashed API key exist in DB
  const testApp = await prisma.application.upsert({
    where: { appId: 'damayanti_test_app' },
    update: { isEnabled: true },
    create: {
      appId: 'damayanti_test_app',
      name: 'Damayanti Test Application',
      allowedOrigins: JSON.stringify(['http://localhost:3000']),
      isEnabled: true,
    },
  });
  testAppId = testApp.id;

  const keyHash = await argon2.hash(TEST_RAW_API_KEY, { type: argon2.argon2id });
  const existingKey = await prisma.aPIKey.findFirst({
    where: { applicationId: testAppId, name: 'Test Key' },
  });

  if (!existingKey) {
    await prisma.aPIKey.create({
      data: {
        applicationId: testAppId,
        keyPrefix: 'dmy_live_',
        keyHash,
        name: 'Test Key',
      },
    });
  }

  // Clear previous test OTP records for this phone
  await prisma.oTPRequest.deleteMany({
    where: {
      phoneNumber: { in: [TEST_PHONE, '+919999900001', '+919999900002', '+919999900003'] },
    },
  });
});

describe('Phase 2 - OTP Engine & Lifecycle Verification', () => {
  it('Rejects OTP request without X-Api-Key with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phoneNumber: TEST_PHONE });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Requests OTP with valid API key and normalizes phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ phoneNumber: '9876543210' }); // 10-digit raw Indian mobile

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('correlationId');
    expect(res.body).toHaveProperty('devCode');
    expect(res.body.devCode).toMatch(/^\d{6}$/);

    // Verify DB stored hashed OTP, never plaintext
    const dbRecord = await prisma.oTPRequest.findUnique({
      where: { correlationId: res.body.correlationId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.phoneNumber).toBe(TEST_PHONE);
    expect(dbRecord?.otpHash).toMatch(/^\$argon2id\$/);
    expect(dbRecord?.otpHash).not.toBe(res.body.devCode);
  });

  it('Enforces 60-second cooldown on immediate second request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ phoneNumber: TEST_PHONE });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('COOLDOWN_ACTIVE');
    expect(res.body.error.cooldownRemainingSeconds).toBeGreaterThan(0);
  });

  it('Verifies correct OTP code and creates login session', async () => {
    // Force reset cooldown for testing
    await prisma.oTPRequest.updateMany({
      where: { phoneNumber: '+919999900001' },
      data: { isInvalidated: true },
    });

    const reqRes = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ phoneNumber: '+919999900001' });

    expect(reqRes.status).toBe(200);
    const { correlationId, devCode } = reqRes.body;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ correlationId, code: devCode });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.status).toBe('VERIFIED');
    expect(verifyRes.body).toHaveProperty('sessionToken');
    expect(verifyRes.body.user.phoneNumber).toBe('+919999900001');

    // Test GET /api/v1/auth/session with returned session token
    const sessionRes = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${verifyRes.body.sessionToken}`);

    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.success).toBe(true);
    expect(sessionRes.body.user.phoneNumber).toBe('+919999900001');
  });

  it('Rejects incorrect OTP code and decrements remaining attempts', async () => {
    await prisma.oTPRequest.updateMany({
      where: { phoneNumber: '+919999900002' },
      data: { isInvalidated: true },
    });

    const reqRes = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ phoneNumber: '+919999900002' });

    const { correlationId } = reqRes.body;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ correlationId, code: '000000' }); // Wrong code

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.error.code).toBe('OTP_INVALID');
    expect(verifyRes.body.error.attemptsRemaining).toBe(4);
  });

  it('Prevents reuse of already verified OTP', async () => {
    const reqRes = await request(app)
      .post('/api/v1/auth/request-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ phoneNumber: '+919999900003' });

    const { correlationId, devCode } = reqRes.body;

    // First verification
    const firstVerify = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ correlationId, code: devCode });
    expect(firstVerify.status).toBe(200);

    // Second verification attempt with same code
    const secondVerify = await request(app)
      .post('/api/v1/auth/verify-otp')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({ correlationId, code: devCode });

    expect(secondVerify.status).toBe(400);
    expect(secondVerify.body.success).toBe(false);
    expect(secondVerify.body.error.code).toBe('OTP_INVALID');
  });
});
