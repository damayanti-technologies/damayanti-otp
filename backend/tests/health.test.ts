import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

describe('Phase 1 - Health & Infrastructure Verification', () => {
  it('GET /health returns 200 and liveness payload', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'damayanti-otp-backend');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/health returns 200 and comprehensive readiness metrics', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.latencyMs).toBeTypeOf('number');
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('nodeVersion');
    expect(res.body.system).toHaveProperty('memoryUsage');
  });

  it('GET /unknown-route returns 404 and structured JSON error', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET /api/v1/nonexistent not found',
      },
    });
  });

  it('Verifies seeded Damayanti ARROUT application exists in database', async () => {
    const appRecord = await prisma.application.findUnique({
      where: { appId: 'damayanti_arrout' },
      include: { apiKeys: true },
    });
    expect(appRecord).not.toBeNull();
    expect(appRecord?.name).toBe('ARROUT Platform');
    expect(appRecord?.isEnabled).toBe(true);
    expect(appRecord?.apiKeys.length).toBeGreaterThan(0);
  });
});
