import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../lib/logger';

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

// ── Per-tester rate limiting ──────────────────────────────────────────────────
// Supports two backends:
//   1. In-memory sliding-window counter (default, single-process only)
//   2. Redis-backed counter (when REDIS_URL is set, suitable for multi-process)
//
// Both implementations share the same middleware interface.

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Store interface ──────────────────────────────────────────────────────────

interface TesterRateLimitStore {
  /** Increments the counter and returns the new count. */
  increment(testerId: string): Promise<number>;
}

// ── In-memory store ──────────────────────────────────────────────────────────

interface TesterWindow {
  count: number;
  resetAt: number;
}

class InMemoryTesterStore implements TesterRateLimitStore {
  private windows = new Map<string, TesterWindow>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  async increment(testerId: string): Promise<number> {
    const now = Date.now();
    let win = this.windows.get(testerId);

    if (!win || now >= win.resetAt) {
      win = { count: 0, resetAt: now + WINDOW_MS };
      this.windows.set(testerId, win);
      this.ensureCleanupRunning();
    }

    win.count += 1;
    return win.count;
  }

  private ensureCleanupRunning(): void {
    if (this.cleanupInterval !== null) return;
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, win] of this.windows) {
        if (now >= win.resetAt) this.windows.delete(key);
      }
      if (this.windows.size === 0) {
        clearInterval(this.cleanupInterval!);
        this.cleanupInterval = null;
      }
    }, 10 * 60 * 1000);

    if (typeof this.cleanupInterval === 'object' && this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }
}

// ── Redis store ──────────────────────────────────────────────────────────────

class RedisTesterStore implements TesterRateLimitStore {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: true,
    });
    this.client.connect().catch((err: Error) => {
      logger.error({ err }, 'Failed to connect to Redis for tester rate limiting');
    });
  }

  async increment(testerId: string): Promise<number> {
    const key = `bugreport:tester_rate:${testerId}`;
    const ttlSeconds = Math.ceil(WINDOW_MS / 1000);

    try {
      // Atomic increment-with-expiry using a Lua script to avoid race conditions
      // between INCR and EXPIRE (if the process crashes between the two calls,
      // the key would never expire).
      const result = await this.client.eval(
        `local count = redis.call('INCR', KEYS[1])
         if count == 1 then
           redis.call('EXPIRE', KEYS[1], ARGV[1])
         end
         return count`,
        1,
        key,
        ttlSeconds,
      );
      return result as number;
    } catch (err) {
      logger.warn({ err, testerId }, 'Redis tester rate limit error — allowing request');
      // Fail open: don't block requests if Redis is down
      return 0;
    }
  }
}

// ── Store factory ────────────────────────────────────────────────────────────

function createTesterStore(): TesterRateLimitStore {
  if (config.redis.url) {
    logger.info('Using Redis-backed tester rate limiter');
    return new RedisTesterStore(config.redis.url);
  }
  logger.info('Using in-memory tester rate limiter (single-process only)');
  return new InMemoryTesterStore();
}

const testerStore = createTesterStore();

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Per-tester rate limiter applied to the bug report submission endpoint.
 *
 * Uses the `testerId` field from the multipart body (parsed before this
 * middleware runs via multer). Falls through silently when `testerId` is
 * absent — the IP limiter still applies in that case.
 */
export function testerRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const testerId = typeof req.body?.testerId === 'string' ? req.body.testerId.trim() : null;

  if (!testerId) {
    next();
    return;
  }

  testerStore
    .increment(testerId)
    .then((count) => {
      if (count > config.rateLimit.perUserPerHour) {
        res.status(429).json({
          success: false,
          error: 'Too many requests from this tester. Please try again later.',
        });
        return;
      }
      next();
    })
    .catch(() => {
      // Fail open on unexpected errors
      next();
    });
}
