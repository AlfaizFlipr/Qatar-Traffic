import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env, isTelegramConfigured } from "./config/env";
import { logger } from "./utils/logger";
import { initializePool, shutdownPool } from "./services/captcha/pagePool";

async function bootstrap() {
  try {
    await connectDatabase();
    await initializePool();
  } catch (err) {
    logger.error(
      "Failed to connect to MongoDB. Is it running? URI=" + env.mongoUri,
      err,
    );
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(
      `API listening on http://localhost:${env.port} (${env.nodeEnv})`,
    );
    logger.info(`Violation provider: ${env.violation.provider}`);
    logger.info(`VPN integration: ${env.vpn.enabled ? "ENABLED" : "DISABLED"}`);
    if (env.vpn.enabled) {
      logger.info(`  - OpenVPN Binary: ${env.vpn.bin}`);
      logger.info(`  - OpenVPN Config: ${env.vpn.config}`);
    }
    if (!isTelegramConfigured) {
      logger.warn(
        'Telegram is NOT configured — payment relays will be recorded as "failed".',
      );
    }
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await shutdownPool();
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap();
