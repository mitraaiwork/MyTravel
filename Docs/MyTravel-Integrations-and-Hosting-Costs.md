# MyTravel — Third-Party Integrations & Hosting Cost Guide

**Version**: 1.1
**Date**: 2026-03-22
**Status**: For Review

> All costs are in USD. Prices are based on published pricing as of early 2026 and should be verified before committing. Estimates assume a real but early-stage production app — not enterprise scale.

---

## Table of Contents

1. [Cost Summary by Phase](#1-cost-summary-by-phase)
2. [Third-Party Integrations](#2-third-party-integrations)
3. [Hosting Strategy](#3-hosting-strategy)
4. [Free Alternatives Reference](#4-free-alternatives-reference)
5. [Cost Optimisation Tips](#5-cost-optimisation-tips)

---

## 1. Cost Summary by Phase

### MVP (Weeks 1–10) — Estimated Monthly Spend

| Category | Service | Monthly Cost |
|---|---|---|
| AI | Anthropic API | $50–$200 |
| Database | Supabase Pro | $25 |
| Cache / Queue | Upstash Redis | $10 |
| Maps | Mapbox | Free tier |
| Weather | OpenWeatherMap | Free tier |
| Email | Resend | Free tier |
| Error Monitoring | Sentry | Free tier |
| Backend Hosting | Railway | $20–$50 |
| Web Hosting | Vercel | $20 |
| **MVP Total** | | **~$125–$305/mo** |

### Growth Features (Weeks 11–20) — Additional Monthly Spend

| Category | Service | Monthly Cost |
|---|---|---|
| Payments | Stripe | 2.9% + $0.30 / transaction |
| Mobile IAP | RevenueCat | Free (up to $2.5K MTR) |
| POI Enrichment | Google Places API | ~$0–$30 (against $200 free credit) |
| Search | Typesense Cloud | $24 |
| File Storage | Cloudflare R2 | Free tier |
| Currency Rates | Open Exchange Rates | $12 |
| Analytics | PostHog | Free tier |
| **Cottage Affiliates** | Vrbo / Airbnb / Booking.com | $0 (commission-based, revenue-generating) |
| **Growth Addition** | | **~$36–$70/mo** |

### Scale & Intelligence (Weeks 21–30) — Additional Monthly Spend

| Category | Service | Monthly Cost |
|---|---|---|
| Flights | Amadeus API | $50–$200 (usage-based) |
| Push Notifications | Firebase FCM | Free |
| Hotel / Activity Affiliates | Booking.com / GetYourGuide | Free (commission-based) |
| **Scale Addition** | | **~$50–$200/mo** |

### Realistic Total at Each Stage

| Stage | Estimated Monthly Cost |
|---|---|
| MVP (soft launch, low users) | $125 – $305 |
| Growth (100–500 active users) | $160 – $375 |
| Scale (1,000+ active users) | $210 – $575 |
| Scale + premium subscriber revenue | Self-funding at ~50 Premium subscribers |

> At $9.99/month per Premium subscriber, **~32 subscribers covers the minimum monthly infrastructure cost**.

---

## 2. Third-Party Integrations

---

### 🤖 AI & Machine Learning

#### Anthropic API *(MVP · Core product)*
| | |
|---|---|
| **Purpose** | Powers all AI features: itinerary generation, day regeneration, concierge chat, packing lists, destination comparison, cottage & cabin property match scoring |
| **Models used** | `claude-sonnet-4-6` (itinerary gen) · `claude-haiku-4-5` (chat, packing, suggestions, destination comparison) |
| **Free tier** | $5 API credit on new accounts (trial only, not production-viable) |
| **Pricing** | Approx. $3.00 / 1M input tokens · $15.00 / 1M output tokens (Sonnet) |
| | Approx. $0.80 / 1M input tokens · $4.00 / 1M output tokens (Haiku) |
| **Cost estimate** | A 5-day itinerary ≈ 3,000–5,000 output tokens ≈ **$0.05–$0.08 per generation** |
| | 100 generations/month ≈ **$5–$8** · 1,000 ≈ **$50–$80** |
| | A destination comparison (3 destinations) ≈ 800–1,200 output tokens ≈ **$0.001–$0.002 per comparison** |
| | 1,000 comparisons/month ≈ **$1–$2** — negligible cost, especially with Redis caching on popular pairs |
| **Monthly range** | $50–$200 at early scale (comparisons add less than $5/month at typical usage) |
| **Free alternative** | No direct equivalent. Groq (free tier for Llama 3.x) could reduce cost but output quality drops significantly for structured itinerary JSON |
| **Sign-up** | console.anthropic.com |

> **Cost controls built in**: Redis caching skips the API for identical requests (24h TTL for itinerary generation; 6h TTL for comparison results — popular destination pairs like Tokyo vs Bali vs Paris served from cache). Free tier itinerary generation capped at 3/month per user. Destination comparisons are uncapped but cost is negligible (~$0.001–$0.002 each using Haiku).

---

### 🗺️ Maps & Location

#### Mapbox GL *(MVP · Core product)*
| | |
|---|---|
| **Purpose** | Interactive trip maps, geocoding destinations, directions/routing, scenic route visualiser |
| **Free tier** | 50,000 map loads/month · 100,000 geocoding calls/month · 100,000 directions calls/month |
| **Pricing** | Map loads: $5.00 / 1,000 beyond free · Geocoding: $0.50 / 1,000 · Directions: $1.00 / 1,000 |
| **Monthly range** | Free at MVP · $10–$30 at growth scale |
| **Free alternative** | **OpenStreetMap + Leaflet.js** — fully free and open-source, but requires more custom work and lacks Mapbox's visual polish and offline tiles |
| **Sign-up** | mapbox.com |

#### Google Places API *(Phase 2 · POI fallback)*
| | |
|---|---|
| **Purpose** | POI enrichment, photos, ratings, opening hours as a fallback to Mapbox Places |
| **Free tier** | $200 monthly credit (resets each month) — covers ~11,000 Place Details requests |
| **Pricing** | Place Details: $17.00 / 1,000 · Nearby Search: $32.00 / 1,000 · Text Search: $32.00 / 1,000 |
| **Monthly range** | $0–$30 (within free credit at early scale) |
| **Free alternative** | **OpenStreetMap Nominatim** (free, self-hosted option) · **Foursquare Places API** (free tier: 1,000 calls/day) |
| **Sign-up** | console.cloud.google.com |

---

### ☁️ Database & Backend Infrastructure

#### Supabase *(MVP · Core)*
| | |
|---|---|
| **Purpose** | Primary PostgreSQL database, Row Level Security, Auth, Realtime subscriptions, pgvector for AI similarity |
| **Free tier** | 2 projects · 500MB database · 50MB file storage · 5GB bandwidth · pauses after 1 week inactive |
| **Pricing** | Pro: **$25/month per project** — 8GB DB, 250GB bandwidth, 100GB storage, no pausing |
| **Monthly range** | $25 (production) |
| **Free alternative** | **Neon** (serverless Postgres, generous free tier: 0.5 CPU, 1GB storage) · **PlanetScale** (MySQL, 5GB free) · **Self-hosted PostgreSQL on Railway** (just compute cost, ~$5–$10/month) |
| **Sign-up** | supabase.com |

#### Upstash Redis *(MVP · Core)*
| | |
|---|---|
| **Purpose** | Generation caching (skip API for identical requests), rate limiting, ARQ async job queue |
| **Free tier** | 10,000 commands/day · 256MB max data · 1 database |
| **Pricing** | Pay-as-you-go: $0.20 / 100K commands · Fixed plans from $10/month |
| **Monthly range** | $10–$20 |
| **Free alternative** | **Redis Cloud** (30MB free tier) · **Self-hosted Redis on Railway** (~$5/month compute) |
| **Sign-up** | upstash.com |

---

### 📧 Email

#### Resend *(MVP)*
| | |
|---|---|
| **Purpose** | Transactional emails — welcome, trip invite, flight alerts, subscription receipts |
| **Free tier** | 3,000 emails/month · 100/day · 1 domain |
| **Pricing** | Pro: $20/month — 50,000 emails · Business: $90/month — 100,000 emails |
| **Monthly range** | Free at MVP · $20 at growth |
| **Free alternative** | **Brevo (SendinBlue)** — 300 emails/day free · **SendGrid** — 100 emails/day free indefinitely · **Mailgun** — 5,000/month for first 3 months |
| **Sign-up** | resend.com |

---

### 🔍 Search

#### Typesense Cloud *(Phase 2)*
| | |
|---|---|
| **Purpose** | Full-text destination and POI search with typo tolerance |
| **Free tier** | None on cloud (open-source can be self-hosted free) |
| **Pricing** | Starter: **$24/month** (3 nodes, 512MB RAM, 0.5 vCPU) |
| **Monthly range** | $24 |
| **Free alternative** | **Self-hosted Typesense on Railway** (~$5–$10/month compute, same features) · **MeiliSearch** (open-source, self-hosted free) · **Algolia** (free tier: 10,000 records, 10,000 searches/month) |
| **Sign-up** | cloud.typesense.org |

---

### 📦 File Storage

#### Cloudflare R2 *(Phase 2)*
| | |
|---|---|
| **Purpose** | Trip photo uploads, generated PDF exports, map tile caching |
| **Free tier** | 10GB storage/month · 1M Class A operations (write/list) · 10M Class B operations (read) · **Zero egress fees** |
| **Pricing** | Storage: $0.015/GB · Class A ops: $4.50/M · Class B ops: $0.36/M |
| **Monthly range** | Free at MVP and early growth |
| **Free alternative** | **AWS S3** (12-month free tier: 5GB, 20K GET, 2K PUT) · **Backblaze B2** (10GB free, $0.006/GB after) · **MinIO** (self-hosted, free) |
| **Sign-up** | cloudflare.com |

---

### 📊 Monitoring & Analytics

#### Sentry *(MVP)*
| | |
|---|---|
| **Purpose** | Error monitoring and performance tracing — Python API, Next.js web, React Native mobile |
| **Free tier** | 5,000 errors/month · 10,000 performance transactions · 1 user |
| **Pricing** | Team: $26/month — 50,000 errors · $80/month — 100,000 errors |
| **Monthly range** | Free at MVP · $26 at growth |
| **Free alternative** | **GlitchTip** (open-source Sentry clone, self-hosted free) · **Highlight.io** (free tier) |
| **Sign-up** | sentry.io |

#### PostHog *(Phase 2)*
| | |
|---|---|
| **Purpose** | Product analytics, feature flags, A/B testing AI prompts, session replay |
| **Free tier** | 1M events/month · 5,000 session recordings/month · Unlimited users and feature flags |
| **Pricing** | $0.000225 per event beyond 1M · Session recordings $0.005/1,000 beyond free |
| **Monthly range** | Free at most early/mid stages |
| **Free alternative** | **Plausible** ($9/month, no free tier but privacy-focused) · **Umami** (self-hosted, free) · **Matomo** (self-hosted, free) |
| **Sign-up** | posthog.com |

---

### 💳 Payments

#### Stripe *(Phase 2)*
| | |
|---|---|
| **Purpose** | Premium subscription billing (web), curated itinerary one-time purchases (web), Stripe Customer Portal |
| **Free tier** | No monthly fee — transaction-based only |
| **Pricing** | **2.9% + $0.30 per successful card transaction** · Subscriptions: same rate |
| **Cost estimate** | At $9.99 Premium/month: Stripe takes ~$0.59 → you net **~$9.40 per subscriber** |
| **Monthly range** | 0 fixed cost — scales with revenue |
| **Free alternative** | No true free alternative for card processing. **Paddle** and **LemonSqueezy** are merchant-of-record alternatives (handle tax automatically) at 5% + $0.50 |
| **Sign-up** | stripe.com |

#### RevenueCat *(Phase 2 · Mobile IAP)*
| | |
|---|---|
| **Purpose** | Abstracts Apple IAP and Google Play Billing for mobile subscriptions — required by App Store policy |
| **Free tier** | Free up to **$2,500 MTR (monthly tracked revenue)** |
| **Pricing** | 1% of revenue beyond $2,500 MTR |
| **Monthly range** | Free until $2,500/month in mobile subscription revenue |
| **Free alternative** | Implement Apple IAP and Google Play Billing SDKs directly — free but significantly more complex to build and maintain |
| **Sign-up** | revenuecat.com |

---

### 🌦️ Weather

#### OpenWeatherMap *(MVP)*
| | |
|---|---|
| **Purpose** | Live weather forecasts injected into AI prompt for smart activity sequencing |
| **Free tier** | One Call API 3.0: **1,000 calls/day free** (requires credit card on file, but free calls won't be charged) |
| **Pricing** | $0.001 per call beyond free tier · Paid plans from $40/month |
| **Monthly range** | Free at MVP scale (30,000 free calls/month > expected usage) |
| **Free alternative** | **Open-Meteo** — completely free, no API key, no rate limits, open-source. Excellent for basic forecasts. Lacks the brand recognition of OpenWeatherMap but technically solid |
| **Sign-up** | openweathermap.org |

---

### 💱 Currency

#### Open Exchange Rates *(Phase 2)*
| | |
|---|---|
| **Purpose** | Real-time currency conversion for multi-currency budget tracker |
| **Free tier** | 1,000 requests/month · Hourly updates · USD base only |
| **Pricing** | Startup: **$12/month** — unlimited requests, any base currency, hourly updates |
| **Monthly range** | $12 (Startup plan needed for non-USD base currencies) |
| **Free alternative** | **Frankfurter API** — completely free, ECB data, no API key, all major currencies · **ExchangeRate-API** — 1,500 free requests/month · **Fixer.io** — 100 free requests/month |
| **Sign-up** | openexchangerates.org |

---

### ✈️ Flights

#### Amadeus API *(Phase 3)*
| | |
|---|---|
| **Purpose** | Flight search, pricing, live flight status for delay alerts |
| **Free tier** | Full self-service sandbox — free, unlimited, test data only |
| **Pricing** | Production: pay per API call — Flight Offers Search ~$0.007/call · Flight Status ~$0.002/call |
| **Cost estimate** | 10,000 flight searches/month ≈ **$70** |
| **Monthly range** | $50–$200 depending on usage |
| **Free alternative** | **Aviation Stack** — 100 requests/month free, basic flight data · **Sky Scanner Affiliate API** — free via affiliate programme (but limited to affiliate use cases) |
| **Sign-up** | developers.amadeus.com |

---

### 🔔 Push Notifications

#### Firebase Cloud Messaging (FCM) *(Phase 3)*
| | |
|---|---|
| **Purpose** | Push notifications for flight alerts, trip reminders, collaboration updates |
| **Free tier** | **Completely free** — unlimited notifications |
| **Pricing** | Free |
| **Monthly range** | $0 |
| **Free alternative** | **OneSignal** (free for unlimited web push) · **Expo Push Notifications** (free for Expo apps, wraps FCM/APNs) |
| **Sign-up** | firebase.google.com |

---

### 🎯 Affiliate Networks

#### Booking.com Affiliate *(Phase 3)*
| | |
|---|---|
| **Purpose** | Hotel and accommodation search with affiliate commission |
| **Free tier** | Free to join — commission-based only |
| **Pricing** | Commission: ~25% of Booking.com's margin (~4–6% of total booking value) |
| **Monthly range** | $0 fixed — revenue-generating |
| **Sign-up** | developers.booking.com |

#### GetYourGuide / Viator / Klook *(Phase 3)*
| | |
|---|---|
| **Purpose** | Tours and experiences affiliate links embedded in itinerary items |
| **Free tier** | All free to join |
| **Commission rate** | GetYourGuide: ~8% · Viator: ~8% · Klook: ~5–8% |
| **Monthly range** | $0 fixed — revenue-generating |
| **Note** | All affiliate link clicks must open in the **system browser** (not WebView) to comply with App Store policy |

---

### 🏡 Cottage & Cabin Affiliate Platforms

#### Vrbo Partner API *(Phase 2)*
| | |
|---|---|
| **Purpose** | Primary source of cottage, cabin, chalet, and vacation rental property listings with affiliate booking commission |
| **Free tier** | Free to join — commission-based only |
| **Commission rate** | ~3–5% of total booking value |
| **Average booking value** | $1,500–$4,000/week (Ontario cottage country); $2,000–$6,000 for mountain chalets |
| **Monthly range** | $0 fixed — revenue-generating. At 10 bookings/month × $2,500 avg × 4%: ~$1,000/month |
| **Note** | Listings cached in `cottage_properties` table (24h TTL) to minimize live API calls during search |
| **Sign-up** | vrbo.com/p/affiliates |

#### Airbnb Affiliate Programme *(Phase 2)*
| | |
|---|---|
| **Purpose** | Supplementary inventory for unique stays (treehouses, converted farmhouses, glamping) with affiliate commission |
| **Free tier** | Free to join — commission-based only |
| **Commission rate** | ~3–4% of booking value through affiliate programme |
| **Monthly range** | $0 fixed — revenue-generating |
| **Note** | Airbnb affiliate access is more restricted than Vrbo; Booking.com or direct API access may be preferred |
| **Sign-up** | airbnb.com/affiliates |

#### Booking.com Affiliate *(Phase 2 · Updated)*
| | |
|---|---|
| **Purpose** | Hotel and accommodation search — includes cottage, chalet, and cabin categories alongside hotels |
| **Free tier** | Free to join — commission-based only |
| **Commission rate** | ~25% of Booking.com's margin (~4–6% of total booking value) |
| **Monthly range** | $0 fixed — revenue-generating |
| **Note** | Already planned for Phase 3 (hotel context) — bringing forward to Phase 2 for cottage category specifically |
| **Sign-up** | developers.booking.com |

> **Revenue projection**: At early scale with 500 monthly active users, if 5% click through to a cottage booking and 20% of those convert, with an average booking of $2,500 at 4% commission: **500 × 0.05 × 0.20 × $2,500 × 0.04 = ~$500/month**. This grows significantly as the user base scales and the feature gains visibility.

---

## 3. Hosting Strategy

### Overview

| Component | Service | Tier | Monthly Cost |
|---|---|---|---|
| **Backend API** (FastAPI) | Railway | Starter → Pro | $5–$50 |
| **Web Frontend** (Next.js) | Vercel | Hobby → Pro | $0–$20 |
| **iOS App** | Apple App Store | Developer Program | $8.25 (billed $99/yr) |
| **Android App** | Google Play Store | One-time | ~$2 amortised ($25 once) |
| **Database** | Supabase (covered above) | Pro | $25 |
| **Redis / Queue** | Upstash (covered above) | Pay-as-you-go | $10–$20 |
| **File Storage** | Cloudflare R2 (covered above) | Free tier | $0 |

---

### Railway — Backend API Hosting

Railway is used to host the FastAPI Python backend in a Docker container.

| Plan | RAM | CPU | Storage | Cost |
|---|---|---|---|---|
| **Starter** (trial) | 512MB | Shared | 1GB | $5 credit/month |
| **Pro (usage-based)** | Up to 32GB | Scales | 100GB | ~$20–$50/month at MVP |

**What runs on Railway:**
- FastAPI API server (1–2 replicas at MVP)
- ARQ async workers (itinerary generation, PDF export, email jobs)
- Separate service for the ARQ worker process

**Estimated Railway cost breakdown at MVP:**
- API service: ~1GB RAM × 720h × $0.000231/vCPU-hr + $0.000463/GB-hr ≈ **$15–$25/month**
- Worker service: ~512MB RAM, lower CPU ≈ **$8–$15/month**
- **Total Railway: ~$20–$40/month**

**Scaling path:**
- Add more replicas manually or via Railway's auto-scaling
- Separate ARQ workers into their own Railway service for independent scaling
- At high load, migrate to dedicated Railway Pro with reserved resources

**Free alternative:** Fly.io (free tier: 3 shared VMs, 256MB RAM each — enough for a prototype but tight for production FastAPI + workers)

---

### Vercel — Web Frontend Hosting

Vercel is the native deployment target for Next.js 15.

| Plan | Bandwidth | Build Minutes | Cost |
|---|---|---|---|
| **Hobby** | 100GB/month | 6,000 min | **Free** |
| **Pro** | 1TB/month | 24,000 min | **$20/month** |

**What runs on Vercel:**
- Next.js 15 App Router web application
- Edge functions for lightweight API proxying
- Static asset CDN for the landing page

**When to upgrade to Pro:**
- When you need custom domains with no Vercel branding on error pages
- When your team has >1 developer (Hobby is single-user)
- When you exceed 100GB/month bandwidth (unlikely at MVP)

**At launch: start on Hobby (free), upgrade to Pro when you have paying users.**

**Free alternative:** Netlify (100GB bandwidth free, similar feature set) · Cloudflare Pages (unlimited bandwidth free, excellent CDN)

---

### Apple App Store — iOS Distribution

| Fee | Amount |
|---|---|
| Apple Developer Program | **$99/year (~$8.25/month)** |
| Apple IAP / Subscription cut | 30% of revenue (15% after year 1 for subscriptions) |

**Notes:**
- All in-app purchases and subscriptions on iOS **must** use Apple IAP — Stripe cannot be used directly in the mobile app
- RevenueCat abstracts this complexity
- App Store review typically takes 1–3 days for first submission

---

### Google Play Store — Android Distribution

| Fee | Amount |
|---|---|
| Google Play Developer Account | **$25 one-time** |
| Google Play Billing cut | 15% of first $1M revenue/year, 30% after |

**Notes:**
- Google Play Billing required for in-app subscriptions
- RevenueCat handles both Apple and Google in one SDK
- Review times are typically faster than Apple (hours to 1 day)

---

### Architecture Diagram

```
                        USERS
                          │
             ┌────────────┴────────────┐
             │                         │
      ┌──────▼──────┐         ┌────────▼────────┐
      │  Vercel CDN  │         │  App Store /    │
      │  Next.js 15  │         │  Google Play    │
      │  (Web App)   │         │  (Mobile App)   │
      └──────┬──────┘         └────────┬────────┘
             │                         │
             └────────────┬────────────┘
                          │ HTTPS / WSS
                          ▼
               ┌──────────────────────┐
               │   Railway            │
               │   FastAPI (Python)   │
               │   + ARQ Workers      │
               └────┬──────────┬──────┘
                    │          │
          ┌─────────▼─┐  ┌─────▼──────┐
          │  Supabase  │  │  Upstash   │
          │ PostgreSQL │  │   Redis    │
          │ + pgvector │  │ + Job Queue│
          └────────────┘  └────────────┘
```

---

## 4. Free Alternatives Reference

Quick lookup for budget-conscious phases or replacing expensive services:

| Service in Plan | Free Alternative | Trade-off |
|---|---|---|
| Anthropic API | Groq (Llama 3.x, free tier) | Lower structured JSON quality; no streaming parity |
| Mapbox | OpenStreetMap + Leaflet.js | Less polished UI, no offline tiles |
| OpenWeatherMap | **Open-Meteo** | No API key needed; slightly less detailed; perfect for MVP |
| Supabase Pro | Neon (Postgres, generous free tier) | Less built-in tooling; no Realtime subscriptions |
| Upstash | Self-hosted Redis on Railway | Slightly more ops overhead |
| Resend | Brevo (300/day free) | Slightly less developer-friendly dashboard |
| Sentry | GlitchTip (self-hosted) | Requires running your own instance |
| Typesense Cloud | Self-hosted Typesense or MeiliSearch | Requires managing your own server |
| Google Places | OSM Nominatim + Foursquare free tier | Less photo data and reviews |
| Open Exchange Rates | Frankfurter API | ECB rates only; 24h delay; fine for display |
| PostHog | Umami (self-hosted) | No session replay or feature flags |
| Railway | Fly.io free tier | 256MB RAM limit tight for Python + workers |
| Vercel Pro | Netlify / Cloudflare Pages | Minor feature differences |
| Amadeus production | Aviation Stack free tier | 100 requests/month (very limited) |
| Firebase FCM | Expo Push (free) | Wraps FCM/APNs anyway, good for Expo apps |
| Vrbo Partner API | Booking.com Affiliate or direct scraping (not recommended) | Booking.com has broader inventory; avoid scraping (ToS violation) |

---

## 5. Cost Optimisation Tips

These strategies are already baked into the architecture or should be from day one:

### AI Cost Controls (Most Important)
- **Cache identical requests in Redis** — a user generating "Tokyo, 5 days, culture, ¥200k" twice costs you once. 24h TTL.
- **Use Haiku for everything except itinerary gen** — concierge chat and packing lists use `claude-haiku-4-5`, which is ~4× cheaper than Sonnet.
- **Enforce the free tier cap** — 3 generations/month per free user via a Redis counter. Without this, a single active free user can run up significant API bills.
- **Set `max_tokens` on every API call** — prevents runaway costs if a prompt unexpectedly generates a very long response.
- **Watch the Anthropic usage dashboard daily in early stages** — set spend alerts at $50 and $100/day thresholds.

### Infrastructure Cost Controls
- **Start on Vercel Hobby (free)** — only upgrade to Pro when you have actual users who justify it.
- **Use Supabase Free for development**, only go Pro when you deploy to production.
- **Upstash pay-as-you-go beats fixed plans early** — at low traffic, you'll pay cents per day.
- **Cloudflare R2 is almost always free** at early scale — zero egress fees make it a no-brainer over S3.
- **Railway usage-based pricing can spike during load testing** — pause services or set spend caps during development.

### Cottage Affiliate Cost Controls
- **Cache property listings** — `cottage_properties` table with 24h TTL avoids repeated calls to Vrbo/Airbnb APIs for the same search area. Property data rarely changes hour-to-hour.
- **Batch AI property scoring** — Score all 20 search results in a single Haiku call rather than one call per property. Keeps latency under 2s and cost at ~$0.003–$0.005 per scored page.
- **Track all affiliate clicks** — Every click to an affiliate platform goes through `GET /cottages/:id/book`, which logs the click to `affiliate_clicks` before the 302 redirect. This is the only way to attribute commissions and calculate actual ROI from the feature.
- **Revenue is additive** — Cottage affiliate commissions have zero fixed cost; every booking clicked through earns commission. Even 5–10 bookings/month at $2,500 average generates meaningful supplemental revenue at no infrastructure cost.

### When You're Revenue Positive
- **Anthropic API costs scale with usage, but so does revenue** — at $9.99/month and ~$0.07/generation, you need roughly 1 Premium user per 140 free-tier generations to break even on AI alone.
- **Affiliate commissions (Booking.com, GetYourGuide) are passive revenue** that partially offset infrastructure costs. Prioritise adding affiliate links early.
- **RevenueCat stays free until $2,500 MRR** — you'll be well-funded by then to absorb the 1% fee.

---

*Document version: 1.1 | Last updated: 2026-03-22*
