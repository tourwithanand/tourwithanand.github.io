// Netlify Function: submit-review
// Expects POST JSON: { name, email, rating, review }
// Actions:
// 1) Generate token
// 2) Create a GitHub Issue to store pending review (requires GITHUB_TOKEN, REPO_OWNER, REPO_NAME env vars)
// 3) Send confirmation email via SendGrid (requires SENDGRID_API_KEY, SITE_URL env vars)

const GITHUB_API = 'https://api.github.com';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, email, rating, review } = payload;
  if (!name || !email || !rating || !review) {
    return { statusCode: 400, body: 'Missing fields' };
  }

  const token = 'r-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36);
  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;
  const githubToken = process.env.GITHUB_TOKEN;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const siteUrl = process.env.SITE_URL || 'https://tourwithanand.github.io';

  if (!repoOwner || !repoName || !githubToken || !sendgridKey) {
    return { statusCode: 500, body: 'Server not configured. Missing environment variables.' };
  }

  // Create GitHub Issue to store pending review
  const issueTitle = `Pending review: ${token}`;
  const issueBody = `Token: ${token}\nName: ${name}\nEmail: ${email}\nRating: ${rating}\nCreatedAt: ${new Date().toISOString()}\n\nReview:\n${review}`;

  try {
    const issueResp = await fetch(`${GITHUB_API}/repos/${repoOwner}/${repoName}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({ title: issueTitle, body: issueBody })
    });

    if (!issueResp.ok) {
      const errText = await issueResp.text();
      console.error('GitHub issue creation failed', errText);
      return { statusCode: 500, body: 'Could not save pending review to GitHub.' };
    }
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error creating GitHub issue.' };
  }

  // Send confirmation email via SendGrid
  const confirmUrl = `${siteUrl}/.netlify/functions/confirm-review?token=${token}`;
  const sgBody = {
    personalizations: [{ to: [{ email }], subject: 'Confirm your review for Tour With Anand' }],
    from: { email: process.env.OWNER_EMAIL || 'info@tourwithanand.com', name: 'Tour With Anand' },
    content: [{ type: 'text/plain', value: `Hi ${name},\n\nThank you for your review. Please confirm by clicking the link below:\n${confirmUrl}\n\nIf you cannot click the link, reply to this email with the token:\n${token}` }]
  };

  try {
    const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sgBody)
    });

    if (!sgResp.ok) {
      const text = await sgResp.text();
      console.error('SendGrid failed', text);
      // sendGrid failure should not lose the pending review — return partial success
      return { statusCode: 202, body: JSON.stringify({ ok: false, message: 'Pending saved; email not sent. Use manual email.' }) };
    }
  } catch (err) {
    console.error('SendGrid error', err);
    return { statusCode: 202, body: JSON.stringify({ ok: false, message: 'Pending saved; email not sent. Use manual email.' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, token }) };
};
