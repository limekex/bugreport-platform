import type { BugReportRequest } from '@bugreport/shared-types';
import type { BugReporterConfig } from '@bugreport/shared-types';
import { getCollectedErrors } from './consoleCapture';

/**
 * Builds the multipart FormData payload for POST /api/reports/bug.
 *
 * Text fields are taken from the report object; the screenshot File
 * (if any) must be appended by the caller after this function returns.
 *
 * Automatically includes:
 * - browser context (URL, viewport, locale, user-agent)
 * - config values (environment, appVersion, commitSha, user info, traceId)
 * - recent console errors collected by installConsoleErrorHook()
 */
export function buildReportPayload(
  report: Omit<BugReportRequest, never>,
  config: BugReporterConfig,
  overrides?: Partial<BugReportRequest>,
): FormData {
  const contextDefaults: Partial<BugReportRequest> = {
    environment: config.environment,
    appVersion: config.appVersion,
    commitSha: config.commitSha,
    buildNumber: config.buildNumber,
    testerId: config.currentUser?.id,
    testerRole: config.currentUser?.role,
    contactEmail: config.currentUser?.email,
    traceId: config.getTraceContext?.().traceId,
    pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
    viewport:
      typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : undefined,
    // Automatically attach any console errors captured since page load
    optionalClientErrors: getCollectedErrors(),
  };

  // report fields take priority over context defaults; overrides take priority over everything
  const payload: BugReportRequest = {
    ...contextDefaults,
    ...report,
    ...overrides,
  } as BugReportRequest;

  const formData = new FormData();

  (Object.keys(payload) as (keyof BugReportRequest)[]).forEach((key) => {
    const value = payload[key];
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return formData;
}
