// REFACTOR-01: Resilient Single API Client
let rawBase = import.meta.env.VITE_API_URL || '';

// Handle Render "property: host" which provides host without protocol (e.g. "service.onrender.com")
if (rawBase && !rawBase.startsWith('http://') && !rawBase.startsWith('https://')) {
  // If running on localhost without protocol
  if (rawBase.includes('localhost') || rawBase.includes('127.0.0.1')) {
    rawBase = `http://${rawBase}`;
  } else {
    rawBase = `https://${rawBase}`;
  }
}

// Default to origin or localhost:3000
const BASE_URL = rawBase || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost:3000' : '');

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tier1_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = BASE_URL ? `${BASE_URL}${path}` : path;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
    return await res.json();
  } catch (err) {
    console.warn(`[API] Network request failed for ${url}:`, err);
    throw err;
  }
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
