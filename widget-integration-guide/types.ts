/**
 * Types used by the widget-sdk to configure and send bug reports.
 */

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
