import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config';

/**
 * Middleware that protects admin routes with a simple API key.
 *
 * The key is read from the `ADMIN_API_KEY` env var and must be sent in
 * the `x-api-key` request header.
 *
 * When `ADMIN_API_KEY` is not configured the middleware rejects all
 * requests with 503 so that admin endpoints are effectively disabled.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const configuredKey = config.admin.apiKey;

  if (!configuredKey) {
    res.status(503).json({
      success: false,
      error: 'Admin API is not configured. Set ADMIN_API_KEY to enable it.',
    });
    return;
  }

  const providedKey = req.headers['x-api-key'];

  if (
    typeof providedKey !== 'string' ||
    providedKey.length !== configuredKey.length ||
    !timingSafeEqual(Buffer.from(providedKey), Buffer.from(configuredKey))
  ) {
    res.status(401).json({ success: false, error: 'Invalid or missing API key' });
    return;
  }

  next();
}
