import { getGitHubFile, githubConfig } from '../_lib/github.js';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.GITHUB_TOKEN) {
    return new Response('GITHUB_TOKEN no está configurado.', { status: 503 });
  }

  const path = new URL(request.url).searchParams.get('path');
  if (!/^Images\/photos\/[^/]+\.(jpg|jpeg|png|webp|gif)$/i.test(path || '')) {
    return new Response('Ruta de imagen no válida.', { status: 400 });
  }

  try {
    const file = await getGitHubFile(githubConfig(env), `Frontend/${path}`);
    if (!file?.content) {
      return new Response('Imagen no encontrada.', { status: 404 });
    }

    const bytes = Uint8Array.from(atob(file.content.replace(/\n/g, '')), (character) =>
      character.charCodeAt(0),
    );
    const extension = path.split('.').pop().toLowerCase();

    return new Response(bytes, {
      headers: {
        'Content-Type': MIME_TYPES[extension],
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (_error) {
    return new Response('No se pudo cargar la imagen.', { status: 502 });
  }
}
