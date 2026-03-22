# MyTravel — Vercel Deployment Guide

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Ready to Follow
**Purpose**: Step-by-step instructions for deploying the MyTravel demo website to Vercel using the free Hobby plan, connected to the GitHub repository.

---

## Overview

The MyTravel demo is a **static HTML/CSS/JavaScript website** — no build tools, no framework, no compilation step. Vercel hosts static sites like this for free on its **Hobby plan**, serving them from a global CDN with automatic HTTPS and continuous deployment from GitHub.

Once set up, every `git push` to GitHub automatically redeploys the site. No manual uploads, no FTP, no server to manage.

**What you'll have at the end of this guide:**
- A live public URL (e.g., `https://mytravel-xyz.vercel.app`)
- Automatic HTTPS (SSL certificate included, auto-renewed)
- Clean URLs — `/dashboard` instead of `/dashboard.html`
- Auto-redeployment on every GitHub push
- Optional: your own custom domain (e.g., `mytravel.app`) for free

**Estimated time**: 10–15 minutes

---

## Prerequisites

Before starting, make sure you have:

| Requirement | Status |
|---|---|
| GitHub repository created | ✅ `github.com/amitra1976/MyTravel` |
| Code pushed to GitHub | ✅ All files pushed to `master` branch |
| `demo/vercel.json` config file committed | ✅ Already done |
| A GitHub account | ✅ Required to log in to Vercel |

---

## Part 1 — Create a Vercel Account

### 1.1 Go to Vercel's signup page

Open your browser and navigate to:

```
https://vercel.com/signup
```

### 1.2 Sign up with GitHub

Click **"Continue with GitHub"**.

> Using GitHub to sign up is strongly recommended — it automatically links your GitHub repositories to Vercel and enables continuous deployment without any extra configuration.

You'll be redirected to GitHub to authorise Vercel. Click **"Authorize Vercel"**.

### 1.3 Choose the Hobby plan

When prompted to select a plan, choose **Hobby — Free**. No credit card is required.

You'll land on your Vercel dashboard.

---

## Part 2 — Import the MyTravel Repository

### 2.1 Start a new project

On your Vercel dashboard, click the **"Add New"** button (top right) and select **"Project"**.

### 2.2 Connect to GitHub

Vercel will show a list of your GitHub repositories. If this is your first time, click **"Add GitHub Account"** and authorise Vercel to access your repositories.

### 2.3 Find and import MyTravel

In the repository list, find **`amitra1976/MyTravel`** and click **"Import"** next to it.

> If you don't see the repository, click "Adjust GitHub App Permissions" and make sure Vercel has access to the MyTravel repo.

---

## Part 3 — Configure the Project

This is the most important step. Vercel needs to know where your HTML files live inside the repository.

### 3.1 Set the Root Directory

On the configuration screen, find the **"Root Directory"** field. By default it shows `./` (the repository root). You need to change this to `demo`.

1. Click **"Edit"** next to the Root Directory field
2. Type `demo`
3. Click the checkmark to confirm

> **Why this matters**: Your HTML files (`index.html`, `dashboard.html`, etc.) are inside the `demo/` folder, not the repository root. If you skip this step, Vercel will look for `index.html` at the root level, find nothing, and the deployment will fail or show a blank page.

### 3.2 Leave everything else as defaults

The remaining settings should be left as-is:

| Setting | Value | Why |
|---|---|---|
| **Framework Preset** | Other | Not a framework — plain HTML |
| **Build Command** | *(blank)* | No build step needed |
| **Output Directory** | *(blank)* | Files are served directly from Root Directory |
| **Install Command** | *(blank)* | No package manager needed |

### 3.3 Deploy

Click the **"Deploy"** button.

Vercel will:
1. Pull your code from GitHub
2. Detect that it's a static site (no build required)
3. Deploy all files from `demo/` to its global CDN
4. Generate a live URL

This takes approximately **20–40 seconds**.

---

## Part 4 — View Your Live Site

### 4.1 Deployment complete

Once the deployment finishes, you'll see a success screen with a preview of your site and a live URL in the format:

```
https://my-travel-[random].vercel.app
```

Click **"Visit"** to open your live site in a new tab.

### 4.2 What the vercel.json config does for you

The `demo/vercel.json` file already committed to the repository contains:

```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

This means:
- **Clean URLs**: Pages are accessible without the `.html` extension. For example:
  - `/dashboard` instead of `/dashboard.html`
  - `/cottages` instead of `/cottages.html`
  - `/itinerary` instead of `/itinerary.html`
- **No trailing slashes**: URLs end cleanly (e.g., `/dashboard` not `/dashboard/`)
- Visiting an old `.html` URL automatically **redirects** to the clean version

---

## Part 5 — What's Included on the Free Hobby Plan

| Feature | Hobby (Free) | Notes |
|---|---|---|
| **Cost** | $0/month | No credit card required |
| **HTTPS / SSL** | ✅ Automatic | Auto-provisioned and auto-renewed |
| **Custom domain** | ✅ Free | Add your own domain (e.g., mytravel.app) |
| **Auto-redeploy on push** | ✅ Yes | Every `git push` to master triggers a new deployment |
| **Preview deployments** | ✅ Yes | Every branch/PR gets its own preview URL |
| **Global CDN** | ✅ Yes | Files served from edge locations worldwide |
| **Deployments per day** | 100 | More than enough |
| **Projects** | Up to 200 | |
| **Bandwidth** | 100 GB/month | Sufficient for a demo or early-stage product |
| **Serverless Functions** | 12 included | For future backend needs |

---

## Part 6 — Continuous Deployment (How Updates Work)

Once connected, you never need to touch Vercel again for routine updates. The workflow is:

```
Edit files locally
      │
      ▼
