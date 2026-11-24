import { json } from '../_lib/auth.js';
import { getGitHubFile, githubConfig } from '../_lib/github.js';

function decodeFile(file) {
  if (!file?.content) return null;
  try {
    const text = new TextDecoder().decode(
      Uint8Array.from(atob(file.content.replace(/\n/g, '')), (character) =>
        character.charCodeAt(0),
      ),
    );
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.GITHUB_TOKEN) {
    return json({}, 503);
  }

  try {
    const file = await getGitHubFile(githubConfig(env), 'Frontend/data/photos.json');
    const data = decodeFile(file);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return json(data, 200);
    }
  } catch (_error) {
    // The frontend static fallback remains available.
  }

  return json({}, 200);
}
