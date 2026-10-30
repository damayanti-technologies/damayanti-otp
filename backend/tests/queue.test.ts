import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { QueueService } from '../src/services/queue.service.js';
import { JobStatus } from '../src/constants/status.js';
import argon2 from 'argon2';

const app = createApp();
const TEST_RAW_API_KEY = 'dmy_live_secret_test_suite_key_2026';
let testAppId: string;
const FAKE_DEVICE_ID = 'dev_galaxy_a35_sim_test';

beforeAll(async () => {
  // Clear any existing jobs to ensure clean queue state
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

  // Create an Android device entry for queue testing
  await prisma.androidDevice.upsert({
    where: { deviceId: FAKE_DEVICE_ID },
    update: { status: 'ONLINE' },
    create: {
      deviceId: FAKE_DEVICE_ID,
      name: 'Galaxy A35 - BSNL Test',
      model: 'SM-A356E',
      status: 'ONLINE',
      simCarrier: 'BSNL',
    },
  });
});

describe('Phase 3 - SMS Queue System & State Machine Verification', () => {
  it('Enqueues SMS job via API and checks initial QUEUED status', async () => {
    const res = await request(app)
      .post('/api/v1/sms/test')
      .set('X-Api-Key', TEST_RAW_API_KEY)
      .send({
        recipientNumber: '+919876543210',
        message: 'Damayanti Test SMS #1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.job.status).toBe(JobStatus.QUEUED);

    const jobId = res.body.job.id;
    const statusRes = await request(app)
      .get(`/api/v1/sms/status?jobId=${jobId}`)
      .set('X-Api-Key', TEST_RAW_API_KEY);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.job.status).toBe(JobStatus.QUEUED);
  });

  it('Atomically assigns QUEUED job to an Android device', async () => {
    // Create direct job in queue
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919999900010',
      messageBody: 'OTP 554433',
    });
    expect(queuedJob.status).toBe(JobStatus.QUEUED);

    // Device assigns jobs
    const assigned = await QueueService.assignJobsToDevice(FAKE_DEVICE_ID, 50);
    const found = assigned.find((j) => j.id === queuedJob.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe(JobStatus.ASSIGNED);
    
    const dbDevice = await prisma.androidDevice.findUnique({ where: { deviceId: FAKE_DEVICE_ID } });
    expect(found?.deviceId).toBe(dbDevice?.id);
  });

  it('Device acknowledges job -> transitions to SENDING', async () => {
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919999900011',
      messageBody: 'OTP 887766',
    });

    await QueueService.assignJobsToDevice(FAKE_DEVICE_ID, 5);

    const ackOk = await QueueService.acknowledgeJob(queuedJob.id, FAKE_DEVICE_ID);
    expect(ackOk).toBe(true);

    const jobInDb = await prisma.sMSJob.findUnique({ where: { id: queuedJob.id } });
    expect(jobInDb?.status).toBe(JobStatus.SENDING);
  });

  it('Reports successful radio outcome -> transitions to SUBMITTED', async () => {
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919999900012',
      messageBody: 'OTP 112233',
    });

    await QueueService.assignJobsToDevice(FAKE_DEVICE_ID, 5);
    await QueueService.acknowledgeJob(queuedJob.id, FAKE_DEVICE_ID);

    const result = await QueueService.reportOutcome({
      jobId: queuedJob.id,
      deviceId: FAKE_DEVICE_ID,
      outcome: 'SUBMITTED',
      rawResponse: 'RESULT_OK radio submission confirmed',
    });

    expect(result).not.toBeNull();
    expect(result?.status).toBe(JobStatus.SUBMITTED);
    expect(result?.submittedAt).not.toBeNull();
  });

  it('Holds job on uncertain radio outcome without auto-retrying to prevent duplicate OTPs', async () => {
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919999900013',
      messageBody: 'OTP 990011',
    });

    await QueueService.assignJobsToDevice(FAKE_DEVICE_ID, 5);
    await QueueService.acknowledgeJob(queuedJob.id, FAKE_DEVICE_ID);

    const result = await QueueService.reportOutcome({
      jobId: queuedJob.id,
      deviceId: FAKE_DEVICE_ID,
      outcome: 'FAILED',
      isUncertainOutcome: true,
      failureReason: 'Radio ACK timed out - outcome uncertain',
    });

    expect(result?.status).toBe(JobStatus.FAILED);
    expect(result?.failureReason).toContain('UNCERTAIN_RADIO_OUTCOME');
  });

  it('Re-queues job for retry on recoverable transient radio errors', async () => {
    const queuedJob = await QueueService.enqueueJob({
      applicationId: testAppId,
      recipientNumber: '+919999900014',
      messageBody: 'OTP 443322',
    });

    await QueueService.assignJobsToDevice(FAKE_DEVICE_ID, 5);
    await QueueService.acknowledgeJob(queuedJob.id, FAKE_DEVICE_ID);

    const result = await QueueService.reportOutcome({
      jobId: queuedJob.id,
      deviceId: FAKE_DEVICE_ID,
      outcome: 'FAILED',
      isUncertainOutcome: false,
      failureReason: 'RADIO_BUSY_TRANSIENT',
    });

    // Should be re-queued with retryCount incremented
    expect(result?.status).toBe(JobStatus.QUEUED);
    expect(result?.retryCount).toBe(1);
    expect(result?.deviceId).toBeNull();
  });
});
