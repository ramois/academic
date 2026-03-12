import { getAuthHeaders } from '../stores';

const getBaseUrl = (): string =>
  import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

async function handleErrorResponse(
  res: Response,
  defaultMessage: string,
): Promise<never> {
  if (res.status === 401) {
    const { useAuthStore } = await import('../stores');
    useAuthStore.getState().clearAuth();
  }
  const err = await res.json().catch(() => ({ message: res.statusText }));
  throw new Error(err.message ?? defaultMessage);
}

export type RequestOptions = RequestInit & {
  defaultErrorMessage?: string;
};

/**
 * Wrapper para llamadas al API backend.
 * Añade base URL, cabecera Authorization con JWT y maneja 401 (cierra sesión).
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { defaultErrorMessage = 'Error en la petición', ...init } = options;
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.headers as Record<string, string>),
  };
  if (init.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) await handleErrorResponse(res, defaultErrorMessage);
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Cabeceras con JWT para peticiones que no pasan por apiRequest (re-export desde store). */
export { getAuthHeaders };
