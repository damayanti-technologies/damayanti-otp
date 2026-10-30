import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { CryptoService } from '../services/crypto.service.js';
import { ErrorCode } from '../constants/status.js';
import { logger } from '../utils/logger.js';
import type { Application } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  application?: Application;
}

export async function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['x-api-key'] || req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Missing API Key in X-Api-Key or Authorization header.',
      },
    });
    return;
  }

  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();

  try {
    // Find candidate keys that are not revoked
    const candidateKeys = await prisma.aPIKey.findMany({
      where: { isRevoked: false },
      include: { application: true },
    });

    let matchedApp: Application | null = null;
    let matchedKeyId: string | null = null;

    for (const key of candidateKeys) {
      if (key.expiresAt && new Date() > key.expiresAt) {
        continue;
      }

      const isMatch = await CryptoService.verifySensitive(key.keyHash, rawKey);
      if (isMatch) {
        matchedApp = key.application;
        matchedKeyId = key.id;
        break;
      }
    }

    if (!matchedApp || !matchedKeyId) {
      logger.warn({ ip: req.ip, path: req.path }, 'Invalid API key attempt');
      await prisma.securityEvent.create({
        data: {
          eventType: 'INVALID_API_KEY_ATTEMPT',
          severity: 'MEDIUM',
          ipAddress: req.ip,
          details: JSON.stringify({ path: req.path }),
        },
      });

      res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Invalid or revoked API credentials.',
        },
      });
      return;
    }

    if (!matchedApp.isEnabled) {
      res.status(403).json({
        success: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: 'This application has been disabled by an administrator.',
        },
      });
      return;
    }

    // Origin verification if Origin header is present
    const origin = req.headers.origin;
    if (origin && typeof origin === 'string') {
      const allowedOrigins: string[] = JSON.parse(matchedApp.allowedOrigins || '[]');
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin) && process.env.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: `Origin ${origin} is not permitted for application ${matchedApp.appId}.`,
          },
        });
        return;
      }
    }

    // Update lastUsedAt asynchronously
    prisma.aPIKey.update({ where: { id: matchedKeyId }, data: { lastUsedAt: new Date() } }).catch(() => {});

    req.application = matchedApp;
    next();
  } catch (err) {
    logger.error({ err }, 'Error during API key authentication');
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal error verifying API credentials',
      },
    });
  }
}
