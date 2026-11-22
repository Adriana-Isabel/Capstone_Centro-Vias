export function githubConfig(env) {
  return {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER || 'Centro-VIAS',
    repo: env.GITHUB_REPO || 'Capstone_Centro-Vias',
    branch: env.GITHUB_BRANCH || 'main',
  };
}

async function githubRequest(config, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }

  return response.status === 204 ? null : response.json();
}

export async function getGitHubFile(config, path) {
  return githubRequest(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${path}?ref=${encodeURIComponent(config.branch)}`,
  );
}

export async putGitHubFile(config, path, content, message, sha) {
  return githubRequest(config, `/repos/${config.owner}/${config.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content,
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

export async deleteGitHubFile(config, path, sha, message) {
  return githubRequest(config, `/repos/${config.owner}/${config.repo}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: config.branch }),
  });
}
