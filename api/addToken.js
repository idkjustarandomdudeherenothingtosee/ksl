// /api/addToken.js
import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token || token.length < 5) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const owner = "idkjustarandomdudeherenothingtosee";
  const repo = "ksl";
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

    tokens[token] = true;

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      branch,
      message: `Add token ${token}`,
      content: newContent,
      sha,
    });

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GitHub update failed' });
  }
}
