# Newsletter Worker - Deployment Guide

## 🎯 Purpose
Secure Cloudflare Worker to handle newsletter subscriptions via Brevo API.
This protects your Brevo API key from being exposed in the frontend.

## 📂 File
`workers/newsletter-subscribe.js`

## 🚀 Deployment Steps

### 1. Navigate to Workers Directory

```bash
cd workers
```

### 2. Deploy Worker

```bash
npx wrangler deploy --config wrangler.newsletter.toml
```

This will:
- Create the worker named `newsletter-subscribe`
- Deploy the code from `newsletter-subscribe.js`
- Give you a worker URL like: `https://newsletter-subscribe.YOUR-SUBDOMAIN.workers.dev`

### 3. Set Brevo API Key (Secret)

**CRITICAL:** Set the Brevo API key as a secret

```bash
npx wrangler secret put BREVO_API_KEY --config wrangler.newsletter.toml
```

When prompted, paste your Brevo API key (get it from [Brevo → Settings → API Keys](https://app.brevo.com/settings/keys/api))

### 4. Update List ID (if needed)
In `newsletter-subscribe.js`, line 12:
```javascript
const LIST_ID = 2; // Update to your Brevo list ID
```

To find your List ID:
1. Go to [Brevo Contacts](https://app.brevo.com/contact/list)
2. Click on your list
3. The ID is in the URL: `.../list/ID`

**After updating, redeploy:**
```bash
npx wrangler deploy --config wrangler.newsletter.toml
```

### 5. Update Frontend

Update `blog/article-template-new.html` (line ~562):

```javascript
// Replace localStorage code with:
const response = await fetch('https://newsletter-subscribe.YOUR-SUBDOMAIN.workers.dev', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email })
});

const result = await response.json();

if (result.success) {
    messageDiv.className = 'newsletter-message success';
    messageDiv.textContent = result.message;
    document.getElementById('newsletterEmail').value = '';
} else {
    messageDiv.className = 'newsletter-message error';
    messageDiv.textContent = result.error || 'Erreur lors de l\'inscription.';
}
```

### 6. Update List ID (if needed)

In the worker code, line 10:
```javascript
const LIST_ID = 2; // Update to your Brevo list ID
```

To find your List ID:
1. Go to [Brevo Contacts](https://app.brevo.com/contact/list)
2. Click on your list
3. The ID is in the URL: `.../list/ID`

### 6. Test the Deployment

From the `workers` directory:

```bash
curl -X POST https://newsletter-subscribe.YOUR-SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Should return:
```json
{
  "success": true,
  "message": "Inscription confirmée..."
}
```

## 🔒 Security Notes

- ✅ API key is stored as encrypted secret
- ✅ Not exposed in frontend code
- ✅ CORS configured (update origin in production)
- ⚠️ Current CORS allows `*` - restrict to your domain in production

## 📊 Monitor

View logs in Cloudflare:
- Workers & Pages → Your Worker → **Logs**

## 💰 Cost

Cloudflare Workers Free Tier:
- 100,000 requests/day
- More than enough for newsletter subscriptions

## 🔄 Updates

To update the worker code:
1. Edit `workers/newsletter-subscribe.js`
2. From the `workers` directory, run:
   ```bash
   npx wrangler deploy --config wrangler.newsletter.toml
   ```
