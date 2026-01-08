# Newsletter Worker - Deployment Guide

## 🎯 Purpose
Secure Cloudflare Worker to handle newsletter subscriptions via Brevo API.
This protects your Brevo API key from being exposed in the frontend.

## 📂 File
`workers/newsletter-subscribe.js`

## 🚀 Deployment Steps

### 1. Create Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** in sidebar
3. Click **Create application** → **Create Worker**
4. Name it: `newsletter-subscribe`
5. Click **Deploy**

### 2. Upload Code

1. Click **Quick edit** button
2. Delete default code
3. Copy/paste content from `workers/newsletter-subscribe.js`
4. Click **Save and deploy**

### 3. Configure Environment Variables

**CRITICAL:** Set the Brevo API key as an environment variable

1. Go to Worker → **Settings** → **Variables**
2. Click **Add variable**
3. Name: `BREVO_API_KEY`
4. Value: `YOUR_BREVO_API_KEY_HERE` (from Brevo dashboard)
5. Type: **Secret** (encrypted)
6. Click **Save**

### 4. Get Worker URL

After deployment, you'll get a URL like:
```
https://newsletter-subscribe.YOUR-SUBDOMAIN.workers.dev
```

Copy this URL for the next step.

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

### 7. Test

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

To update the worker:
1. Edit `workers/newsletter-subscribe.js`
2. Go to Cloudflare Worker → **Quick edit**
3. Paste new code
4. Click **Save and deploy**
