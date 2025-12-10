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
        const ownerEmail = process.env.OWNER_EMAIL || 'info@tourwithanand.com';

        if (!repoOwner || !repoName || !githubToken || !sendgridKey) {
          return { statusCode: 500, body: 'Server not configured. Missing environment variables.' };
        }

        // Append review to data/reviews.json in repository
        const filePath = 'data/reviews.json';
        try {
          // Fetch existing file (if any)
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

          const newReview = { id: token, name, email, rating, review, createdAt: new Date().toISOString() };
          reviews.push(newReview);

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
        } catch (err) {
          console.error('Error publishing review', err);
          return { statusCode: 500, body: 'Error publishing review' };
        }

        // Send notification email to owner via SendGrid
        const sgBody = {
          personalizations: [{ to: [{ email: ownerEmail }], subject: 'New review submitted on Tour With Anand' }],
          from: { email: ownerEmail, name: 'Tour With Anand' },
          content: [{ type: 'text/plain', value: `New review submitted:\n\nName: ${name}\nEmail: ${email}\nRating: ${rating}\n\nReview:\n${review}\n\nID: ${token}\n` }]
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
            // Return success since review is published, but notify admin that email failed
            return { statusCode: 200, body: JSON.stringify({ ok: true, token, emailSent: false, message: 'Review published; notification email failed.' }) };
          }
        } catch (err) {
          console.error('SendGrid error', err);
          return { statusCode: 200, body: JSON.stringify({ ok: true, token, emailSent: false, message: 'Review published; notification email failed.' }) };
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true, token, emailSent: true }) };
