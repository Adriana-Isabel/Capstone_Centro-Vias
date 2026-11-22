export const SESSION_COOKIE = 'cvias_admin_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

export function getClientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function parseCookies(request) {
  const cookies = {};
  for (const pair of (request.headers.get('Cookie') || '').split(';')) {
    const index = pair.indexOf('=');
    if (index > 0) {
      cookies[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
    }
  }
  return cookies;
}

export function isSecureRequest(request) {
  return request.url.startsWith('https://');
}

export function sessionCookie(token, request, maxAge = SESSION_TTL_SECONDS) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (isSecureRequest(request)) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(request) {
  return sessionCookie('', request, 0);
}

export async function getValidSession(request, env) {
  if (!env.SESSION_KV) return null;
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;

  const stored = await env.SESSION_KV.get(`session:${token}`, { type: 'json' });
  if (!stored || typeof stored.expiresAt !== 'number') return null;
  if (stored.expiresAt <= Date.now()) {
    await env.SESSION_KV.delete(`session:${token}`);
    return null;
  }
  return stored;
}

export function constantTimeEqualHex(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, encodedHash) {
  const parts = encodedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;

  const iterations = Number(parts[1]);
  if (!Number.isSafeInteger(iterations) || iterations < 100000) return false;

  let salt;
  try {
    salt = Uint8Array.from(atob(parts[2]), (character) => character.charCodeAt(0));
  } catch (_error) {
    return false;
  }

  const expectedBytes = Uint8Array.from(atob(parts[3]), (character) => character.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    expectedBytes.length * 8,
  );

  return constantTimeEqualHex(bytesToHex(derived), bytesToHex(expectedBytes));
}
