import { getClientIp, json } from '../_lib/auth.js';

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_PER_DAY = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 5 * 60 * 1000;

function hasCommentsDatabase(env) {
  if (env.COMMENTS_DB) return true;
  console.error('Public reviews API is missing the COMMENTS_DB binding.');
  return false;
}

async function hashSubmitter(ip, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function onRequestGet({ env }) {
  if (!hasCommentsDatabase(env)) {
    return json({ error: 'Los comentarios no están disponibles ahora.' }, 503);
  }

  try {
    const result = await env.COMMENTS_DB.prepare(
      `SELECT id, author_name AS authorName, message, submitted_at AS submittedAt
       FROM reviews
       WHERE status = 'approved'
       ORDER BY submitted_at DESC
       LIMIT 50`,
    ).all();
    return json({ reviews: result.results || [] });
  } catch (error) {
    console.error('Failed to load approved reviews:', error);
    return json({ error: 'No se pudieron cargar los comentarios.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!hasCommentsDatabase(env)) {
    return json({ error: 'Los comentarios no están disponibles ahora.' }, 503);
  }

  if (!env.ADMIN_PASSWORD_HASH) {
    console.error('Public reviews API is missing the ADMIN_PASSWORD_HASH secret.');
    return json({ error: 'No se pudo procesar el comentario ahora.' }, 503);
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > 16_384) {
      return json({ error: 'La solicitud es demasiado grande.' }, 413);
    }
    body = JSON.parse(text);
  } catch (_error) {
    return json({ error: 'Solicitud no válida.' }, 400);
  }

  if (
    !body ||
    typeof body.authorName !== 'string' ||
    typeof body.message !== 'string'
  ) {
    return json({ error: 'Escribe tu nombre y un comentario.' }, 400);
  }

  const authorName = body.authorName.trim();
  const message = body.message.trim();
  if (
    authorName.length < 1 ||
    authorName.length > MAX_NAME_LENGTH ||
    message.length < 1 ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return json(
      { error: 'Revisa el nombre y el comentario; exceden el largo permitido.' },
      400,
    );
  }

  const ip = getClientIp(request);
  if (ip === 'unknown') {
    console.error('Public reviews API could not determine the submitter IP.');
    return json({ error: 'No se pudo identificar tu conexión.' }, 503);
  }

  let submitterKey;
  try {
    submitterKey = await hashSubmitter(ip, env.ADMIN_PASSWORD_HASH);
  } catch (error) {
    console.error('Failed to derive the review submitter key:', error);
    return json({ error: 'No se pudo procesar el comentario ahora.' }, 500);
  }

  const now = Date.now();
  const id = crypto.randomUUID();

  try {
    const insertion = await env.COMMENTS_DB.prepare(
      `INSERT INTO reviews (
         id, author_name, message, submitter_key, submitted_at, status
       )
       SELECT ?, ?, ?, ?, ?, 'pending'
       WHERE (
         SELECT COUNT(*)
         FROM reviews
         WHERE submitter_key = ? AND submitted_at > ?
       ) < ?
       AND (
         SELECT COALESCE(MAX(submitted_at), 0)
         FROM reviews
         WHERE submitter_key = ?
       ) <= ?
       RETURNING id`,
    )
      .bind(
        id,
        authorName,
        message,
        submitterKey,
        now,
        submitterKey,
        now - DAY_MS,
        MAX_MESSAGES_PER_DAY,
        submitterKey,
        now - COOLDOWN_MS,
      )
      .run();

    if (insertion.meta.changes === 1) {
      return json({ ok: true, status: 'pending' }, 201);
    }

    const limits = await env.COMMENTS_DB.prepare(
      `SELECT
         MAX(submitted_at) AS last_submitted_at,
         SUM(CASE WHEN submitted_at > ? THEN 1 ELSE 0 END) AS recent_count,
         MIN(CASE WHEN submitted_at > ? THEN submitted_at END) AS oldest_recent_at
       FROM reviews
       WHERE submitter_key = ?`,
    )
      .bind(now - DAY_MS, now - DAY_MS, submitterKey)
      .first();

    const lastSubmittedAt = Number(limits?.last_submitted_at) || 0;
    if (lastSubmittedAt > now - COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil(
        (lastSubmittedAt + COOLDOWN_MS - now) / 1000,
      );
      return json(
        {
          error: `Espera ${retryAfterSeconds} segundos antes de enviar otro comentario.`,
          reason: 'cooldown',
          retryAfterSeconds,
        },
        429,
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }

    if (Number(limits?.recent_count) >= MAX_MESSAGES_PER_DAY) {
      const oldestRecentAt = Number(limits.oldest_recent_at) || now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestRecentAt + DAY_MS - now) / 1000),
      );
      return json(
        {
          error: 'Ya enviaste cinco comentarios en las últimas 24 horas.',
          reason: 'daily_limit',
          retryAfterSeconds,
        },
        429,
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }

    console.error('Review submission was not inserted and no limit was reached.');
    return json({ error: 'No se pudo enviar el comentario.' }, 500);
  } catch (error) {
    console.error('Failed to submit review:', error);
    return json({ error: 'No se pudo enviar el comentario ahora.' }, 500);
  }
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, {
    Allow: 'GET, POST',
  });
}
