import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../db/prisma.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

const startTime = Date.now();

/**
 * Lightweight liveness check
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'damayanti-otp-backend',
  });
});

/**
 * Comprehensive readiness and diagnostics check
 */
healthRouter.get('/api/v1/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbHealth.isHealthy;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'damayanti-otp-backend',
    version: '1.0.0',
    uptimeSeconds,
    complianceMode: env.COMPLIANCE_MODE,
    database: {
      connected: dbHealth.isHealthy,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
    },
  });
});
