module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (req.query.secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const response = await fetch(
    'https://api.github.com/repos/gustavo1209-ship-it/site-florescer/dispatches',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ event_type: 'webflow-publish' }),
    }
  );

  if (response.status === 204) {
    return res.status(200).json({ ok: true });
  }

  const body = await response.text();
  console.error('GitHub API error:', response.status, body);
  return res.status(500).json({ error: 'GitHub API failed' });
};
