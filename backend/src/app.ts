import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { smsRouter } from './routes/sms.routes.js';
import { deviceRouter } from './routes/device.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // 1. Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS allowlist enforcement
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy violation: Origin ${origin} not permitted`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Device-Id', 'X-Device-Signature', 'X-Device-Timestamp', 'X-Device-Token', 'X-Admin-Secret'],
    })
  );

  // 3. Request parsing with strict payload limit
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 4. Structured Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path !== '/health') {
        logger.info(
          {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
          },
          'HTTP Request'
        );
      }
    });
    next();
  });

  // 5. Route Mounts
  app.use(healthRouter);
  app.use(authRouter);
  app.use(smsRouter);
  app.use(deviceRouter);
  app.use(adminRouter);

  // 6. Serve Live Testing Portal statically if built
  const portalDistPath = path.resolve(process.cwd(), '../test-portal/dist');
  if (fs.existsSync(portalDistPath)) {
    app.use('/portal', express.static(portalDistPath));
    app.get('/portal*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(portalDistPath, 'index.html'));
    });
  }

  // 7. Serve Admin Dashboard statically if built
  const dashboardDistPath = path.resolve(process.cwd(), '../dashboard/dist');
  if (fs.existsSync(dashboardDistPath)) {
    app.use(express.static(dashboardDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/portal')) {
        return next();
      }
      res.sendFile(path.join(dashboardDistPath, 'index.html'));
    });
  }

  // 7. 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
