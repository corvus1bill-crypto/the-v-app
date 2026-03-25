/**
 * Central API client for the backend (Supabase Edge Function).
 * All backend requests should use getApiBaseUrl() or apiFetch() so config and errors are consistent.
 */
import { projectId, publicAnonKey } from './supabaseClient';

const EDGE_FUNCTION_NAME = 'make-server-78efa14d';

/** Base URL for the backend Edge Function (no trailing slash). */
export function getApiBaseUrl(): string {
  return `https://${projectId}.supabase.co/functions/v1/${EDGE_FUNCTION_NAME}`;
}

/** Default headers for authenticated API requests. */
export function getApiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    ...extra,
  };
}

export type ApiFetchOptions = RequestInit & {
  /** If true, do not throw on 4xx/5xx; return the response. */
  returnResponse?: boolean;
};

/**
 * Fetch from the backend with base URL and auth. Throws on network errors.
 * On non-ok response, throws Error with message from response body or status text unless returnResponse is true.
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { returnResponse, ...init } = options;
  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${publicAnonKey}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Backend unreachable: ${message}. Check your connection and that the Supabase Edge Function is deployed.`);
  }

  if (returnResponse || response.ok) return response;

  let bodyMessage: string;
  try {
    const data = await response.json().catch(() => ({}));
    bodyMessage = typeof data?.error === 'string' ? data.error : data?.message ?? response.statusText;
  } catch {
    bodyMessage = response.statusText;
  }
  throw new Error(bodyMessage || `Request failed (${response.status})`);
}

/** Lightweight check: backend is reachable (no auth required). Resolves true if we get any response from the Edge Function. */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const url = `${getApiBaseUrl()}/users/profile/00000000-0000-0000-0000-000000000000`;
    const res = await fetch(url, { method: 'GET', headers: getApiHeaders() });
    return true;
  } catch {
    return false;
  }
}
