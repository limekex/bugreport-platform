import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ── Unit tests for testerRateLimiter ─────────────────────────────────────────
// These tests drive the middleware function directly without going through
// Express + supertest, avoiding interference with the IP rate limiter.

describe('testerRateLimiter middleware unit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls next() when no testerId is present', async () => {
    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');

    let nextCalled = false;
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next: NextFunction = () => { nextCalled = true; };

    testerRateLimiter(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it('calls next() on the first request for a new testerId', async () => {
    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');

    let nextCalled = false;
    const req = { body: { testerId: `new-tester-${Date.now()}` } } as Request;
    const res = {} as Response;
    const next: NextFunction = () => { nextCalled = true; };

    testerRateLimiter(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it('returns 429 when the tester window is exhausted', async () => {
    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');

    const testerId = `exhausted-${Date.now()}`;
    let rejectedAt = -1;

    for (let i = 0; i <= 20; i++) {
      let status = 0;
      let jsonBody: unknown = null;
      let nextCalled = false;

      const req = { body: { testerId } } as Request;
      const res = {
        status: (code: number) => { status = code; return res; },
        json: (b: unknown) => { jsonBody = b; return res; },
      } as unknown as Response;
      const next: NextFunction = () => { nextCalled = true; };

      testerRateLimiter(req, res, next);

      if (!nextCalled) {
        rejectedAt = i;
        expect(status).toBe(429);
        expect((jsonBody as { success: boolean }).success).toBe(false);
        break;
      }
    }

    // Default RATE_LIMIT_PER_USER_PER_HOUR is 20 → rejected at the 21st call (index 20)
    expect(rejectedAt).toBe(20);
  });

  it('resets the window for the tester after the window period expires', async () => {
    // Use vi.useFakeTimers to control Date.now()
    vi.useFakeTimers();

    const { testerRateLimiter } = await import('../src/middleware/rateLimiter');
    const testerId = `reset-test-${Date.now()}`;

    // Exhaust the window
    for (let i = 0; i < 20; i++) {
      const req = { body: { testerId } } as Request;
      const res = { status: () => res, json: () => res } as unknown as Response;
      testerRateLimiter(req, res, () => {});
    }

    // Advance time past the 1-hour window
    vi.advanceTimersByTime(60 * 60 * 1000 + 1);

    // Should be accepted again
    let nextCalled = false;
    const req = { body: { testerId } } as Request;
    const res = { status: () => res, json: () => res } as unknown as Response;
    testerRateLimiter(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);

    vi.useRealTimers();
  });
});
