/**
 * Shared types for the bug reporter widget SDK.
 * 
 * These types were previously imported from @bugreport/shared-types but are now
 * inlined to make the package installable without workspace dependencies.
 */

// ─── Widget Configuration ────────────────────────────────────────────────────

export interface CurrentUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface TraceContext {
  traceId?: string;
  spanId?: string;
}

export interface WidgetTheme {
  primaryColor?: string;
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  zIndex?: number;
}

export interface BugReporterConfig {
  /** Base URL of the bugreport-api service, e.g. https://bugreport.betait.no */
  apiBaseUrl: string;
  /** Logical environment name, e.g. "staging", "uat" */
  environment: string;
  /** Whether the widget is active. Set to false to disable silently. */
  enabled?: boolean;
  /** Deployed app version string */
  appVersion?: string;
  /** Git commit SHA of the running build */
  commitSha?: string;
  /** CI build number */
  buildNumber?: string;
  /** Currently authenticated tester */
  currentUser?: CurrentUser;
  /** Returns the current trace context (e.g. from OpenTelemetry or Sentry) */
  getTraceContext?: () => TraceContext;
  /** Optional theme overrides */
  theme?: WidgetTheme;
}

// ─── API Types ───────────────────────────────────────────────────────────────

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

  // Optional failed network requests (JSON string of FailedNetworkEntry[])
  failedNetworkRequests?: string;

  // Bot protection (JSON string with honeypot, mathAnswer, timeSpent)
  botCheck?: string;

  // Screenshot is handled as a multipart File field by the transport layer.
  // It is intentionally omitted from the plain-object type.
}

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
