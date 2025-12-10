// Client-side review form handling.
// This file implements a double opt-in flow placeholder:
// 1. Collects review data and generates a confirmation token.
// 2. Sends a confirmation email request to the site owner via a mailto link
//    (or can be wired to Formspree/Netlify/email API by replacing sendConfirmationEmail()).
// 3. On confirmation (clicking link in the email) the owner or system can mark the review as published.

function uuid() {
  // Simple token generator
  return 'r-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('review-form');
  const msg = document.getElementById('message');
  const mailtoBtn = document.getElementById('mailto-btn');

  mailtoBtn.addEventListener('click', () => {
    // Build a simple mailto that user can send to owner with the review content
    const name = document.getElementById('name').value || '';
    const email = document.getElementById('email').value || '';
    const rating = document.getElementById('rating').value || '';
    const review = document.getElementById('review').value || '';
    const subject = encodeURIComponent('Review submission for Tour With Anand');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nRating: ${rating}\n\nReview:\n${review}`);
    const mailto = `mailto:info@tourwithanand.com?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const data = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      rating: document.getElementById('rating').value,
      review: document.getElementById('review').value.trim(),
    };

    // Try to POST to serverless endpoint. If it fails, fallback to opening a mailto.
    try {
      const res = await fetch('/.netlify/functions/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Submit failed');
      }

      const body = await res.json();
      msg.innerHTML = `Thanks ${data.name}! A confirmation email has been sent to ${data.email}. Please click the confirmation link in your email.`;
      form.reset();
    } catch (err) {
      console.error('Submit failed, falling back to mailto', err);
      msg.textContent = 'Automatic submission failed. Please use the "Use email to submit" button.';
    }
  });
});

async function sendConfirmationEmail(data) {
  // Default behavior for a static site: open a mailto to the site owner including a confirmation token and link.
  // The confirmation link is a placeholder that would be handled by a server in a full implementation.

  const siteOwner = 'info@tourwithanand.com';
  const token = data.id;
  const confirmUrl = `${window.location.origin}/reviews-confirm.html?token=${token}`; // placeholder

  const subject = encodeURIComponent('Please confirm your review for Tour With Anand');
  const body = encodeURIComponent(
    `Dear ${data.name},\n\nThank you for submitting your review. Please confirm your review by clicking the link below:\n\n${confirmUrl}\n\nIf the link doesn't work, reply with the following token to info@tourwithanand.com:\n\nToken: ${token}\n\n---\nReview:\nRating: ${data.rating}\n${data.review}`
  );

  // Open user's default mail client to send the confirmation email OR open a prefilled email to the owner.
  // Note: In production replace this with an API call to send the email automatically.
  const mailto = `mailto:${siteOwner}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}

// NOTE for deployment:
// - To make this fully automated replace sendConfirmationEmail() with a call to an email API (e.g., SendGrid) inside a serverless function.
// - The server should store incoming reviews in a pending store (DB or GitHub issue) and send a confirmation email to the submitter with a unique token/URL.
// - Once the user clicks the confirmation link, the server marks the review as confirmed and publishes it (adds to published JSON or merges a PR).
