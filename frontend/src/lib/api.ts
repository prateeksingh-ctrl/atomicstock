// REFACTOR-01: Single API client — replaces hardcoded localhost:3000 across all files
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('tier1_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export const api = {
  get: <T = any>(path: string, extraHeaders?: HeadersInit) =>
    request<T>(path, { headers: extraHeaders }),

  post: <T = any>(path: string, body: unknown, extraHeaders?: HeadersInit) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: extraHeaders,
    }),

  patch: <T = any>(path: string, body: unknown, extraHeaders?: HeadersInit) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: extraHeaders,
    }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
