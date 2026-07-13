import { json } from '../../../_lib/http';
import { deleteSession } from '../../../_lib/session';
import type { Env } from '../../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  return json(
    { ok: true },
    { headers: { 'Set-Cookie': await deleteSession(env, request) } },
  );
};
