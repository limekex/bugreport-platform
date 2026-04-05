/**
 * Lightweight console error capture utility.
 *
 * Captures errors from multiple sources:
 * - Explicit `console.error()` calls
 * - Uncaught exceptions (via window.onerror)
 * - Unhandled promise rejections
 *
 * This data is attached to bug reports as `optionalClientErrors`.
 *
 * Privacy rules (from docs/TECHNICAL_SPEC.md):
 * - Only errors from the *current page lifetime* are captured.
 * - A rolling buffer of MAX_ERRORS entries is kept — older entries are dropped.
 * - No full session recording or persistent storage.
 * - Error messages are trimmed to MAX_MESSAGE_LENGTH characters.
 * - Stack traces are trimmed to MAX_STACK_LENGTH characters.
 */

const MAX_ERRORS = 20;
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 1000;

export interface CapturedError {
  message: string;
  stack?: string;
  timestamp: string;
}

const errorBuffer: CapturedError[] = [];
let hooked = false;

/**
 * Installs error capture hooks for:
 * - console.error() calls
 * - Uncaught exceptions
 * - Unhandled promise rejections
 *
 * Call once during SDK initialisation (`initBugReporter`).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function installConsoleErrorHook(): void {
  if (hooked || typeof console === 'undefined' || typeof window === 'undefined') return;
  hooked = true;

  // Hook console.error
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalError(...args);
    captureError(args);
  };

  // Capture uncaught exceptions
  window.addEventListener('error', (event: ErrorEvent) => {
    const message = event.message || 'Uncaught exception';
    const error = event.error instanceof Error ? event.error : new Error(message);
    
    captureErrorObject(error, event.filename, event.lineno, event.colno);
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    let message = 'Unhandled promise rejection';
    let stack: string | undefined;

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      try {
        message = JSON.stringify(reason);
      } catch {
        message = String(reason);
      }
    }

    addToBuffer(message, stack);
  });
}

/**
 * Returns a JSON-serialised snapshot of the current error buffer.
 *
 * Returns `undefined` when the buffer is empty so callers can omit the field.
 */
export function getCollectedErrors(): string | undefined {
  if (errorBuffer.length === 0) return undefined;
  return JSON.stringify(errorBuffer);
}

/** Clears the in-memory buffer (useful for testing). */
export function clearCollectedErrors(): void {
  errorBuffer.length = 0;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function captureError(args: unknown[]): void {
  const raw = args
    .map((a) => {
      if (a instanceof Error) return a.message;
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');

  const stack = args.find((a) => a instanceof Error && a.stack)
    ? ((args.find((a) => a instanceof Error) as Error).stack ?? undefined)
    : undefined;

  addToBuffer(raw, stack);
}

function captureErrorObject(error: Error, filename?: string, lineno?: number, colno?: number): void {
  let message = error.message || 'Error';
  
  // Add location info if available
  if (filename) {
    message += ` at ${filename}`;
    if (lineno) message += `:${lineno}`;
    if (colno) message += `:${colno}`;
  }

  addToBuffer(message, error.stack);
}

function addToBuffer(message: string, stack?: string): void {
  const entry: CapturedError = {
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    stack: stack?.slice(0, MAX_STACK_LENGTH),
    timestamp: new Date().toISOString(),
  };

  if (entry.stack === undefined) {
    delete entry.stack;
  }

  errorBuffer.push(entry);

  // Keep a rolling window — drop oldest when buffer is full
  if (errorBuffer.length > MAX_ERRORS) {
    errorBuffer.shift();
  }
}
