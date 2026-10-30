import { Response } from 'express';
import { z } from 'zod';
import { OtpService } from '../services/otp.service.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { ErrorCode } from '../constants/status.js';
import { prisma } from '../db/prisma.js';
import type { AuthenticatedRequest } from '../middlewares/apiKeyAuth.middleware.js';

const requestOtpSchema = z.object({
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
  requestId: z.string().optional(),
});

const verifyOtpSchema = z.object({
  correlationId: z.string().uuid('Invalid correlation ID format'),
  code: z.string().regex(/^\d{6}$/, 'OTP code must be exactly 6 digits'),
});

const resendOtpSchema = z.object({
  correlationId: z.string().uuid('Invalid correlation ID format'),
});

export class AuthController {
  /**
   * POST /api/v1/auth/request-otp
   */
  static async requestOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parseResult = requestOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: parseResult.error.errors[0]?.message || 'Invalid input',
          details: parseResult.error.errors,
        },
      });
      return;
    }

    const { phoneNumber } = parseResult.data;
    const phoneNorm = normalizePhoneNumber(phoneNumber);

    if (!phoneNorm.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: phoneNorm.error || 'Invalid mobile phone number format.',
        },
      });
      return;
    }

    const app = req.application!;
    const result = await OtpService.requestOtp({
      applicationId: app.id,
      phoneNumber: phoneNorm.normalized,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!result.success) {
      const statusCode = result.error?.code === ErrorCode.COOLDOWN_ACTIVE ? 429 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      correlationId: result.correlationId,
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      // For automated integration tests only
      devCode: result.devCode,
    });
  }

  /**
   * POST /api/v1/auth/verify-otp
   */
  static async verifyOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: parseResult.error.errors[0]?.message || 'Invalid input',
          details: parseResult.error.errors,
        },
      });
      return;
    }

    const { correlationId, code } = parseResult.data;
    const result = await OtpService.verifyOtp({
      correlationId,
      code,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!result.success) {
      const statusCode = result.error?.code === ErrorCode.NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: 'VERIFIED',
      sessionToken: result.sessionToken,
      user: result.user,
    });
  }

  /**
   * POST /api/v1/auth/resend-otp
   */
  static async resendOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parseResult = resendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid correlation ID',
        },
      });
      return;
    }

    const { correlationId } = parseResult.data;
    const existing = await prisma.oTPRequest.findUnique({
      where: { correlationId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Previous OTP request not found',
        },
      });
      return;
    }

    const result = await OtpService.requestOtp({
      applicationId: existing.applicationId,
      phoneNumber: existing.phoneNumber,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!result.success) {
      const statusCode = result.error?.code === ErrorCode.COOLDOWN_ACTIVE ? 429 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      correlationId: result.correlationId,
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      devCode: result.devCode,
    });
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const auth = req.headers.authorization;
    const sessionToken = auth?.startsWith('Bearer ') ? auth.substring(7) : req.body.sessionToken;

    if (!sessionToken) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: 'Missing session token' },
      });
      return;
    }

    await prisma.loginSession.updateMany({
      where: { sessionToken },
      data: { isRevoked: true },
    });

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
    });
  }

  /**
   * GET /api/v1/auth/session
   */
  static async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const auth = req.headers.authorization;
    const sessionToken = auth?.startsWith('Bearer ') ? auth.substring(7) : null;

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        error: { code: ErrorCode.UNAUTHORIZED, message: 'Missing session token' },
      });
      return;
    }

    const session = await prisma.loginSession.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.isRevoked || new Date() > session.expiresAt) {
      res.status(401).json({
        success: false,
        error: { code: ErrorCode.UNAUTHORIZED, message: 'Session is invalid or expired' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });
  }
}
