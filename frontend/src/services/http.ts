import { API_BASE } from '../config';
import { supabase } from '../lib/supabase';
import type { ApiErrorResponse } from '../types/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null && 'error' in value;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (isApiErrorResponse(payload)) {
    return payload.error.message;
  }

  if (payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string') {
    return payload.detail;
  }

  return fallback;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Get the current session token to send to the backend
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    if (response.status === 401) {
      // Force sign out if the backend rejects the token (Database Truth Check failed)
      console.warn("Session invalid or user deleted. Forcing sign out.");
      await supabase.auth.signOut();
      window.location.href = '/'; // Kick to landing page
    }
    throw new Error(getErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload as T;
}

export function jsonRequest<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}
