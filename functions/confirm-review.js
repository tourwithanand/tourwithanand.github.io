// Netlify Function: confirm-review
// Expects query parameter: token
// Actions:
// 1) Find GitHub issue with title 'Pending review: token'
// 2) If found, parse content and append review to `data/reviews.json` in the repo using GitHub Contents API

const GITHUB_API = 'https://api.github.com';

exports.handler = async function(event, context) {
  const token = (event.queryStringParameters && event.queryStringParameters.token) || null;
  if (!token) {
    return { statusCode: 400, body: 'Missing token' };
  }

  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!repoOwner || !repoName || !githubToken) {
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  // 1) Find issue
  try {
    const issuesResp = await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/issues?state=open`, {
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github+json' }
    });
    const issues = await issuesResp.json();
    const target = issues.find(i => i.title && i.title.includes(token));
    if (!target) {
      return { statusCode: 404, body: 'Pending review not found' };
    }

    // Parse the issue body to extract review data (we stored it as plain text)
    const body = target.body || '';
    const parsed = parseIssueBody(body);

    // 2) Fetch existing data/reviews.json (if exists)
    const filePath = 'data/reviews.json';
    const getResp = await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github+json' }
    });

    let reviews = [];
    let sha = null;
    if (getResp.ok) {
      const json = await getResp.json();
      sha = json.sha;
      const content = Buffer.from(json.content, 'base64').toString('utf8');
      try { reviews = JSON.parse(content); } catch (e) { reviews = []; }
    }

    // Append the new confirmed review
    const newReview = { id: token, name: parsed.name || 'Anonymous', email: parsed.email || '', rating: parsed.rating || 5, review: parsed.review || '', createdAt: new Date().toISOString() };
    reviews.push(newReview);

    // Commit updated reviews.json back to repo
    const updatedContent = Buffer.from(JSON.stringify(reviews, null, 2)).toString('base64');
    const putResp = await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({ message: `Publish review ${token}`, content: updatedContent, sha })
    });

    if (!putResp.ok) {
      const t = await putResp.text();
      console.error('Failed to commit reviews.json', t);
      return { statusCode: 500, body: 'Failed to publish review' };
    }

    // Close the pending issue
    await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/issues/${target.number}`, {
      method: 'PATCH',
      headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({ state: 'closed' })
    });

    return { statusCode: 200, body: 'Review confirmed and published' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error processing confirmation' };
  }
};

function parseIssueBody(body) {
  // Simple parser for the format written in submit-review
  const lines = body.split('\n');
  const data = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('Token:')) data.token = line.replace('Token:', '').trim();
    else if (line.startsWith('Name:')) data.name = line.replace('Name:', '').trim();
    else if (line.startsWith('Email:')) data.email = line.replace('Email:', '').trim();
    else if (line.startsWith('Rating:')) data.rating = line.replace('Rating:', '').trim();
    else if (line.startsWith('CreatedAt:')) data.createdAt = line.replace('CreatedAt:', '').trim();
    else if (line.startsWith('Review:')) {
      // read the rest as review
      data.review = lines.slice(i+1).join('\n').trim();
      break;
    }
    i++;
  }
  return data;
}
