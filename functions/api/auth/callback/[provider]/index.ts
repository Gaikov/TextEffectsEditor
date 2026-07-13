import { clearCookie, isLocalHttpRequest } from '../../../../_lib/http';
import {
  exchangeOAuthCode,
  isOAuthProvider,
  OAUTH_STATE_COOKIE,
} from '../../../../_lib/oauth';
import { createSession, upsertUser } from '../../../../_lib/session';
import type { Env } from '../../../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  const provider = String(params.provider);
  const url = new URL(request.url);
  const redirectTo = new URL('/', url.origin);

  if (!isOAuthProvider(provider)) {
    redirectTo.searchParams.set('auth', 'unknown-provider');
    return Response.redirect(redirectTo, 302);
  }

  try {
    const profile = await exchangeOAuthCode(env, request, provider);
    if (!profile.email || !profile.providerUserId) {
      throw new Error('OAuth profile is missing email or id.');
    }
    const userId = await upsertUser(
      env,
      provider,
      profile.providerUserId,
      profile.email,
      profile.displayName,
    );
    redirectTo.searchParams.set('auth', 'success');
    const headers = new Headers({ Location: redirectTo.toString() });
    headers.append('Set-Cookie', await createSession(env, request, userId));
    headers.append(
      'Set-Cookie',
      clearCookie(OAUTH_STATE_COOKIE, !isLocalHttpRequest(request)),
    );
    return new Response(null, {
      headers,
      status: 302,
    });
  } catch (error) {
    console.warn('OAuth callback failed.', error);
    redirectTo.searchParams.set('auth', 'failed');
    return Response.redirect(redirectTo, 302);
  }
};
