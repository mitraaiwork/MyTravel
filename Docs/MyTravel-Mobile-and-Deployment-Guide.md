# MyTravel — Mobile Access & Deployment Guide

**Purpose**: Deploy the app so you and friends can use it from any phone or browser.  
**Time to complete**: ~30 minutes (once you have all API keys ready)

---

## Overview

Currently the app runs only on `localhost`. After following this guide:

- The app is live at a public HTTPS URL
- You and friends open it in any mobile browser and register their own accounts
- The app is installable on the phone home screen (no app store needed)

**Architecture after deployment:**

```
Friends' phones / your phone
        │
        ▼
Vercel (Next.js frontend)   ←→   Railway (FastAPI backend)
                                         │
                                 Railway PostgreSQL
```

---

## Part 1 — Deploy Backend to Railway

The `app/api/Dockerfile` is production-ready: it installs dependencies, runs database migrations automatically, then starts the server.

### 1.1 Create a Railway account

Go to **railway.app** → Sign up with GitHub.

### 1.2 Create a new project

Dashboard → **New Project** → **Deploy from GitHub repo** → select `amitra1976/MyTravel`.

### 1.3 Set the root directory

In the service settings, set **Root Directory** to `app/api`. Railway will use the `Dockerfile` in that folder.

### 1.4 Add a PostgreSQL database

In your Railway project: **+ New** → **Database** → **PostgreSQL**.  
Railway automatically injects `DATABASE_URL` into your service — you don't need to set it manually.

### 1.5 Set environment variables

In the service → **Variables** tab, add:

| Variable | Value | How to get it |
|---|---|---|
| `SECRET_KEY` | Random hex string | Run: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `GOOGLE_API_KEY` | Your Gemini key | aistudio.google.com → API Keys (free) |
| `MAPBOX_TOKEN` | Your token | account.mapbox.com → Tokens |
| `GOOGLE_PLACES_API_KEY` | Your key | console.cloud.google.com → Credentials |
| `RESEND_API_KEY` | Your key | resend.com → API Keys (for welcome emails) |
| `FRONTEND_URL` | Vercel URL | Fill in after Part 2 (e.g. `https://mytravel-xyz.vercel.app`) |
| `CORS_ORIGINS` | Vercel URL in array | e.g. `["https://mytravel-xyz.vercel.app"]` |
| `MOCK_AI` | `false` | — |

### 1.6 Deploy

Railway detects the Dockerfile and deploys automatically. The first deploy takes 2–3 minutes.

On success, Railway shows a URL like `https://mytravel-api-production.up.railway.app`. **Save this URL** — you need it in Part 2.

### 1.7 Verify

Open `https://<your-railway-url>/docs` in a browser. You should see the Swagger UI. If it loads, the backend is running and migrations ran successfully.

---

## Part 2 — Deploy Frontend to Vercel

`app/web/vercel.json` already contains the correct install command for pnpm. Every `git push` to master will auto-redeploy.

### 2.1 Create a Vercel account

Go to **vercel.com** → Sign up with GitHub.

### 2.2 Import the repository

Dashboard → **Add New** → **Project** → Import `amitra1976/MyTravel`.

### 2.3 Set the root directory

Click **Edit** next to Root Directory → type `app/web` → confirm.  
This is critical — without it Vercel looks in the wrong folder.

### 2.4 Framework preset

Vercel auto-detects **Next.js**. Leave it as-is.

