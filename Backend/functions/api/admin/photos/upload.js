import { json } from '../../../_lib/auth.js';
import {
  deleteGitHubFile,
  getGitHubFile,
  githubConfig,
  putGitHubFile,
} from '../../../_lib/github.js';

const SLOT_IDS = new Set([
  'home-hero',
  'home-excursion',
  'home-activity',
  'activities-cooking',
  'activities-puzzles',
  'activities-recreation',
  'activities-outings',
  'team-feature',
  'donations-feature',
  'contact-feature',
]);

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function decodeManifest(file) {
  if (!file?.content) return { manifest: {}, sha: file?.sha };
  const bytes = Uint8Array.from(atob(file.content.replace(/\n/g, '')), (character) =>
    character.charCodeAt(0),
  );
  const content = new TextDecoder().decode(bytes);
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

  let form;
  try {
    form = await request.formData();
  } catch (_error) {
    return json({ error: 'Solicitud no válida.' }, 400);
  }

  const slot = form.get('slot');
  const file = form.get('file');
  if (!SLOT_IDS.has(slot) || !(file instanceof File)) {
    return json({ error: 'Slot o archivo no válido.' }, 400);
  }
  if (!MIME_EXTENSIONS[file.type]) {
    return json({ error: 'Solo se permiten JPG, PNG, WebP o GIF.' }, 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    return json({ error: 'La imagen no puede superar 5 MB.' }, 400);
  }

  const config = githubConfig(env);
  let manifestFile = null;
  try {
    manifestFile = await getGitHubFile(config, 'Frontend/data/photos.json');
  } catch (_error) {
    manifestFile = null;
  }

  const { manifest, sha } = decodeManifest(manifestFile);
  if (manifest[slot]?.path) {
    try {
      const oldFile = await getGitHubFile(config, manifest[slot].path);
      await deleteGitHubFile(
        config,
        manifest[slot].path,
        oldFile.sha,
        `Remove previous photo for ${slot}`,
      );
    } catch (_error) {
      // Continue: a missing old file should not prevent a replacement.
    }
  }

  const extension = MIME_EXTENSIONS[file.type];
  const path = `Frontend/Images/photos/${slot}-${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  await putGitHubFile(
    config,
    path,
    btoa(binary),
    `Add photo for ${slot}`,
  );

  const updatedManifest = {
    ...manifest,
    [slot]: {
      path: `Images/photos/${path.split('/').pop()}`,
      alt: String(form.get('alt') || '').trim(),
    },
  };
  await putGitHubFile(
    config,
    'Frontend/data/photos.json',
    btoa(unescape(encodeURIComponent(JSON.stringify(updatedManifest, null, 2) + '\n'))),
    `Update photo manifest for ${slot}`,
    sha,
  );

  return json({ ok: true, slot, path: updatedManifest[slot].path }, 200);
}

export function onRequest() {
  return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
}
