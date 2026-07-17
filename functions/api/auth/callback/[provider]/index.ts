import { clearCookie, isLocalHttpRequest } from '../../../../_lib/http';
import {
  exchangeOAuthCode,
  isOAuthProvider,
  oauthModeFromState,
  OAUTH_STATE_COOKIE,
} from '../../../../_lib/oauth';
import { createSession, upsertUser } from '../../../../_lib/session';
import type { Env } from '../../../../_lib/types';

function authTabResponse(
  request: Request,
  status: 'success' | 'failed',
  headers = new Headers(),
) {
  const origin = new URL(request.url).origin;
  headers.set('Content-Type', 'text/html; charset=utf-8');

  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Text Effects Editor Sign-in</title>
    <style>
      body {
        background: #1c2127;
        color: #f6f7f9;
        font: 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
      }
      main {
        max-width: 420px;
        padding: 32px;
        text-align: center;
      }
      p {
        color: #abb3bf;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${status === 'success' ? 'Sign-in complete' : 'Unable to sign in'}</h1>
      <p>${status === 'success'
        ? 'You can close this tab and return to Text Effects Editor.'
        : 'Return to Text Effects Editor and try again.'}</p>
    </main>
    <script>
      window.opener?.postMessage(
        { type: 'font-effects-auth', status: ${JSON.stringify(status)} },
        ${JSON.stringify(origin)}
      );
      setTimeout(() => window.close(), 100);
    </script>
  </body>
</html>`, { headers });
}

export const onRequestGet: PagesFunction<Env> = async ({
  env,
  params,
  request,
}) => {
  const provider = String(params.provider);
  const url = new URL(request.url);
  const mode = oauthModeFromState(url.searchParams.get('state'));
  const redirectTo = new URL('/', url.origin);

  if (!isOAuthProvider(provider)) {
    if (mode === 'tab') return authTabResponse(request, 'failed');
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
    const headers = new Headers(
      mode === 'tab' ? undefined : { Location: redirectTo.toString() },
    );
    headers.append('Set-Cookie', await createSession(env, request, userId));
    headers.append(
      'Set-Cookie',
      clearCookie(OAUTH_STATE_COOKIE, !isLocalHttpRequest(request)),
    );
    if (mode === 'tab') return authTabResponse(request, 'success', headers);
    return new Response(null, {
      headers,
      status: 302,
    });
  } catch (error) {
    console.warn('OAuth callback failed.', error);
    if (mode === 'tab') {
      const headers = new Headers();
      headers.append(
        'Set-Cookie',
        clearCookie(OAUTH_STATE_COOKIE, !isLocalHttpRequest(request)),
      );
      return authTabResponse(request, 'failed', headers);
    }
    redirectTo.searchParams.set('auth', 'failed');
    return Response.redirect(redirectTo, 302);
  }
};
