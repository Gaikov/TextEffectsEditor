export interface Env {
  ADMIN_EMAILS?: string;
  APP_ORIGIN?: string;
  AI?: Ai;
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  YANDEX_CLIENT_ID?: string;
  YANDEX_CLIENT_SECRET?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export interface ProviderProfile {
  providerUserId: string;
  email: string;
  displayName: string;
}
