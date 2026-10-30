import { Response } from 'express';
import { z } from 'zod';
import { QueueService } from '../services/queue.service.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { prisma } from '../db/prisma.js';
import { ErrorCode } from '../constants/status.js';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../middlewares/apiKeyAuth.middleware.js';

const testSmsSchema = z.object({
  recipientNumber: z.string().min(8),
  message: z.string().max(160).optional(),
});

export class SmsController {
  /**
   * POST /api/v1/sms/test
   * Enqueues a test SMS message for testing gateway transmission.
   */
  static async sendTestSms(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parseResult = testSmsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const { recipientNumber, message } = parseResult.data;
    const phoneNorm = normalizePhoneNumber(recipientNumber);

    if (!phoneNorm.isValid) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: phoneNorm.error },
      });
      return;
    }

    // Compliance Check
    if (env.COMPLIANCE_MODE === 'DEVELOPMENT_RESTRICTED') {
      const isWhitelisted = env.WHITELISTED_TEST_NUMBERS.includes(phoneNorm.normalized);
      if (!isWhitelisted) {
        res.status(403).json({
          success: false,
          error: {
            code: ErrorCode.COMPLIANCE_BLOCKED,
            message: `Compliance Lock: Phone number ${phoneNorm.normalized} is not in the authorized test whitelist.`,
          },
        });
        return;
      }
    }

    const app = req.application!;
    const bodyText = message || `Damayanti OTP test message sent at ${new Date().toLocaleTimeString('en-IN')}`;

    const job = await QueueService.enqueueJob({
      applicationId: app.id,
      recipientNumber: phoneNorm.normalized,
      messageBody: bodyText,
    });

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        recipient: job.recipientNumber,
        status: job.status,
        createdAt: job.createdAt,
      },
    });
  }

  /**
   * GET /api/v1/sms/status
   */
  static async getJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const jobId = req.query.jobId as string | undefined;
    const correlationId = req.query.correlationId as string | undefined;

    if (!jobId && !correlationId) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: 'Provide either jobId or correlationId' },
      });
      return;
    }

    let job = null;
    if (jobId) {
      job = await prisma.sMSJob.findUnique({
        where: { id: jobId },
        include: { logs: { orderBy: { timestamp: 'desc' } } },
      });
    } else if (correlationId) {
      const otp = await prisma.oTPRequest.findUnique({
        where: { correlationId },
        include: { smsJob: { include: { logs: { orderBy: { timestamp: 'desc' } } } } },
      });
      job = otp?.smsJob || null;
    }

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: ErrorCode.NOT_FOUND, message: 'SMS job not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        recipientNumber: job.recipientNumber,
        retryCount: job.retryCount,
        assignedAt: job.assignedAt,
        submittedAt: job.submittedAt,
        failedAt: job.failedAt,
        failureReason: job.failureReason,
        logs: job.logs,
      },
    });
  }

  /**
   * GET /api/v1/sms/history
   */
  static async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.sMSJob.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          application: { select: { appId: true, name: true } },
          device: { select: { name: true, model: true } },
        },
      }),
      prisma.sMSJob.count(),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      jobs,
    });
  }
}
