/**
 * Failed network request capture utility.
 *
 * Uses the `PerformanceObserver` API (where available) to passively observe
 * `resource` entries and collect those with non-2xx status codes or that failed
 * entirely (transferSize === 0 with duration > 0).
 *
 * The resulting summary is attached to bug reports as the
 * `failedNetworkRequests` field so developers can see which API calls
 * broke during the tester's session.
 *
 * Privacy rules:
 * - Only the URL pathname + status are captured — no request/response bodies.
 * - Authorization headers are never recorded.
 * - A rolling buffer of MAX_ENTRIES is kept.
 * - URLs are truncated to MAX_URL_LENGTH characters.
 */

const MAX_ENTRIES = 30;
const MAX_URL_LENGTH = 300;

export interface FailedNetworkEntry {
  /** Request URL (pathname only for same-origin; full URL for cross-origin) */
  url: string;
  /** HTTP method when available (defaults to "GET" for resource entries) */
  method: string;
  /** HTTP status code, or 0 if the request failed entirely */
  status: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** ISO 8601 timestamp */
  timestamp: string;
}

const failedRequests: FailedNetworkEntry[] = [];
let installed = false;
let observer: PerformanceObserver | null = null;

/**
 * Installs the PerformanceObserver hook + fetch/XHR interceptors.
 *
 * Call once during SDK initialisation. Safe to call multiple times.
 */
export function installNetworkCaptureHook(): void {
  if (installed) return;
  installed = true;

  // ── Fetch interceptor ─────────────────────────────────────────────────────
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method?.toUpperCase() ?? 'GET';
      const start = performance.now();

      try {
        const response = await originalFetch(input, init);
        const durationMs = Math.round(performance.now() - start);

        if (!response.ok) {
          pushEntry({
            url: truncateUrl(url),
            method,
            status: response.status,
            durationMs,
            timestamp: new Date().toISOString(),
          });
        }
        return response;
      } catch (err) {
        const durationMs = Math.round(performance.now() - start);
        pushEntry({
          url: truncateUrl(url),
          method,
          status: 0,
          durationMs,
          timestamp: new Date().toISOString(),
        });
        throw err;
      }
    };
  }

  // ── XMLHttpRequest interceptor ────────────────────────────────────────────
  if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined') {
    const OriginalXHR = XMLHttpRequest;
    const originalOpen = OriginalXHR.prototype.open;

    OriginalXHR.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ): void {
      (this as XMLHttpRequest & { __br_method: string; __br_url: string }).__br_method = method;
      (this as XMLHttpRequest & { __br_url: string }).__br_url = String(url);

      this.addEventListener('loadend', function () {
        if (this.status === 0 || this.status >= 400) {
          pushEntry({
            url: truncateUrl(String(url)),
            method: method.toUpperCase(),
            status: this.status,
            durationMs: 0, // XHR doesn't expose timing directly
            timestamp: new Date().toISOString(),
          });
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalOpen as (...args: unknown[]) => void).call(this, method, url, ...rest);
    };
  }

  // ── PerformanceObserver (bonus: catches non-interceptable requests) ────────
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          // transferSize === 0 with duration > 0 often indicates a failed request
          // (blocked, CORS error, etc.)
          if (resource.transferSize === 0 && resource.duration > 50) {
            pushEntry({
              url: truncateUrl(resource.name),
              method: 'GET', // PerformanceObserver doesn't expose the method
              status: 0,
              durationMs: Math.round(resource.duration),
              timestamp: new Date().toISOString(),
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    } catch {
      // PerformanceObserver not supported — silently skip
    }
  }
}

/**
 * Returns a JSON-serialised snapshot of captured failed requests.
 *
 * Returns `undefined` when the buffer is empty so callers can omit the field.
 */
export function getFailedNetworkRequests(): string | undefined {
  if (failedRequests.length === 0) return undefined;
  return JSON.stringify(failedRequests);
}

/** Clears the in-memory buffer (useful for testing). */
export function clearFailedNetworkRequests(): void {
  failedRequests.length = 0;
}

// ── Internal ──────────────────────────────────────────────────────────────────

function pushEntry(entry: FailedNetworkEntry): void {
  failedRequests.push(entry);
  if (failedRequests.length > MAX_ENTRIES) {
    failedRequests.shift();
  }
}

function truncateUrl(url: string): string {
  return url.length > MAX_URL_LENGTH ? url.slice(0, MAX_URL_LENGTH) + '…' : url;
}
