import { create } from 'zustand';
import type { User, Role } from '../entities';

const AUTH_STORAGE_KEY = 'academic_user';
const TOKEN_STORAGE_KEY = 'academic_token';

const VALID_ROLES: Role[] = ['ADMINISTRATOR', 'STUDENT', 'TEACHER'];

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && VALID_ROLES.includes(value as Role);
}

function getStored(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw || !token) return { user: null, token: null };
    const data = JSON.parse(raw) as User;
    const user = data?.id && isRole(data?.role) ? data : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
};

const stored = getStored();

export const useAuthStore = create<AuthState>((set) => ({
  user: stored.user,
  token: stored.token,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    set({ user, token });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    set({ user: null, token: null });
  },
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
