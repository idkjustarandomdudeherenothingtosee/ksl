import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token || typeof token !== 'string' || token.length < 20) {
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

    // Add the new token, mark as registered (can be a boolean or object)
    tokens[token] = { registered: true, used: false };

    // Save updated tokens.json
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

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'GitHub update failed' });
  }
}
