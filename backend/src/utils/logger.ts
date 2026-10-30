import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.headers["x-device-token"]',
      'req.body.otp',
      'req.body.code',
      'req.body.password',
      'req.body.secret',
      'req.body.apiKey',
      'otp',
      'code',
      'password',
      'token',
      'tokenHash',
      'otpHash',
      'signingSecret',
      'sessionToken',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
