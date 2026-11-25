import { getValidSession, json } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  if (!env.COMMENTS_DB) {
    console.error('Admin reviews API is missing the COMMENTS_DB binding.');
    return json({ error: 'La cola de comentarios no está disponible.' }, 503);
  }

  try {
    const result = await env.COMMENTS_DB.prepare(
      `SELECT id, author_name AS authorName, message, submitted_at AS submittedAt
       FROM reviews
       WHERE status = 'pending'
       ORDER BY submitted_at ASC
       LIMIT 100`,
    ).all();
    return json({ reviews: result.results || [] });
  } catch (error) {
    console.error('Failed to load pending reviews:', error);
    return json({ error: 'No se pudieron cargar los comentarios pendientes.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.COMMENTS_DB) {
    console.error('Admin reviews API is missing the COMMENTS_DB binding.');
    return json({ error: 'La cola de comentarios no está disponible.' }, 503);
  }

  const session = await getValidSession(request, env);
  if (!session) {
    return json({ error: 'No autorizado.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return json({ error: 'Solicitud no válida.' }, 400);
  }

  if (
    typeof body?.id !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(body.id) ||
    !['approved', 'rejected'].includes(body.status)
  ) {
    return json({ error: 'La decisión de moderación no es válida.' }, 400);
  }

  try {
    const result = await env.COMMENTS_DB.prepare(
      `UPDATE reviews
       SET status = ?, reviewed_at = ?, reviewed_by = ?
       WHERE id = ? AND status = 'pending'`,
    )
      .bind(body.status, Date.now(), session.email, body.id)
      .run();

    if (result.meta.changes !== 1) {
      return json(
        { error: 'El comentario ya fue revisado o no existe.' },
        409,
      );
    }

    return json({ ok: true, status: body.status });
  } catch (error) {
    console.error('Failed to moderate review:', error);
    return json({ error: 'No se pudo guardar la decisión.' }, 500);
  }
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, {
    Allow: 'GET, POST',
  });
}
