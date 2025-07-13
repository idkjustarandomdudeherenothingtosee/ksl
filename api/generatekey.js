import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body;

  const owner = "YOUR_GITHUB_USERNAME";
  const repo = "YOUR_REPO_NAME";
  const path = "tokens.json";
  const branch = "main";

  try {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
    });

    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, 'base64').toString();
    let tokens = JSON.parse(content);

    if (!tokens[token]) {
      return res.status(400).json({ error: 'Invalid or used token' });
    }

    if (!tokens[token].linkvertiseDone) {
      return res.status(403).json({ error: 'Complete Linkvertise first' });
    }

    if (tokens[token].used) {
      return res.status(400).json({ error: 'Token already used' });
    }

    tokens[token].used = true;

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      branch,
      message: `Use token ${token} and generate key`,
      content: newContent,
      sha,
    });

    const key = 'KEY-' + Math.random().toString(36).substring(2, 12);

    res.status(200).json({ key });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GitHub update failed' });
  }
}
