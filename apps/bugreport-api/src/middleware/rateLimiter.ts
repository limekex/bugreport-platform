import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/** Per-IP rate limiter applied globally */
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.rateLimit.perIpPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
  },
});

/**
 * Per-tester rate limiter applied to the bug report submission endpoint.
 *
 * Uses the `testerId` field from the multipart body (parsed before this
 * middleware runs via multer). Falls through silently when `testerId` is
 * absent — the IP limiter still applies in that case.
 *
 * Implementation: a simple in-memory sliding-window counter keyed by
 * testerId. Suitable for single-process deployments. For multi-process /
 * horizontally-scaled deployments, replace with a Redis-backed store.
 *
 * TODO: Replace the in-memory store with a Redis adapter for production.
 */

interface TesterWindow {
  count: number;
  resetAt: number;
}

const testerWindows = new Map<string, TesterWindow>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Lazy-started cleanup interval; only runs once the first tester entry is created. */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanupRunning(): void {
  if (cleanupInterval !== null) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, win] of testerWindows) {
      if (now >= win.resetAt) testerWindows.delete(key);
    }
    // Stop the interval when the map is empty to avoid unnecessary work
    if (testerWindows.size === 0) {
      clearInterval(cleanupInterval!);
      cleanupInterval = null;
    }
  }, 10 * 60 * 1000); // every 10 minutes

  // Allow the process to exit even if the interval is active
  if (typeof cleanupInterval === 'object' && cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

export function testerRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // testerId arrives as a multipart form field — already parsed by multer
  const testerId = typeof req.body?.testerId === 'string' ? req.body.testerId.trim() : null;

  if (!testerId) {
    // No tester ID — IP limiter handles abuse; proceed
    next();
    return;
  }

  const now = Date.now();
  let win = testerWindows.get(testerId);

  if (!win || now >= win.resetAt) {
    win = { count: 0, resetAt: now + WINDOW_MS };
    testerWindows.set(testerId, win);
    ensureCleanupRunning();
  }

  win.count += 1;

  if (win.count > config.rateLimit.perUserPerHour) {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this tester. Please try again later.',
    });
    return;
  }

  next();
}
