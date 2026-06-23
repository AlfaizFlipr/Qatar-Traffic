import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProd } from './config/env';
import routes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        try {
          // Allow same-origin / curl (no origin)
          if (!origin) return callback(null, true);

          // Normalize configured origins and incoming origin (strip trailing slash)
          const normalizedOrigin = origin.replace(/\/$/, '');
          const allowed = env.corsOrigins.map((o) => o.replace(/\/$/, ''));

          // Exact or prefix match (allow subpaths/equivalent host variants)
          if (allowed.includes(normalizedOrigin) || allowed.some((a) => normalizedOrigin.startsWith(a))) {
            return callback(null, true);
          }

          // In development, allow any localhost port (Vite may pick 5174, etc.).
          if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
          }

          return callback(new Error(`CORS blocked for origin: ${origin}`));
        } catch (err) {
          // Fail open in case of an unexpected error parsing origin — better for debugging than hard-blocking.
          return callback(null, true);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  app.get('/', (_req, res) => {
    res.json({ name: 'Qatar Traffic Violations API', version: '1.0.0', docs: '/api/health' });
  });

  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
