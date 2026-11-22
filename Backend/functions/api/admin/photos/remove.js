import { json } from '../../../_lib/auth.js';
import {
  deleteGitHubFile,
  getGitHubFile,
  githubConfig,
  putGitHubFile,
} from '../../../_lib/github.js';

function decodeManifest(file) {
  if (!file?.content) return { manifest: {}, sha: file?.sha };
  const content = new TextDecoder().decode(
    Uint8Array.from(atob(file.content.replace(/\n/g, '')), (character) =>
      character.charCodeAt(0),
    ),
  );
  try {
    return { manifest: JSON.parse(content), sha: file.sha };
  } catch (_error) {
    return { manifest: {}, sha: file.sha };
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
  if (typeof body.slot !== 'string') {
    return json({ error: 'Slot requerido.' }, 400);
  }

  const config = githubConfig(env);
  let manifestFile;
  try {
    manifestFile = await getGitHubFile(config, 'Frontend/data/photos.json');
  } catch (_error) {
    return json({ ok: true, slot: body.slot }, 200);
  }

  const { manifest, sha } = decodeManifest(manifestFile);
  const entry = manifest[body.slot];
  if (!entry) return json({ ok: true, slot: body.slot }, 200);

  const repositoryPath = `Frontend/${entry.path}`;
  try {
    const imageFile = await getGitHubFile(config, repositoryPath);
    await deleteGitHubFile(
      config,
      repositoryPath,
      imageFile.sha,
      `Remove photo for ${body.slot}`,
    );
  } catch (_error) {
    // The manifest can still be restored to placeholder state.
  }

  delete manifest[body.slot];
  await putGitHubFile(
    config,
    'Frontend/data/photos.json',
    btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2) + '\n'))),
    `Restore placeholder for ${body.slot}`,
    sha,
  );

  return json({ ok: true, slot: body.slot }, 200);
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
}