git add + git commit
      │
      ▼
git push → GitHub
      │
      ▼
Vercel detects the push automatically
      │
      ▼
New deployment starts (~30 seconds)
      │
      ▼
Live site updated at the same URL
```

### Example — pushing a change

```bash
git add demo/dashboard.html
git commit -m "Update dashboard welcome message"
git push
```

That's it. The live site updates within about 30 seconds.

### Deployment history

Vercel keeps a history of every deployment. If a new push introduces a bug, you can **instantly roll back** to any previous deployment from the Vercel dashboard with one click — no re-deployment needed.

---

## Part 7 — Adding a Custom Domain (Optional)

You can connect your own domain (e.g., `mytravel.app` or `mytravel.io`) for free on the Hobby plan.

### 7.1 Go to your project settings

In the Vercel dashboard, open your MyTravel project and click **"Settings" → "Domains"**.

### 7.2 Add your domain

Type your domain name (e.g., `mytravel.app`) and click **"Add"**.

### 7.3 Update your DNS

Vercel will show you DNS records to add at your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare). You'll need to add either:

- An **A record** pointing to Vercel's IP address, or
- A **CNAME record** pointing to `cname.vercel-dns.com`

Vercel provides the exact values — just copy and paste them into your registrar's DNS settings.

### 7.4 Wait for DNS propagation

DNS changes typically take **5–30 minutes** (sometimes up to 48 hours in rare cases). Once propagated, your site will be live at your custom domain with HTTPS automatically configured.

---

## Part 8 — Troubleshooting Common Issues

### Site shows a 404 or blank page after deployment

**Cause**: Root Directory was not set to `demo/`.

**Fix**:
1. Go to your project in Vercel dashboard
2. Click **"Settings" → "General"**
3. Find **"Root Directory"** and set it to `demo`
4. Scroll down and click **"Save"**
5. Go to **"Deployments"** and click **"Redeploy"** on the latest deployment

---

### Pages link to `.html` files and Vercel shows the extension in the URL

**Cause**: `vercel.json` is missing or not in the `demo/` folder.

**Fix**: Confirm `demo/vercel.json` exists in the repository and contains:
```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```
Then push a new commit to trigger a redeploy.

---

### CSS or images not loading on the live site

**Cause**: File paths in HTML use absolute paths that break outside the local environment.

**Fix**: Make sure asset references in HTML use relative paths:
```html
<!-- Correct -->
<link rel="stylesheet" href="css/shared.css">

<!-- Will break -->
<link rel="stylesheet" href="/css/shared.css">
```

---

### Deployment fails immediately

**Cause**: Usually a misconfigured Root Directory or an unexpected file in the repo root.

**Fix**: Check the deployment log in Vercel (click the failed deployment to see the full log). The error message will point to the exact issue.

---

## Part 9 — Important Note on Plan Limits

The **Hobby plan is for personal, non-commercial use**. This is important for MyTravel's roadmap:

| Stage | Recommended Plan |
|---|---|
| Demo / review build (current) | **Hobby — Free** ✅ |
| MVP with real users, no revenue | **Hobby — Free** ✅ |
| MVP generating affiliate revenue or Premium subscriptions | **Pro — $20/month** |
| Team of 2+ developers | **Pro — $20/month** |

When MyTravel begins earning revenue (affiliate commissions from cottage bookings, Premium subscriptions), upgrade to Vercel Pro. This aligns with the Phase 2 cost model already documented in `MyTravel-Integrations-and-Hosting-Costs.md`.

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────────────┐
│              VERCEL DEPLOYMENT — QUICK STEPS             │
│                                                          │
│  1. Go to vercel.com/signup                             │
│     → Sign up with GitHub                               │
│     → Choose Hobby (Free)                               │
│                                                          │
│  2. Dashboard → Add New → Project                        │
│     → Import amitra1976/MyTravel                        │
│                                                          │
│  3. Configuration (IMPORTANT):                           │
│     → Root Directory: demo                              │
│     → Build Command: (blank)                            │
│     → Output Directory: (blank)                         │
│                                                          │
│  4. Click Deploy                                         │
│     → Done in ~30 seconds                               │
│                                                          │
│  5. Live at: https://mytravel-xyz.vercel.app            │
│                                                          │
│  UPDATES: git push → auto-redeploys in ~30s             │
│  ROLLBACK: Vercel dashboard → one click                  │
│  DOMAIN: Settings → Domains → add your own (free)       │
└──────────────────────────────────────────────────────────┘
```

---

## Related Documents

| Document | Purpose |
|---|---|
| `MyTravel-PRD.md` | Full product requirements including hosting decisions |
| `MyTravel-Integrations-and-Hosting-Costs.md` | Full cost breakdown — Vercel Hobby vs Pro, when to upgrade |
| `MyTravel-Implementation-Plan.md` | Full-stack architecture — Vercel hosts the Next.js web app in production |

---

*Document version: 1.0 | Last updated: 2026-03-22*
