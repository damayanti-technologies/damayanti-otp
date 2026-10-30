import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { ErrorCode } from '../constants/status.js';
import type { Admin } from '@prisma/client';

export interface AuthenticatedAdminRequest extends Request {
  admin?: Admin;
}

export async function adminAuth(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const adminSecret = req.headers['x-admin-secret'];

  // 1. Check direct admin header secret (matches SESSION_SECRET in dev)
  if (adminSecret && adminSecret === process.env.SESSION_SECRET) {
    return next();
  }

  // 2. Check session token
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: ErrorCode.UNAUTHORIZED, message: 'Administrator authentication required.' },
    });
    return;
  }

  const session = await prisma.loginSession.findUnique({
    where: { sessionToken: token },
    include: { admin: true },
  });

  if (!session || session.isRevoked || new Date() > session.expiresAt || !session.admin) {
    res.status(401).json({
      success: false,
      error: { code: ErrorCode.UNAUTHORIZED, message: 'Invalid or expired administrator session.' },
    });
    return;
  }

  req.admin = session.admin;
  next();
}
