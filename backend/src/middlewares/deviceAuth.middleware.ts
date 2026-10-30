import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { CryptoService } from '../services/crypto.service.js';
import { ErrorCode } from '../constants/status.js';
import { logger } from '../utils/logger.js';
import type { AndroidDevice, DeviceCredential } from '@prisma/client';

export interface AuthenticatedDeviceRequest extends Request {
  device?: AndroidDevice;
  credential?: DeviceCredential;
}

export async function deviceAuth(req: AuthenticatedDeviceRequest, res: Response, next: NextFunction): Promise<void> {
  const deviceId = req.headers['x-device-id'] as string | undefined;
  const rawToken = req.headers['x-device-token'] as string | undefined;
  const timestampStr = req.headers['x-device-timestamp'] as string | undefined;
  const signature = req.headers['x-device-signature'] as string | undefined;

  if (!deviceId || !rawToken) {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.DEVICE_UNAUTHORIZED,
        message: 'Missing device credentials in X-Device-Id or X-Device-Token header.',
      },
    });
    return;
  }

  try {
    // 1. Locate Device
    const device = await prisma.androidDevice.findFirst({
      where: {
        OR: [{ id: deviceId }, { deviceId }],
      },
      include: {
        credentials: {
          where: { isRevoked: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!device || device.credentials.length === 0) {
      res.status(401).json({
        success: false,
        error: { code: ErrorCode.DEVICE_UNAUTHORIZED, message: 'Unregistered or revoked device credentials.' },
      });
      return;
    }

    if (device.status === 'DISABLED') {
      res.status(403).json({
        success: false,
        error: { code: ErrorCode.FORBIDDEN, message: 'Device has been disabled by an administrator.' },
      });
      return;
    }

    const credential = device.credentials[0];

    // 2. Validate Token Expiry
    if (new Date() > credential.expiresAt) {
      res.status(401).json({
        success: false,
        error: { code: ErrorCode.DEVICE_UNAUTHORIZED, message: 'Device token has expired. Re-registration required.' },
      });
      return;
    }

    // 3. Verify Token Hash
    const isTokenValid = await CryptoService.verifySensitive(credential.tokenHash, rawToken);
    if (!isTokenValid) {
      logger.warn({ deviceId, ip: req.ip }, 'Invalid device token supplied');
      res.status(401).json({
        success: false,
        error: { code: ErrorCode.DEVICE_UNAUTHORIZED, message: 'Invalid device token.' },
      });
      return;
    }

    // 4. Validate Replay Protection & Request Signature (if provided)
    if (timestampStr && signature) {
      const clientTimestamp = parseInt(timestampStr, 10);
      const serverTimestamp = Math.floor(Date.now() / 1000);
      const clockSkew = Math.abs(serverTimestamp - clientTimestamp);

      if (clockSkew > 300) {
        // 5 minute skew allowance
        res.status(400).json({
          success: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'Request timestamp is too skewed (clock drift).' },
        });
        return;
      }

      const bodyStr = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : '';
      const payloadToSign = `${req.method}:${req.originalUrl}:${timestampStr}:${bodyStr}`;
      const isSignatureValid = CryptoService.verifyHmacSignature(payloadToSign, credential.signingSecret, signature);

      if (!isSignatureValid) {
        logger.warn({ deviceId, ip: req.ip }, 'HMAC device request signature mismatch');
        res.status(401).json({
          success: false,
          error: { code: ErrorCode.DEVICE_UNAUTHORIZED, message: 'Cryptographic request signature validation failed.' },
        });
        return;
      }
    }

    req.device = device;
    req.credential = credential;
    next();
  } catch (err) {
    logger.error({ err, deviceId }, 'Device authentication failure');
    res.status(500).json({
      success: false,
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: 'Device authentication internal error' },
    });
  }
}
