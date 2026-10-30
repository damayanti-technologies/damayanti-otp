import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { CryptoService } from '../src/services/crypto.service.js';
import { QueueService } from '../src/services/queue.service.js';
import { JobStatus } from '../src/constants/status.js';

const app = createApp();

let registeredDeviceId: string;
let deviceToken: string;
let signingSecret: string;
let testAppId: string;

beforeAll(async () => {
  await prisma.sMSLog.deleteMany({});
  await prisma.sMSJob.deleteMany({});

  const testApp = await prisma.application.upsert({
    where: { appId: 'damayanti_test_app' },
    update: {},
    create: {
      appId: 'damayanti_test_app',
      name: 'Damayanti Test Application',
      allowedOrigins: '[]',
      isEnabled: true,
    },
  });
  testAppId = testApp.id;
});

describe('Phase 4 & 5 - Device Pairing, Heartbeat & Authenticated Communication', () => {
  it('POST /api/v1/device/register pairs new Samsung Galaxy A35 and returns credentials', async () => {
    const res = await request(app)
      .post('/api/v1/device/register')
      .send({
        deviceId: 'samsung_galaxy_a35_hardware_uuid_101',
        name: 'Samsung Galaxy A35 (BSNL Gateway)',
        model: 'SM-A356E',
        androidVersion: '14',
        simCarrier: 'BSNL',
        simSlot: 0,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('signingSecret');
    expect(res.body.device.name).toContain('Samsung Galaxy A35');

    registeredDeviceId = res.body.device.deviceId;
    deviceToken = res.body.token;
    signingSecret = res.body.signingSecret;
  });

  it('Rejects unauthenticated device heartbeat with 401', async () => {
    const res = await request(app)
      .post('/api/v1/device/heartbeat')
      .send({ batteryLevel: 85, isCharging: false });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/device/heartbeat succeeds with valid credentials and HMAC signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = { batteryLevel: 92, isCharging: true, simCarrier: 'BSNL' };
    const payloadToSign = `POST:/api/v1/device/heartbeat:${timestamp}:${JSON.stringify(body)}`;
    const signature = CryptoService.generateHmacSignature(payloadToSign, signingSecret);

    const res = await request(app)
      .post('/api/v1/device/heartbeat')
      .set('X-Device-Id', registeredDeviceId)
      .set('X-Device-Token', deviceToken)
      .set('X-Device-Timestamp', timestamp)
      .set('X-Device-Signature', signature)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.isPaused).toBe(false);
  });

  it('POST /api/v1/device/poll-jobs retrieves queued job and marks ASSIGNED', async () => {
    // Enqueue an SMS job
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919876543210',
      messageBody: 'Your Damayanti OTP is 654321',
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadToSign = `POST:/api/v1/device/poll-jobs:${timestamp}:`;
    const signature = CryptoService.generateHmacSignature(payloadToSign, signingSecret);

    const res = await request(app)
      .post('/api/v1/device/poll-jobs')
      .set('X-Device-Id', registeredDeviceId)
      .set('X-Device-Token', deviceToken)
      .set('X-Device-Timestamp', timestamp)
      .set('X-Device-Signature', signature);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobs.length).toBeGreaterThan(0);

    const receivedJob = res.body.jobs.find((j: any) => j.id === queuedJob.id);
    expect(receivedJob).toBeDefined();

    // Verify DB status transitioned to ASSIGNED
    const jobInDb = await prisma.sMSJob.findUnique({ where: { id: queuedJob.id } });
    expect(jobInDb?.status).toBe(JobStatus.ASSIGNED);
  });

  it('POST /api/v1/device/ack-job acknowledges receipt (SENDING) and submission (SUBMITTED)', async () => {
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919876543210',
      messageBody: 'Damayanti ACK test',
    });

    // Device assigns
    await QueueService.assignJobsToDevice(registeredDeviceId, 5);

    // 1. Ack SENDING
    const ackRes = await request(app)
      .post('/api/v1/device/ack-job')
      .set('X-Device-Id', registeredDeviceId)
      .set('X-Device-Token', deviceToken)
      .send({ jobId: queuedJob.id, status: 'SENDING' });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.status).toBe('SENDING');

    // 2. Ack SUBMITTED (radio completed)
    const submittedRes = await request(app)
      .post('/api/v1/device/ack-job')
      .set('X-Device-Id', registeredDeviceId)
      .set('X-Device-Token', deviceToken)
      .send({ jobId: queuedJob.id, status: 'SUBMITTED', rawResponse: 'RESULT_OK' });

    expect(submittedRes.status).toBe(200);
    expect(submittedRes.body.status).toBe('SUBMITTED');

    const finalJob = await prisma.sMSJob.findUnique({ where: { id: queuedJob.id } });
    expect(finalJob?.status).toBe(JobStatus.SUBMITTED);
  });
});
