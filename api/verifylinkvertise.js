import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { token, secret } = req.body;
  if (!token || !secret)
    return res.status(400).json({ error: 'Missing token or secret' });

  const owner = "idkjustarandomdudeherenothingtosee";
  const repo = "ksl";
  const path = "tokens.json";

  try {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path,
    });

    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, 'base64').toString();
    let tokens = JSON.parse(content);

    if (!tokens[token]) {
      return res.status(400).json({ error: 'Token not registered' });
    }

    if (tokens[token].secret !== secret) {
      return res.status(400).json({ error: 'Secret mismatch' });
    }

    tokens[token].linkvertiseDone = true;

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      message: `Verify Linkvertise for token ${token}`,
      content: newContent,
      sha,
    });

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GitHub update failed' });
  }
}
