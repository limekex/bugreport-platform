import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ── Unit tests for testerRateLimiter ─────────────────────────────────────────
// These tests drive the middleware function directly without going through
// Express + supertest, avoiding interference with the IP rate limiter.
//
// The middleware is now async (uses a promise-based store under the hood),
// so we use `await`-friendly assertions.

describe('testerRateLimiter middleware unit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls next() when no testerId is present', async () => {
    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');

    const nextCalled = await new Promise<boolean>((resolve) => {
      const req = { body: {} } as Request;
      const res = {} as Response;
      const next: NextFunction = () => resolve(true);
      testerRateLimiter(req, res, next);
    });
    expect(nextCalled).toBe(true);
  });

  it('calls next() on the first request for a new testerId', async () => {
    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');

    const nextCalled = await new Promise<boolean>((resolve) => {
      const req = { body: { testerId: `new-tester-${Date.now()}` } } as Request;
      const res = {} as Response;
      const next: NextFunction = () => resolve(true);

      testerRateLimiter(req, res, next);
      // Allow microtask to resolve
      setTimeout(() => resolve(false), 100);
    });
    expect(nextCalled).toBe(true);
  });

  it('returns 429 when the tester window is exhausted', async () => {
    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');
    const testerId = `exhausted-${Date.now()}`;

    // Helper to run the middleware and collect the result
    const runMiddleware = (): Promise<{ nextCalled: boolean; status: number; body: unknown }> =>
      new Promise((resolve) => {
        let status = 0;
        let body: unknown = null;

        const req = { body: { testerId } } as Request;
        const res = {
          status: (code: number) => { status = code; return res; },
          json: (b: unknown) => { body = b; resolve({ nextCalled: false, status, body }); return res; },
        } as unknown as Response;
        const next: NextFunction = () => resolve({ nextCalled: true, status: 0, body: null });

        testerRateLimiter(req, res, next);
      });

    // Send 20 requests (the default limit)
    for (let i = 0; i < 20; i++) {
      const result = await runMiddleware();
      expect(result.nextCalled).toBe(true);
    }

    // The 21st request should be rejected
    const rejected = await runMiddleware();
    expect(rejected.nextCalled).toBe(false);
    expect(rejected.status).toBe(429);
    expect((rejected.body as { success: boolean }).success).toBe(false);
  });
});
