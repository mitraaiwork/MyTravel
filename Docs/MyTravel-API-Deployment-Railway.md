# MyTravel API Deployment Guide — Railway

## Overview

The FastAPI backend is deployed on Railway using the existing Dockerfile.
Railway handles Docker builds, PostgreSQL, and WebSockets out of the box.

---

## Step 1 — Create Accounts

- Sign up at **railway.app** using your GitHub account

---

## Step 2 — Create a PostgreSQL Database

1. New Project → **Add a service** → **Database** → **PostgreSQL**
2. Once created, click the PostgreSQL service → **Variables** tab
3. Copy the `DATABASE_URL` value — you'll need it in Step 4

---

## Step 3 — Deploy the API

1. In the same Railway project → **Add a service** → **GitHub Repo**
2. Select the `MyTravel` repository
3. Set root directory to `app/api`
4. Railway detects the Dockerfile automatically and starts building

---

## Step 4 — Set Environment Variables

In the API service → **Variables** tab, add the following:

| Variable | Value |
|---|---|
| `DATABASE_URL` | PostgreSQL URL from Step 2 |
| `SECRET_KEY` | Run `python3 -c "import secrets; print(secrets.token_hex(32))"` to generate |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `MAPBOX_TOKEN` | From account.mapbox.com |
| `RESEND_API_KEY` | From resend.com |
| `FRONTEND_URL` | Your Vercel URL e.g. `https://mytravel.vercel.app` |
| `CORS_ORIGINS` | `["https://mytravel.vercel.app"]` |
| `DEBUG` | `false` |
| `GOOGLE_CLIENT_ID` | From console.cloud.google.com (if using Google OAuth) |
| `GOOGLE_CLIENT_SECRET` | From console.cloud.google.com (if using Google OAuth) |

---

## Step 5 — Get the API URL

Once deployed, Railway provides a public URL such as:
```
https://mytravel-api.up.railway.app
```

You can find this under the service → **Settings** → **Networking** → **Public URL**.

---

## Step 6 — Update Vercel Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables** and update:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://mytravel-api.up.railway.app` |
| `NEXT_PUBLIC_WS_URL` | `wss://mytravel-api.up.railway.app` |

Then redeploy Vercel for the changes to take effect (push a commit or click Redeploy in the Vercel dashboard).

---

## Notes

- **Migrations run automatically** — the Dockerfile runs `alembic upgrade head` on every startup, so database schema changes deploy without any manual steps.
- **WebSockets** — Railway supports WebSocket connections natively. No extra configuration needed.
- **FREE_TIER_GEN_LIMIT** — optionally add this variable to control how many free generations users get (default is 5 if not set).
- **Logs** — Railway shows real-time logs under the service → **Logs** tab, useful for debugging startup issues.