### 2.5 Set environment variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Railway HTTPS URL from Part 1 (e.g. `https://mytravel-api-production.up.railway.app`) |
| `NEXT_PUBLIC_WS_URL` | Same URL with `wss://` prefix (e.g. `wss://mytravel-api-production.up.railway.app`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox public token |

### 2.6 Deploy

Click **Deploy**. Takes ~60 seconds. Vercel gives you a URL like `https://mytravel-xyz.vercel.app`.

### 2.7 Update Railway with the Vercel URL

Go back to Railway → service Variables → update:
- `FRONTEND_URL` → `https://mytravel-xyz.vercel.app`
- `CORS_ORIGINS` → `["https://mytravel-xyz.vercel.app"]`

Railway redeploys automatically.

### 2.8 Verify

Open `https://mytravel-xyz.vercel.app` in your phone browser. You should see the landing page. Register a new account and create a trip.

---

## Part 3 — Make the App Installable on Mobile (PWA)

This is optional but gives a native-app feel: users tap "Add to Home Screen" and the app opens fullscreen without browser controls.

Three changes are needed:

### 3.1 Create `app/web/public/manifest.json`

```json
{
  "name": "MyTravel AI",
  "short_name": "MyTravel",
  "description": "AI-powered travel planning",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f5f2eb",
  "theme_color": "#2d6a4f",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 3.2 Create app icons

You need two PNG files: `app/web/public/icon-192.png` (192×192 px) and `app/web/public/icon-512.png` (512×512 px).

Easiest way — use **favicon.io**:
1. Go to favicon.io/favicon-generator
2. Choose "Text" → type `MT` → Background: `#2d6a4f`, Text: white, Font: any
3. Download → extract → find `android-chrome-192x192.png` and `android-chrome-512x512.png`
4. Rename them to `icon-192.png` and `icon-512.png` and place in `app/web/public/`

### 3.3 Update `app/web/src/app/layout.tsx`

Add to the existing `metadata` export:

```tsx
export const metadata: Metadata = {
  title: "MyTravel — AI-Powered Travel Planning",
  // ... existing fields ...
  manifest: "/manifest.json",
  themeColor: "#2d6a4f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyTravel",
  },
  icons: {
    apple: "/icon-192.png",
  },
};
```

### 3.4 Commit and push

```bash
git add app/web/public/manifest.json app/web/public/icon-192.png app/web/public/icon-512.png app/web/src/app/layout.tsx
git commit -m "Add PWA manifest for mobile install"
git push
```

Vercel redeploys automatically (~60 seconds).

### 3.5 Install on phone

**Android (Chrome):**  
Open the Vercel URL → three-dot menu → "Add to Home Screen" → Install

**iOS (Safari):**  
Open the Vercel URL → tap the Share button → "Add to Home Screen" → Add

---

## Part 4 — Share With Friends

1. **Send them the Vercel URL** (e.g. `https://mytravel-xyz.vercel.app`)
2. They open it in their phone browser → tap **Register** → create an account
3. They plan and generate their own trips independently
4. Each user has their own account, their own trips, their own generation quota

Registration is open — no invite code needed.

---

## Verification Checklist

- [ ] `https://<railway-url>/docs` shows Swagger UI
- [ ] `https://<vercel-url>` loads the landing page
- [ ] Can register a new account and log in
- [ ] Can create a trip and generate an itinerary (tests Anthropic API key)
- [ ] Map renders on the trip page (tests Mapbox token)
- [ ] App loads correctly on phone browser (responsive layout, no horizontal scroll)
- [ ] "Add to Home Screen" works on Android Chrome and/or iOS Safari (after Part 3)

---

## Updating the App Later

Once deployed, every `git push` to `master`:
- Vercel auto-redeploys the frontend in ~60 seconds
- Railway auto-redeploys the backend in ~2 minutes (including running any new migrations)

No manual steps needed for updates.

---

## Cost Reference (Free Tier)

| Service | Free Tier | Paid |
|---|---|---|
| Vercel | Free (Hobby) | $20/month (Pro) |
| Railway | $5 credit/month trial, then ~$20–$40/month | Usage-based |
| Railway PostgreSQL | Included in Railway | — |

For personal use with a few friends, Railway's trial credit may be sufficient initially. See `Docs/MyTravel-Integrations-and-Hosting-Costs.md` for full cost breakdown.
