import { error } from '../../../../_lib/http';
import {
  createOAuthRedirect,
  isOAuthProvider,
  readOAuthMode,
} from '../../../../_lib/oauth';
import type { Env } from '../../../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  const provider = String(params.provider);
  if (!isOAuthProvider(provider)) return error('Unknown auth provider.', 404);

  const response = createOAuthRedirect(env, request, provider, readOAuthMode(request));
  return response ?? error(`${provider} OAuth is not configured.`, 501);
};
