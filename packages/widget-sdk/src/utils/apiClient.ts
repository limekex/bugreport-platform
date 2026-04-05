import type {
  BugReportSuccessResponse,
  BugReportErrorResponse,
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthResponse,
  TesterInfo,
} from '../types/shared.types';

// ── Token Management ──────────────────────────────────────────────────────────

const TOKEN_STORAGE_KEY = '__bugreport_auth_token__';
const TESTER_STORAGE_KEY = '__bugreport_tester_info__';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Silent fail if localStorage is unavailable
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TESTER_STORAGE_KEY);
  } catch {
    // Silent fail
  }
}

export function getTesterInfo(): TesterInfo | null {
  try {
    const stored = localStorage.getItem(TESTER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setTesterInfo(tester: TesterInfo): void {
  try {
    localStorage.setItem(TESTER_STORAGE_KEY, JSON.stringify(tester));
  } catch {
    // Silent fail
  }
}

// ── Auth API Calls ────────────────────────────────────────────────────────────

export async function login(
  apiBaseUrl: string,
  credentials: AuthLoginRequest,
): Promise<AuthResponse> {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/login`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    credentials: 'omit',
  });

  return response.json();
}

export async function register(
  apiBaseUrl: string,
  data: AuthRegisterRequest,
): Promise<AuthResponse> {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'omit',
  });

  return response.json();
}

export async function verifyToken(
  apiBaseUrl: string,
  token: string,
): Promise<boolean> {
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/verify`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'omit',
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// ── Bug Report Submission ─────────────────────────────────────────────────────

export interface SubmitReportOptions {
  apiBaseUrl: string;
  formData: FormData;
  authToken?: string | null;
}

export async function submitReport(
  options: SubmitReportOptions,
): Promise<BugReportSuccessResponse> {
  const { apiBaseUrl, formData, authToken } = options;
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/reports/bug`;

  const headers: Record<string, string> = {};
  
  // Add auth token if present
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
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
