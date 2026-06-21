import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env, isTelegramConfigured } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    await connectDatabase();
  } catch (err) {
    logger.error('Failed to connect to MongoDB. Is it running? URI=' + env.mongoUri, err);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`Violation provider: ${env.violation.provider}`);
    if (!isTelegramConfigured) {
      logger.warn('Telegram is NOT configured — payment relays will be recorded as "failed".');
    }
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
