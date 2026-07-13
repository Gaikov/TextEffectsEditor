import { error, json } from '../../_lib/http';
import { ensureSchema } from '../../_lib/schema';
import { getUser, requireUser } from '../../_lib/session';
import type { Env } from '../../_lib/types';

const KNOWN_EFFECT_TYPES = new Set([
  'fill',
  'glow',
  'gradientFill',
  'group',
  'shadow',
  'stroke',
]);

function readEffects(value: unknown) {
  if (!Array.isArray(value)) return null;
  const effects = value.filter(
    (effect) =>
      effect &&
      typeof effect === 'object' &&
      typeof (effect as { type?: unknown }).type === 'string' &&
      KNOWN_EFFECT_TYPES.has((effect as { type: string }).type),
  );
  return effects.length > 0 ? effects : null;
}

function mapGalleryRow(row: Record<string, unknown>, userId?: string, isAdmin = false) {
  return {
    authorName: row.authorName,
    canDelete: isAdmin || row.userId === userId,
    createdAt: row.createdAt,
    effects: JSON.parse(String(row.effectsJson)),
    id: row.id,
    name: row.name,
    status: row.status,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  await ensureSchema(env);
  const user = await getUser(env, request);
  const isAdmin = user?.role === 'admin';
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim().toLowerCase() ?? '';
  const status = isAdmin ? url.searchParams.get('status') : null;
  const filters = [];
  const binds: unknown[] = [];

  if (isAdmin && status) {
    filters.push('gallery_items.status = ?');
    binds.push(status);
  } else if (isAdmin) {
    filters.push('1 = 1');
  } else if (user) {
    filters.push('(gallery_items.status = ? OR gallery_items.user_id = ?)');
    binds.push('approved', user.id);
  } else {
    filters.push('gallery_items.status = ?');
    binds.push('approved');
  }

  if (query) {
    filters.push('LOWER(gallery_items.name) LIKE ?');
    binds.push(`%${query}%`);
  }

  const result = await env.DB.prepare(
    `SELECT
       gallery_items.id,
       gallery_items.user_id AS userId,
       gallery_items.name,
       gallery_items.effects_json AS effectsJson,
       gallery_items.status,
       gallery_items.created_at AS createdAt,
       users.display_name AS authorName
     FROM gallery_items
     JOIN users ON users.id = gallery_items.user_id
     WHERE ${filters.join(' AND ')}
     ORDER BY gallery_items.created_at DESC
     LIMIT 100`,
  ).bind(...binds).all<Record<string, unknown>>();

  return json({
    items: result.results.map((row) => mapGalleryRow(row, user?.id, isAdmin)),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  await ensureSchema(env);
  const user = await requireUser(env, request);
  if (!user) return error('Authentication required.', 401);

  const value = await request.json().catch(() => null);
  if (!value || typeof value !== 'object') return error('Invalid payload.');

  const effects = readEffects((value as { effects?: unknown }).effects);
  if (!effects) return error('At least one valid effect is required.');

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO gallery_items
      (id, user_id, name, effects_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    user.id,
    String((value as { name?: unknown }).name ?? ''),
    JSON.stringify(effects),
    'pending',
    now,
    now,
  ).run();

  return json({ ok: true });
};
