import { Router, Request, Response } from 'express';
import { checkDatabaseHealth, prisma } from '../db/prisma.js';
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

  let gatewayInfo = {
    isOnline: false,
    device: null as { name: string; model: string | null; lastHeartbeat: Date | null; batteryLevel: number | null; simCarrier: string | null } | null,
  };

  let queueInfo = {
    queued: 0,
    submitted: 0,
    failed: 0,
    totalOtps: 0,
  };

  if (isHealthy) {
    try {
      const [activeDevice, queuedCount, submittedCount, failedCount, totalOtps] = await Promise.all([
        prisma.androidDevice.findFirst({
          where: { status: 'ONLINE' },
          select: { name: true, model: true, lastHeartbeat: true, batteryLevel: true, simCarrier: true },
          orderBy: { lastHeartbeat: 'desc' },
        }),
        prisma.sMSJob.count({ where: { status: 'QUEUED' } }),
        prisma.sMSJob.count({ where: { status: 'SUBMITTED' } }),
        prisma.sMSJob.count({ where: { status: 'FAILED' } }),
        prisma.oTPRequest.count(),
      ]);

      gatewayInfo = {
        isOnline: !!activeDevice,
        device: activeDevice || null,
      };

      queueInfo = {
        queued: queuedCount,
        submitted: submittedCount,
        failed: failedCount,
        totalOtps,
      };
    } catch (_) {}
  }

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
    gateway: gatewayInfo,
    queue: queueInfo,
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
