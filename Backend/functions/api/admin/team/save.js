import { json } from '../../../_lib/auth.js';
import { getGitHubFile, githubConfig, putGitHubFile } from '../../../_lib/github.js';

function decodeJson(file) {
  if (!file?.content) return { sha: file?.sha };
  const text = new TextDecoder().decode(
    Uint8Array.from(atob(file.content.replace(/\n/g, '')), (character) =>
      character.charCodeAt(0),
    ),
  );
  try {
    return { data: JSON.parse(text), sha: file.sha };
  } catch (_error) {
    return { sha: file.sha };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.GITHUB_TOKEN) {
    return json({ error: 'GITHUB_TOKEN no está configurado.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return json({ error: 'Solicitud no válida.' }, 400);
  }
  if (!Array.isArray(body.profiles) || body.profiles.length > 100) {
    return json({ error: 'Lista de perfiles no válida.' }, 400);
  }

  const profiles = body.profiles.map((profile) => ({
    id: String(profile.id || '').slice(0, 100),
    nombre: String(profile.nombre || '').slice(0, 100),
    rol: String(profile.rol || '').slice(0, 100),
    bio: String(profile.bio || '').slice(0, 1000),
    foto: String(profile.foto || '').slice(0, 500),
    alt: String(profile.alt || '').slice(0, 160),
  }));

  const config = githubConfig(env);
  let existing;
  try {
    existing = await getGitHubFile(config, 'Frontend/data/team.json');
  } catch (_error) {
    existing = null;
  }
  const { sha } = decodeJson(existing);
  const content = btoa(
    unescape(encodeURIComponent(JSON.stringify({ profiles }, null, 2) + '\n')),
  );

  try {
    await putGitHubFile(
      config,
      'Frontend/data/team.json',
      content,
      'Update team profiles',
      sha,
    );
  } catch (_error) {
    return json(
      {
        error:
          'GitHub rechazó la escritura. Confirma que GITHUB_TOKEN tiene acceso al repositorio y permiso Contents: Read and write.',
      },
      403,
    );
  }

  return json({ ok: true }, 200);
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
}
