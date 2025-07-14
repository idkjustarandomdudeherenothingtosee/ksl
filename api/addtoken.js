import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

function generateSecret(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token } = req.body;
  if (!token || token.length < 5)
    return res.status(400).json({ error: "Invalid token" });

  const owner = "idkjustarandomdudeherenothingtosee";
  const repo = "ksl";
  const path = "tokens.json";
  const branch = "main";

  try {
    const { data: fileData } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path }
    );

    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, "base64").toString();
    let tokens = JSON.parse(content);

    if (tokens[token]) {
      return res.status(400).json({ error: "Token already registered" });
    }

    const secret = generateSecret();

    tokens[token] = {
      used: false,
      secret,
      linkvertiseDone: false,
      key: null,
      hwid: null,
    };

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString("base64");

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      branch,
      message: `Add token ${token} with secret`,
      content: newContent,
      sha,
    });

    res.status(200).json({ success: true, secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub update failed" });
  }
}
