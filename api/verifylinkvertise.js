import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.SUPER_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { token, secret, hwid, sig } = req.body;

  if (!token || !secret || !hwid || !sig)
    return res.status(400).json({ error: "Missing fields" });

  // Very simple signature check: sig should equal token+hwid+SHARED_SECRET
  const SHARED_SECRET = process.env.SHARED_SECRET || "thepass_XYZ156kinhj";

  if (sig !== token + hwid + SHARED_SECRET)
    return res.status(400).json({ error: "Invalid signature" });

  const owner = "idkjustarandomdudeherenothingtosee";
  const repo = "ksl";
  const path = "tokens.json";

  try {
    const { data: fileData } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path }
    );

    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, "base64").toString();
    let tokens = JSON.parse(content);

    const tokenData = tokens[token];
    if (!tokenData) {
      return res.status(400).json({ error: "Token not found" });
    }

    if (tokenData.secret !== secret) {
      return res.status(400).json({ error: "Invalid secret" });
    }

    if (tokenData.linkvertiseDone) {
      return res.status(400).json({ error: "Linkvertise already verified" });
    }

    // Update token info
    tokenData.linkvertiseDone = true;
    tokenData.hwid = hwid;

    tokens[token] = tokenData;

    const newContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString("base64");

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      branch: "main",
      message: `Verify Linkvertise for token ${token}`,
      content: newContent,
      sha,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub update failed" });
  }
}
