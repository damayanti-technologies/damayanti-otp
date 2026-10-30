import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { ErrorCode } from '../constants/status.js';
import { env } from '../config/env.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Input validation failed',
        details: formatted,
      },
    });
    return;
  }

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Malformed JSON payload in request body',
      },
    });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
  const errorStack = err instanceof Error ? err.stack : undefined;

  logger.error(
    {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      error: errorMessage,
      stack: env.NODE_ENV !== 'production' ? errorStack : undefined,
    },
    'Unhandled server error occurred'
  );

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: env.NODE_ENV === 'production' ? 'An unexpected internal server error occurred' : errorMessage,
    },
  });
}
