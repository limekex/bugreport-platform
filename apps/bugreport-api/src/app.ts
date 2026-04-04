import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import path from 'path';
import { config } from './config';
import { logger } from './lib/logger';
import { healthRouter } from './routes/health.routes';
import { reportsRouter } from './routes/reports.routes';
import { adminRouter } from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';
import { ipRateLimiter } from './middleware/rateLimiter';
import { initDomainMappingStore, getAllowedOrigins } from './store/domainMappingStore';
import fs from 'fs';

// Ensure tmp directory exists for multer uploads
if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp', { recursive: true });
}

export function createApp() {
  // Load persisted domain mappings into memory
  initDomainMappingStore();

  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"], // Allow inline scripts for admin UI
        'script-src-attr': ["'unsafe-inline'"], // Allow inline event handlers
      },
    },
  }));

  // ── CORS ────────────────────────────────────────────────────────────────────
  // Allowed origins = static list from env + dynamic list from domain mappings
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.cors.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Check dynamic domain mappings
        if (getAllowedOrigins().includes(origin)) {
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
  // during local development. The LocalStorageAdapter creates the directory on
  // startup — we only need to mount the static route here.
  if (config.storage.provider === 'local') {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsDir));
    logger.debug({ uploadsDir }, 'Serving local uploads directory');
  }

  // ── Admin UI ───────────────────────────────────────────────────────────────
  app.use('/admin', express.static(path.resolve(__dirname, 'public')));

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/admin/domains', adminRouter);

  // ── Error handler (must be last) ────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
