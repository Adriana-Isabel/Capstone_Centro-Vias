
import { json, getValidSession } from '../../../_lib/auth.js';

import {
  getGitHubFile,
  githubConfig,
  putGitHubFile
} from '../../../_lib/github.js';

const FILE_PATH = 'Frontend/data/forms.json';

const ALLOWED_IDS = new Set([
  'solicitud',
  'voluntariado'
]);

function isValidFormUrl(value) {
  if (value === '') return true;

  try {
    const url = new URL(value);

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port
    ) {
      return false;
    }

    return (
      (
        url.hostname === 'forms.gle' &&
        url.pathname.length > 1
      ) ||
      (
        url.hostname === 'docs.google.com' &&
        /^\/forms\/d\/(?:e\/)?[^/]+\/viewform\/?$/.test(
          url.pathname
        )
      )
    );
  } catch (_error) {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const session = await getValidSession(request, env);

  if (!session) {
    return json({ error: 'No autorizado.' }, 401);
  }

  if (
    request.headers.get('Origin') !==
    new URL(request.url).origin
  ) {
    return json({ error: 'Origen no permitido.' }, 403);
  }

  if (!env.GITHUB_TOKEN) {
    return json(
      { error: 'Servicio de almacenamiento no disponible.' },
      503
    );
  }

  let body;

  try {
    body = await request.json();
  } catch (_error) {
    return json({ error: 'Solicitud no válida.' }, 400);
  }

  if (
    !body ||
    !ALLOWED_IDS.has(body.id) ||
    typeof body.name !== 'string' ||
    typeof body.description !== 'string' ||
    typeof body.url !== 'string'
  ) {
    return json({ error: 'Formulario no válido.' }, 400);
  }

  const name = body.name.trim();
  const description = body.description.trim();
  const url = body.url.trim();

  if (
    !name ||
    name.length > 150 ||
    description.length > 1000 ||
    url.length > 2000 ||
    !isValidFormUrl(url)
  ) {
    return json(
      { error: 'Verifica los datos y el enlace de Google Forms.' },
      400
    );
  }

  const config = githubConfig(env);

  try {
    const existing = await getGitHubFile(
      config,
      FILE_PATH
    );

    const text = new TextDecoder().decode(
      Uint8Array.from(
        atob(existing.content.replace(/\n/g, '')),
        (character) => character.charCodeAt(0)
      )
    );

    const data = JSON.parse(text);

    if (
      !Array.isArray(data.forms) ||
      !existing.sha ||
      !data.forms.some((form) => form.id === body.id)
    ) {
      return json(
        { error: 'Configuración de formularios no válida.' },
        500
      );
    }

    const updatedForm = {
      id: body.id,
      name,
      description,
      url,
      updatedAt: new Date().toISOString()
    };

    data.forms = data.forms.map((form) =>
      form.id === body.id ? updatedForm : form
    );

    const bytes = new TextEncoder().encode(
      JSON.stringify(data, null, 2) + '\n'
    );

    const content = btoa(
      Array.from(
        bytes,
        (byte) => String.fromCharCode(byte)
      ).join('')
    );

    await putGitHubFile(
      config,
      FILE_PATH,
      content,
      'Update form: ' + body.id,
      existing.sha
    );

    return json({
      ok: true,
      form: updatedForm
    });

  } catch (_error) {
    return json(
      {
        error:
          'No se pudieron guardar los cambios. Inténtalo de nuevo.'
      },
      502
    );
  }
}

export function onRequest() {
  return json(
    { error: 'Método no permitido.' },
    405,
    { Allow: 'POST' }
  );
}