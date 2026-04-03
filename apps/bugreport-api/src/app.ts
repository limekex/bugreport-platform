import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import path from 'path';
import { config } from './config';
import { logger } from './lib/logger';
import { healthRouter } from './routes/health.routes';
import { reportsRouter } from './routes/reports.routes';
import { errorHandler } from './middleware/errorHandler';
import { ipRateLimiter } from './middleware/rateLimiter';
import fs from 'fs';

// Ensure tmp directory exists for multer uploads
if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp', { recursive: true });
}

export function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.cors.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
    }),
  );

  // ── Request logging ─────────────────────────────────────────────────────────
  app.use(pinoHttp({ logger }));

  // ── Body parsing ────────────────────────────────────────────────────────────
  // Note: multer handles multipart/form-data bodies on the upload routes.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── IP rate limiter ─────────────────────────────────────────────────────────
  app.use(ipRateLimiter);

  // ── Static uploads (local dev only) ────────────────────────────────────────
  // In production, screenshots are served from S3/R2. In local mode, the API
  // serves the `uploads/` directory so screenshot URLs in GitHub issues work
  // during local development.
  if (config.storage.provider === 'local') {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsDir));
    logger.debug({ uploadsDir }, 'Serving local uploads directory');
  }

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/reports', reportsRouter);

  // ── Error handler (must be last) ────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
