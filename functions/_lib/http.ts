export function json(value: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  });
}

export function error(message: string, status = 400) {
  return json({ error: message, ok: false }, { status });
}

export function getCookie(request: Request, name: string) {
  const header = request.headers.get('Cookie');
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }

  return undefined;
}

export function cookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    sameSite?: 'Lax' | 'Strict';
    secure?: boolean;
  } = {},
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    `SameSite=${options.sameSite ?? 'Lax'}`,
    'HttpOnly',
  ];
  if (options.secure ?? true) parts.push('Secure');
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

export function clearCookie(name: string, secure = true) {
  return cookie(name, '', { maxAge: 0, secure });
}

export function isLocalHttpRequest(request: Request) {
  const url = new URL(request.url);
  return (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  );
}
