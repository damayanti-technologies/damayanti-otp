import { prisma } from '../db/prisma.js';
import { CryptoService } from './crypto.service.js';
import { smsMockService } from './smsMock.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ErrorCode } from '../constants/status.js';
import { JobStatus } from '../constants/status.js';

export interface RequestOtpParams {
  applicationId: string;
  phoneNumber: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestOtpResult {
  success: boolean;
  correlationId?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  error?: {
    code: string;
    message: string;
    cooldownRemainingSeconds?: number;
  };
  // Test/Development hook ONLY - stripped in production
  devCode?: string;
}

export interface VerifyOtpParams {
  correlationId: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  sessionToken?: string;
  user?: {
    id: string;
    phoneNumber: string;
  };
  error?: {
    code: string;
    message: string;
    attemptsRemaining?: number;
  };
}

export class OtpService {
  /**
   * Issues a new secure OTP, invalidating existing active codes for the phone number.
   */
  static async requestOtp(params: RequestOtpParams): Promise<RequestOtpResult> {
    const { applicationId, phoneNumber, ipAddress, userAgent } = params;

    // 1. Verify application exists and is enabled
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app || !app.isEnabled) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Application is disabled or not found',
        },
      };
    }

    // 2. Compliance Lock Check: When in restricted mode, only allow whitelisted test numbers
    if (env.COMPLIANCE_MODE === 'DEVELOPMENT_RESTRICTED') {
      const isWhitelisted = env.WHITELISTED_TEST_NUMBERS.includes(phoneNumber);
      if (!isWhitelisted) {
        return {
          success: false,
          error: {
            code: ErrorCode.COMPLIANCE_BLOCKED,
            message: `Compliance Lock: Phone number ${phoneNumber} is not in the authorized test whitelist. Add it to WHITELISTED_TEST_NUMBERS in .env before initiating live SMS dispatch.`,
          },
        };
      }
    }

    // 3. Check Resend Cooldown (60 seconds)
    const cooldownWindow = new Date(Date.now() - env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
    const recentRequest = await prisma.oTPRequest.findFirst({
      where: {
        phoneNumber,
        createdAt: { gte: cooldownWindow },
        isInvalidated: false,
        isVerified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRequest) {
      const elapsedSeconds = Math.floor((Date.now() - recentRequest.createdAt.getTime()) / 1000);
      const remainingSeconds = Math.max(1, env.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);

      return {
        success: false,
        error: {
          code: ErrorCode.COOLDOWN_ACTIVE,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          cooldownRemainingSeconds: remainingSeconds,
        },
      };
    }

    // 3. Invalidate prior active OTP requests for this phone number
    await prisma.oTPRequest.updateMany({
      where: {
        phoneNumber,
        isVerified: false,
        isInvalidated: false,
      },
      data: {
        isInvalidated: true,
      },
    });

    // 4. Generate 6-digit OTP and compute Argon2id hash
    const rawOtp = CryptoService.generateSixDigitOtp();
    const otpHash = await CryptoService.hashSensitive(rawOtp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);

    // 5. Persist OTP Request & SMS Job in a transaction
    const templateMessage = `Your Damayanti OTP verification code is: ${rawOtp}. Valid for 5 minutes. Do not share this code with anyone.`;

    const { otpRecord } = await prisma.$transaction(async (tx) => {
      const otp = await tx.oTPRequest.create({
        data: {
          applicationId: app.id,
          phoneNumber,
          otpHash,
          expiresAt,
          attemptsRemaining: env.OTP_MAX_ATTEMPTS,
          ipAddress,
          userAgent,
        },
      });

      await tx.sMSJob.create({
        data: {
          otpRequestId: otp.id,
          applicationId: app.id,
          recipientNumber: phoneNumber,
          messageBody: templateMessage,
          status: JobStatus.QUEUED,
        },
      });

      return { otpRecord: otp };
    });

    // 6. If in mock mode, dispatch immediately to mock service
    if (env.COMPLIANCE_MODE === 'DEVELOPMENT_MOCK') {
      await smsMockService.dispatchMockSms(phoneNumber, templateMessage, otpRecord.correlationId);
    }

    logger.info(
      {
        correlationId: otpRecord.correlationId,
        applicationId: app.appId,
        recipient: phoneNumber,
      },
      'OTP generated and queued for dispatch'
    );

    return {
      success: true,
      correlationId: otpRecord.correlationId,
      expiresInSeconds: env.OTP_EXPIRY_SECONDS,
      cooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
      // For automated unit testing / local development only
      devCode: env.NODE_ENV !== 'production' ? rawOtp : undefined,
    };
  }

  /**
   * Verifies an OTP submission against its stored Argon2id hash.
   */
  static async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    const { correlationId, code, ipAddress, userAgent } = params;

    // 1. Locate OTP request by correlation ID
    const otpRecord = await prisma.oTPRequest.findUnique({
      where: { correlationId },
    });

    if (!otpRecord) {
      return {
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Invalid or unknown OTP verification request.',
        },
      };
    }

    // 2. Check if already verified or invalidated
    if (otpRecord.isVerified) {
      return {
        success: false,
        error: {
          code: ErrorCode.OTP_INVALID,
          message: 'This OTP has already been verified and cannot be reused.',
        },
      };
    }

    if (otpRecord.isInvalidated) {
      return {
        success: false,
        error: {
          code: ErrorCode.OTP_INVALID,
          message: 'This OTP has been invalidated. Please request a new code.',
        },
      };
    }

    // 3. Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTPRequest.update({
        where: { id: otpRecord.id },
        data: { isInvalidated: true },
      });

      return {
        success: false,
        error: {
          code: ErrorCode.OTP_EXPIRED,
          message: 'The OTP code has expired. Please request a new one.',
        },
      };
    }

    // 4. Check attempts remaining
    if (otpRecord.attemptsRemaining <= 0) {
      await prisma.oTPRequest.update({
        where: { id: otpRecord.id },
        data: { isInvalidated: true },
      });

      return {
        success: false,
        error: {
          code: ErrorCode.MAX_ATTEMPTS_EXCEEDED,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        },
      };
    }

    // 5. Verify Argon2id hash
    const isMatch = await CryptoService.verifySensitive(otpRecord.otpHash, code.trim());

    if (!isMatch) {
      const remaining = otpRecord.attemptsRemaining - 1;
      await prisma.oTPRequest.update({
        where: { id: otpRecord.id },
        data: {
          attemptsRemaining: remaining,
          isInvalidated: remaining <= 0,
        },
      });

      // Log security event on failure
      await prisma.securityEvent.create({
        data: {
          eventType: 'FAILED_OTP_VERIFICATION',
          severity: remaining <= 1 ? 'HIGH' : 'MEDIUM',
          ipAddress,
          details: JSON.stringify({
            correlationId,
            attemptsRemaining: remaining,
            phoneNumber: otpRecord.phoneNumber,
          }),
        },
      });

      return {
        success: false,
        error: {
          code: ErrorCode.OTP_INVALID,
          message: remaining > 0 ? `Incorrect OTP code. ${remaining} attempts remaining.` : 'Incorrect OTP code. Maximum attempts exceeded.',
          attemptsRemaining: remaining,
        },
      };
    }

    // 6. Match successful - Mark OTP as verified & provision user / session
    const sessionToken = CryptoService.generateSecureToken(32);
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour session

    const user = await prisma.$transaction(async (tx) => {
      // Mark OTP verified
      await tx.oTPRequest.update({
        where: { id: otpRecord.id },
        data: {
          isVerified: true,
          attemptsRemaining: 0,
        },
      });

      // Upsert User record
      const u = await tx.user.upsert({
        where: { phoneNumber: otpRecord.phoneNumber },
        update: { lastLoginAt: new Date() },
        create: {
          phoneNumber: otpRecord.phoneNumber,
          lastLoginAt: new Date(),
        },
      });

      // Create login session
      await tx.loginSession.create({
        data: {
          userId: u.id,
          sessionToken,
          ipAddress,
          userAgent,
          expiresAt: sessionExpiry,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: u.id,
          action: 'LOGIN_OTP_VERIFIED',
          target: otpRecord.applicationId,
          ipAddress,
          metadata: JSON.stringify({ correlationId }),
        },
      });

      return u;
    });

    logger.info(
      {
        correlationId,
        userId: user.id,
        phoneNumber: user.phoneNumber,
      },
      'OTP verified successfully, session created'
    );

    return {
      success: true,
      sessionToken,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
      },
    };
  }
}
