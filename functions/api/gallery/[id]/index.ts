import { error, json } from '../../../_lib/http';
import { ensureSchema } from '../../../_lib/schema';
import { requireUser } from '../../../_lib/session';
import type { Env } from '../../../_lib/types';

export const onRequestDelete: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  await ensureSchema(env);
  const user = await requireUser(env, request);
  if (!user) return error('Authentication required.', 401);

  const id = String(params.id);
  const row = await env.DB.prepare(
    'SELECT user_id AS userId FROM gallery_items WHERE id = ?',
  ).bind(id).first<{ userId: string }>();
  if (!row) return error('Gallery item not found.', 404);
  if (row.userId !== user.id && user.role !== 'admin') {
    return error('Forbidden.', 403);
  }

  await env.DB.prepare('DELETE FROM gallery_items WHERE id = ?').bind(id).run();
  return json({ ok: true });
};
