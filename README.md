# Food Dashboard — GitHub Pages + Cloudflare Worker

This repo hosts the dashboard UI on GitHub Pages and keeps the Spoonacular API key server-side in a Cloudflare Worker.

## Files

- `index.html` — static frontend for GitHub Pages
- `worker.js` — Cloudflare Worker API proxy for Spoonacular
- `wrangler.jsonc` — Worker config
- `.gitignore` — ignores local secret files and build artifacts

## 1) Create the GitHub repo

Create a new repo and upload these files.

## 2) Deploy the Cloudflare Worker

Install dependencies:

```bash
npm install
```

Log in to Cloudflare:

```bash
npx wrangler login
```

Set the Spoonacular secret:

```bash
npx wrangler secret put SPOONACULAR_API_KEY
```

Deploy:

```bash
npx wrangler deploy
```

Cloudflare will return a URL like:

```text
https://food-dashboard-proxy.YOUR-SUBDOMAIN.workers.dev
```

## 3) Update the frontend URL

In `index.html`, the Meals config should point to your Worker URL:

```js
const CONFIG = {
  spoonacularApiBase: 'https://food-dashboard-proxy.YOUR-SUBDOMAIN.workers.dev/api/spoonacular',
  spoonacularKey: '',
};
```

Replace `YOUR-SUBDOMAIN` with your real Worker subdomain after deployment.

## 4) Publish with GitHub Pages

Rename your main frontend file to `index.html` if needed. In GitHub:

- Open **Settings**
- Open **Pages**
- Set **Build and deployment** to deploy from your branch
- Choose your branch and root folder

Then GitHub Pages will serve the frontend.

## 5) Local testing

For local Worker testing, create `.dev.vars`:

```bash
SPOONACULAR_API_KEY=your_real_key_here
```

Then run:

```bash
npm run dev
```

## Notes

- Do not commit `.dev.vars`
- GitHub Pages is public, so never put the Spoonacular key in `index.html`
- Meals uses the Worker proxy; Cocktails and Food Facts still call their public APIs directly
