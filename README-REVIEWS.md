Reviews feature setup and deployment
=================================

This repository includes a lightweight reviews submission workflow that uses serverless functions (Netlify) to implement double opt-in confirmation and publishing.

Overview
--------
- User submits review via `reviews.html`.
- `/.netlify/functions/submit-review` creates a GitHub Issue (pending store) and sends a confirmation email (SendGrid) to the submitter.
- When the submitter clicks the confirmation link, `/.netlify/functions/confirm-review` finds the pending issue, appends the confirmed review to `data/reviews.json`, and closes the issue.

Requirements
------------
- Deploy on Netlify (or adapt the paths for Vercel)
- Environment variables to set in Netlify site settings:
  - `GITHUB_TOKEN` — a personal access token with `repo` scope to create issues and commit `data/reviews.json`.
  - `REPO_OWNER` — GitHub repo owner (e.g. `tourwithanand`)
  - `REPO_NAME` — repo name (e.g. `tourwithanand.github.io`)
  - `SENDGRID_API_KEY` — SendGrid API key to send confirmation emails
  - `OWNER_EMAIL` — (optional) from address for confirmation emails (default `info@tourwithanand.com`)
  - `SITE_URL` — (optional) your site URL (default `https://tourwithanand.github.io`)

  - `ADMIN_TOKEN` — a secret string you set on Netlify used to authorize review deletions from the admin UI

Notes
-----
- This implementation stores pending reviews as GitHub Issues to avoid requiring a separate database. If you prefer a different pending store (Airtable, Firebase), modify `functions/submit-review.js` accordingly.
- Make sure `data/reviews.json` exists or the confirmation function will create it on first publish.
- GitHub tokens should be kept secret. Use Netlify environment settings.

Deployment steps (Netlify)
-------------------------
1. Push changes to GitHub.
2. Create a new Netlify site and connect to this GitHub repository.
3. Add the required environment variables in Site settings → Build & deploy → Environment.
4. Deploy site. Netlify will expose the functions at `/.netlify/functions/submit-review` and `/.netlify/functions/confirm-review`.

Notes for immediate-publish flow
--------------------------------
- The site now publishes reviews immediately when the visitor submits the form. There is no double opt-in confirmation step.
- On submission the function appends the review to `data/reviews.json` and sends a notification email to `OWNER_EMAIL`.
- To delete a review, use the Admin page `reviews-admin.html` and provide the `ADMIN_TOKEN` (set in Netlify env). The admin page calls `/.netlify/functions/delete-review` to remove the review and commit the updated `data/reviews.json`.

Testing locally
----------------
You can use the Netlify CLI (`netlify dev`) to run functions locally. Install netlify-cli and run:

```bash
npm install -g netlify-cli
netlify dev
```

This will serve the site and functions locally.

Security
--------
- The flow uses a GitHub token to create issues and to commit the published reviews — grant least privilege and rotate tokens regularly.
- Optionally require an owner approval step — the confirm function can be adjusted to require a site-owner password in the query string for extra safety.
