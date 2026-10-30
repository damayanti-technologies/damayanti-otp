import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { env } from '../src/config/env.js';

const app = createApp();

describe('Phase 7 - Administrative APIs Verification', () => {
  it('Rejects unauthenticated request to /api/v1/admin/dashboard with 401', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/dashboard succeeds with admin credentials and returns real metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('X-Admin-Secret', env.SESSION_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('metrics');
    expect(res.body.metrics).toHaveProperty('totalOtpRequests');
    expect(res.body.metrics).toHaveProperty('queuedJobs');
    expect(res.body.metrics).toHaveProperty('activeDevices');
    expect(res.body).toHaveProperty('gateway');
  });

  it('GET /api/v1/admin/devices returns registered Android devices', async () => {
    const res = await request(app)
      .get('/api/v1/admin/devices')
      .set('X-Admin-Secret', env.SESSION_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.devices)).toBe(true);
  });

  it('GET /api/v1/admin/messages returns paginated SMS jobs history', async () => {
    const res = await request(app)
      .get('/api/v1/admin/messages?page=1&limit=10')
      .set('X-Admin-Secret', env.SESSION_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('POST /api/v1/admin/device/disable disables targeted gateway device', async () => {
    // Create device to disable
    const dev = await prisma.androidDevice.upsert({
      where: { deviceId: 'test_disable_device_uuid' },
      update: { status: 'ONLINE' },
      create: {
        deviceId: 'test_disable_device_uuid',
        name: 'Device To Disable',
        status: 'ONLINE',
      },
    });

    const res = await request(app)
      .post('/api/v1/admin/device/disable')
      .set('X-Admin-Secret', env.SESSION_SECRET)
      .send({ deviceId: dev.deviceId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.androidDevice.findUnique({ where: { id: dev.id } });
    expect(updated?.status).toBe('DISABLED');
  });
});
