import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Log queries in debug mode only, errors always
prisma.$on('error' as never, (e: unknown) => {
  logger.error({ dbError: e }, 'Prisma Database Error');
});

/**
 * Checks database connectivity with a lightweight ping query
 */
export async function checkDatabaseHealth(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      isHealthy: true,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    logger.error({ error: message }, 'Database health check failed');
    return {
      isHealthy: false,
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}
