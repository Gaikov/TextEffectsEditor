import type { Env } from './types';

let schemaReady: Promise<void> | undefined;

export function ensureSchema(env: Env) {
  schemaReady ??= env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL,
        UNIQUE(provider, provider_user_id)
      )`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS gallery_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        effects_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        moderated_at TEXT,
        moderated_by TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
    ),
    env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)',
    ),
    env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
    ),
    env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_gallery_items_status_created_at ON gallery_items(status, created_at DESC)',
    ),
    env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_gallery_items_user_id ON gallery_items(user_id)',
    ),
  ]).then(() => undefined);

  return schemaReady;
}
