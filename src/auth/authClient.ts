export type AuthProvider = 'google' | 'yandex';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  user: AuthUser | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof value?.error === 'string' ? value.error : 'Request failed',
    );
  }
  return value as T;
}

export async function loadAuthState(): Promise<AuthState> {
  try {
    return await readJson<AuthState>(await fetch('/api/auth/me'));
  } catch (error) {
    console.warn('Unable to load auth state.', error);
    return { user: null };
  }
}

export function loginWithProvider(
  provider: AuthProvider,
  mode: 'redirect' | 'tab' = 'redirect',
) {
  const url = `/api/auth/login/${provider}${mode === 'tab' ? '?mode=tab' : ''}`;
  if (mode === 'tab') return window.open(url, '_blank');

  window.location.href = url;
  return null;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}
