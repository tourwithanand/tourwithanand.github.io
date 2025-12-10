// Netlify Function: delete-review
// Expects POST JSON: { id }
// Requires header: x-admin-token: <ADMIN_TOKEN>
// Action: remove review with matching id from data/reviews.json and commit

const GITHUB_API = 'https://api.github.com';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const adminToken = process.env.ADMIN_TOKEN;
  const provided = (event.headers && (event.headers['x-admin-token'] || event.headers['X-Admin-Token'])) || null;
  if (!adminToken || !provided || provided !== adminToken) return { statusCode: 401, body: 'Unauthorized' };

  let payload;
  try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }
  const { id } = payload;
  if (!id) return { statusCode: 400, body: 'Missing id' };

  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;
  const githubToken = process.env.GITHUB_TOKEN;
  if (!repoOwner || !repoName || !githubToken) return { statusCode: 500, body: 'Server misconfigured' };

  const filePath = 'data/reviews.json';
  try {
    const getResp = await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github+json' }
    });
    if (!getResp.ok) return { statusCode: 500, body: 'Could not read reviews.json' };
    const json = await getResp.json();
    const sha = json.sha;
    const content = Buffer.from(json.content, 'base64').toString('utf8');
    let reviews = [];
    try { reviews = JSON.parse(content); } catch (e) { reviews = []; }

    const filtered = reviews.filter(r => r.id !== id);
    if (filtered.length === reviews.length) return { statusCode: 404, body: 'Review not found' };

    const updatedContent = Buffer.from(JSON.stringify(filtered, null, 2)).toString('base64');
    const putResp = await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({ message: `Delete review ${id}`, content: updatedContent, sha })
    });
    if (!putResp.ok) {
      const t = await putResp.text();
      console.error('Failed to commit updated reviews.json', t);
      return { statusCode: 500, body: 'Failed to delete review' };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error deleting review' };
  }
};
