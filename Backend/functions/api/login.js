import {
  getClientIp,
  json,
  sessionCookie,
  verifyPassword,
} from '../_lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SESSION_KV || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) {
    const missing = [
      !env.SESSION_KV && 'SESSION_KV',
      !env.ADMIN_EMAIL && 'ADMIN_EMAIL',
      !env.ADMIN_PASSWORD_HASH && 'ADMIN_PASSWORD_HASH',
    ].filter(Boolean);
    console.error(`Login authentication is missing: ${missing.join(', ')}`);
    return json(
      { error: 'La autenticación no está configurada.', missing },
      503,
    );
  }

  const ip = getClientIp(request);
  const limitKey = `login-attempts:${ip}`;
  const attempts = Number(await env.SESSION_KV.get(limitKey)) || 0;
  if (attempts >= 5) {
    return json(
      { error: 'Demasiados intentos. Espera antes de volver a intentarlo.' },
      429,
      { 'Retry-After': '900' },
    );
  }

  let credentials;
  try {
    credentials = await request.json();
  } catch (_error) {
    return json({ error: 'Solicitud no válida.' }, 400);
  }

  if (
    typeof credentials.email !== 'string' ||
    typeof credentials.password !== 'string'
  ) {
    return json({ error: 'Correo electrónico y contraseña requeridos.' }, 400);
  }

  const emailMatches =
    credentials.email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase();
  const passwordMatches = await verifyPassword(
    credentials.password,
    env.ADMIN_PASSWORD_HASH,
  );

  if (!emailMatches || !passwordMatches) {
    await env.SESSION_KV.put(limitKey, String(attempts + 1), { expirationTtl: 900 });
    return json({ error: 'Correo electrónico o contraseña incorrectos.' }, 401);
  }

  await env.SESSION_KV.delete(limitKey);

  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  await env.SESSION_KV.put(
    `session:${token}`,
    JSON.stringify({ email: env.ADMIN_EMAIL, expiresAt }),
    { expirationTtl: 8 * 60 * 60 },
  );

  return json(
    { ok: true },
    200,
    { 'Set-Cookie': sessionCookie(token, request) },
  );
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, {
    Allow: 'POST',
  });
}
