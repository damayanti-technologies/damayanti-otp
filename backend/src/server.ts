import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './db/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
      complianceMode: env.COMPLIANCE_MODE,
      pid: process.pid,
    },
    `🚀 Damayanti OTP Backend running at http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`
  );
  logger.info(`Health check available at http://localhost:${env.PORT}/health`);
  logger.info(`Readiness check available at http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Initiating graceful server shutdown...');
  server.close(async () => {
    logger.info('HTTP server closed. Disconnecting database client...');
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected cleanly. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during database disconnection');
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcefully killing process.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
