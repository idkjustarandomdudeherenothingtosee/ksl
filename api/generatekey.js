import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const owner = "idkjustarandomdudeherenothingtosee";
  const repo = "ksl";
  const path = "tokens.json";
  const branch = "main";

  try {
    // Fetch current tokens.json
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
    });

    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, 'base64').toString();
    let tokens = JSON.parse(content);

    // Validate token exists and registered but not used
    if (!tokens[token] || tokens[token].used) {
      return res.status(400).json({ error: 'Invalid or used token' });
    }

    // Mark token as used
    tokens[token].used = true;

    // Save updated tokens.json
    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      branch,
      message: `Mark token ${token} as used`,
      content: newContent,
      sha,
    });

    // Generate a random key (customize as you want)
    const key = 'KEY-' + Math.random().toString(36).substring(2, 12).toUpperCase();

    return res.status(200).json({ key });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'GitHub update failed' });
  }
}
