import { cookie, getCookie, isLocalHttpRequest } from './http';
import type { Env, ProviderProfile } from './types';

export type OAuthProvider = 'google' | 'yandex';

export const OAUTH_STATE_COOKIE = 'font_effects_oauth_state';

const providerConfig = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
  },
  yandex: {
    authUrl: 'https://oauth.yandex.com/authorize',
    scope: 'login:email login:info',
    tokenUrl: 'https://oauth.yandex.com/token',
    userInfoUrl: 'https://login.yandex.ru/info?format=json',
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'yandex';
}

function clientId(env: Env, provider: OAuthProvider) {
  return provider === 'google' ? env.GOOGLE_CLIENT_ID : env.YANDEX_CLIENT_ID;
}

function clientSecret(env: Env, provider: OAuthProvider) {
  return provider === 'google'
    ? env.GOOGLE_CLIENT_SECRET
    : env.YANDEX_CLIENT_SECRET;
}

export function redirectUri(request: Request, provider: OAuthProvider) {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/callback/${provider}`;
}

export function createOAuthRedirect(env: Env, request: Request, provider: OAuthProvider) {
  const id = clientId(env, provider);
  if (!id) return null;

  const state = crypto.randomUUID();
  const config = providerConfig[provider];
  const url = new URL(config.authUrl);
  url.searchParams.set('client_id', id);
  url.searchParams.set('redirect_uri', redirectUri(request, provider));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', state);

  return new Response(null, {
    headers: {
      Location: url.toString(),
      'Set-Cookie': cookie(OAUTH_STATE_COOKIE, state, {
        maxAge: 10 * 60,
        secure: !isLocalHttpRequest(request),
      }),
    },
    status: 302,
  });
}

export async function exchangeOAuthCode(
  env: Env,
  request: Request,
  provider: OAuthProvider,
) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const expectedState = getCookie(request, OAUTH_STATE_COOKIE);
  const code = url.searchParams.get('code');
  const id = clientId(env, provider);
  const secret = clientSecret(env, provider);
  if (!id || !secret) throw new Error(`${provider} OAuth is not configured.`);
  if (!code || !state || state !== expectedState) {
    throw new Error('OAuth state is invalid.');
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  body.set('client_id', id);
  body.set('client_secret', secret);
  body.set('redirect_uri', redirectUri(request, provider));

  const tokenResponse = await fetch(providerConfig[provider].tokenUrl, {
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  const token = await tokenResponse.json<{
    access_token?: string;
    error_description?: string;
  }>();
  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(token.error_description ?? 'OAuth token exchange failed.');
  }

  const profileResponse = await fetch(providerConfig[provider].userInfoUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = await profileResponse.json<Record<string, unknown>>();
  if (!profileResponse.ok) throw new Error('OAuth profile request failed.');

  if (provider === 'google') {
    return {
      displayName: String(profile.name ?? profile.email ?? 'Google User'),
      email: String(profile.email ?? ''),
      providerUserId: String(profile.sub ?? ''),
    } satisfies ProviderProfile;
  }

  return {
    displayName: String(profile.display_name ?? profile.real_name ?? 'Yandex User'),
    email: String(profile.default_email ?? ''),
    providerUserId: String(profile.id ?? ''),
  } satisfies ProviderProfile;
}
