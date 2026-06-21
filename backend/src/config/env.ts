import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '5000')),
  corsOrigins: optional('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/qatar_violations'),

  telegram: {
    botToken: optional('TELEGRAM_BOT_TOKEN'),
    chatId: optional('TELEGRAM_CHAT_ID'),
    username: optional('TELEGRAM_USERNAME'),
  },

  violation: {
    provider: optional('VIOLATION_PROVIDER', 'mock'),
    apiUrl: optional('VIOLATION_API_URL'),
    apiKey: optional('VIOLATION_API_KEY'),
  },
} as const;

export const isProd = env.nodeEnv === 'production';
export const isTelegramConfigured = Boolean(env.telegram.botToken && env.telegram.chatId);
