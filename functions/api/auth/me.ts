import { json } from '../../_lib/http';
import { getUser } from '../../_lib/session';
import type { Env } from '../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  return json({ user: await getUser(env, request) });
};
