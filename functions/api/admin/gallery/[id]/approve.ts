import { error, json } from '../../../../_lib/http';
import { ensureSchema } from '../../../../_lib/schema';
import { requireUser } from '../../../../_lib/session';
import type { Env } from '../../../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  await ensureSchema(env);
  const user = await requireUser(env, request);
  if (!user) return error('Authentication required.', 401);
  if (user.role !== 'admin') return error('Forbidden.', 403);

  await env.DB.prepare(
    `UPDATE gallery_items
     SET status = ?, moderated_at = ?, moderated_by = ?, updated_at = ?
     WHERE id = ?`,
  ).bind('approved', new Date().toISOString(), user.id, new Date().toISOString(), String(params.id)).run();
  return json({ ok: true });
};
