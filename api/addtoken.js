import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });
const SECRET = process.env.SHARED_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { token, hwid, sig } = req.body;
  if (!token || !hwid || !sig) return res.status(400).json({ error: "Missing fields" });

  const checkSig = token + hwid + SECRET;
  if (sig !== checkSig) {
    return res.status(400).json({ error: "Invalid Light Hub signature" });
  }

  const owner = "idkjustarandomdudeherenothingtosee";
  const repo = "ksl";
  const path = "tokens.json";
  const branch = "main";

  try {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path
    });

    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, 'base64').toString();
    let tokens = JSON.parse(content);

    tokens[token] = { hwid, used: false };

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path, branch,
      message: `Register Light Hub token ${token}`,
      content: newContent,
      sha
    });

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub update failed for Light Hub" });
  }
}
