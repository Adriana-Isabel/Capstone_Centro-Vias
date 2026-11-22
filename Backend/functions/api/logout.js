import { clearSessionCookie, json, parseCookies, SESSION_COOKIE } from '../_lib/auth.js';

export async function onRequestPost(context) {
  const token = parseCookies(context.request)[SESSION_COOKIE];
  if (token && context.env.SESSION_KV) {
    await context.env.SESSION_KV.delete(`session:${token}`);
  }

  return json(
    { ok: true },
    200,
    { 'Set-Cookie': clearSessionCookie(context.request) },
  );
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
}
