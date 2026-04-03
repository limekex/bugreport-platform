/**
 * Shared API request / response contracts for POST /api/reports/bug.
 *
 * These types are consumed by both the backend (for validation) and the
 * widget-sdk (for request payload building).
 */

// ─── Request ─────────────────────────────────────────────────────────────────

export type BugSeverity = 'blocker' | 'high' | 'medium' | 'low';

/** Fields submitted via multipart/form-data. */
export interface BugReportRequest {
  // Core description
  summary: string;
  severity: BugSeverity;
  whatHappened: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string;
  notes?: string;

  // Reporter info
  contactEmail?: string;
  testerId?: string;
  testerRole?: string;

  // App / build context
  environment: string;
  appVersion?: string;
  commitSha?: string;
  buildNumber?: string;

  // Browser context
  pageUrl?: string;
  route?: string;
  browser?: string;
  operatingSystem?: string;
  viewport?: string;
  locale?: string;

  // Observability
  traceId?: string;

  // Optional client-side errors (JSON string of Error[] or similar)
  optionalClientErrors?: string;

  // Screenshot is handled as a multipart File field by the transport layer.
  // It is intentionally omitted from the plain-object type.
}

// ─── Response ────────────────────────────────────────────────────────────────

/** Successful response from POST /api/reports/bug */
export interface BugReportSuccessResponse {
  success: true;
  reportId: string;
  githubIssueNumber: number;
  githubIssueUrl: string;
  message: string;
}

/** Error response returned by the API */
export interface BugReportErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type BugReportResponse = BugReportSuccessResponse | BugReportErrorResponse;

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}
