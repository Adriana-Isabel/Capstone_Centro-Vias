import { json } from '../_lib/auth.js';

export function onRequestGet(context) {
  return json({ authenticated: true }, 200);
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, { Allow: 'GET' });
}
