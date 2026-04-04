import type { BugReportSuccessResponse, BugReportErrorResponse } from '../types/shared.types';

export interface SubmitReportOptions {
  apiBaseUrl: string;
  formData: FormData;
}

/**
 * Sends the bug report FormData to the backend API.
 */
export async function submitReport(
  options: SubmitReportOptions,
): Promise<BugReportSuccessResponse> {
  const { apiBaseUrl, formData } = options;
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/reports/bug`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Note: do NOT set Content-Type manually — the browser sets it with the boundary.
    credentials: 'omit',
  });

  const data = (await response.json()) as BugReportSuccessResponse | BugReportErrorResponse;

  if (!data.success) {
    throw new Error((data as BugReportErrorResponse).error ?? 'Unknown error from API');
  }

  return data;
}
