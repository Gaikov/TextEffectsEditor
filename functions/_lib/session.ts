import { cookie, getCookie, isLocalHttpRequest } from './http';
import { ensureSchema } from './schema';
import type { Env, User } from './types';

export const SESSION_COOKIE = 'font_effects_session';
const SESSION_DAYS = 30;

function sessionCookieOptions(request: Request) {
  const isLocal = isLocalHttpRequest(request);
  return {
    sameSite: isLocal ? 'Lax' : 'None',
    secure: !isLocal,
  } as const;
}

function base64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export async function sha256(value: string) {
  return base64Url(await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  ));
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes.buffer);
}

function toRole(email: string, adminEmails: string | undefined): User['role'] {
  const admins = (adminEmails ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? 'admin' : 'user';
}

export async function createSession(env: Env, request: Request, userId: string) {
  await ensureSchema(env);
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), userId, tokenHash, expiresAt, now.toISOString()).run();
  return cookie(SESSION_COOKIE, token, {
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    ...sessionCookieOptions(request),
  });
}

export async function getUser(env: Env, request: Request): Promise<User | null> {
  await ensureSchema(env);
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT users.id, users.email, users.display_name AS displayName, users.role
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
  ).bind(tokenHash, new Date().toISOString()).first<User>();

  return row ?? null;
}

export async function requireUser(env: Env, request: Request) {
  return getUser(env, request);
}

export async function deleteSession(env: Env, request: Request) {
  await ensureSchema(env);
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await sha256(token))
      .run();
  }
  return cookie(SESSION_COOKIE, '', {
    maxAge: 0,
    ...sessionCookieOptions(request),
  });
}

export async function upsertUser(
  env: Env,
  provider: string,
  providerUserId: string,
  email: string,
  displayName: string,
) {
  await ensureSchema(env);
  const now = new Date().toISOString();
  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE provider = ? AND provider_user_id = ?`,
  ).bind(provider, providerUserId).first<{ id: string }>();

  if (existing) {
    await env.DB.prepare(
      `UPDATE users
       SET email = ?, display_name = ?, role = ?
       WHERE id = ?`,
    ).bind(email, displayName, toRole(email, env.ADMIN_EMAILS), existing.id).run();
    return existing.id;
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO users
      (id, provider, provider_user_id, email, display_name, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    provider,
    providerUserId,
    email,
    displayName,
    toRole(email, env.ADMIN_EMAILS),
    now,
  ).run();
  return id;
}
