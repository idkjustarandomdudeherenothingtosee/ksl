import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body;
  if (!token)
    return res.status(400).json({ error: 'Missing token' });

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
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (!tokens[token].linkvertiseDone) {
      return res.status(403).json({ error: 'Linkvertise not completed' });
    }

    if (tokens[token].used) {
      return res.status(403).json({ error: 'Key already generated for this token' });
    }

    // Mark token used
    tokens[token].used = true;

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      message: `Generate key for token ${token}`,
      content: newContent,
      sha,
    });

    // Generate the key string
    const key = 'KEY-' + Math.random().toString(36).substring(2, 12).toUpperCase();

    res.status(200).json({ key });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GitHub update failed' });
  }
}
