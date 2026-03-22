# MyTravel — Full-Stack Travel Platform: Implementation Plan

> **Product vision**: A travel platform that generates personalized AI-powered day-by-day itineraries with smart local recommendations — travel planning meets intelligent concierge.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [System Architecture](#2-system-architecture)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Implementation Phases](#6-implementation-phases)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Monetization Strategy](#8-monetization-strategy)
9. [AI Cost Controls](#9-ai-cost-controls)
10. [Testing Strategy](#10-testing-strategy)
11. [App Store Compliance](#11-app-store-compliance)
12. [Additional On-Demand Features](#12-additional-on-demand-features)

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | **Python 3.12 + FastAPI** + Uvicorn (ASGI) | You're comfortable with it; FastAPI auto-generates OpenAPI docs; async-native; Pydantic v2 validation built-in |
| **Web Frontend** | **Next.js 15** (App Router) + Tailwind CSS 4 + shadcn/ui | Node.js ecosystem; SSR, SEO, PWA support, edge functions |
| **Mobile** | **React Native + Expo SDK 52** (Expo Router) | Node.js ecosystem; single codebase iOS + Android, code sharing with web |
| **Primary DB** | **PostgreSQL 16** via **Supabase** + pgvector extension | Managed, built-in RLS, real-time subscriptions, AI similarity |
| **Python ORM** | **SQLAlchemy 2.0** (async) + **asyncpg** driver | Mature, async-first, excellent PostgreSQL support; pairs perfectly with FastAPI |
| **DB Migrations** | **Alembic** | Standard Python migration tool; integrates with SQLAlchemy |
| **Cache / Queue** | **Redis** via **Upstash** + **ARQ** (Async Redis Queue) | ARQ is async-native Python (fits FastAPI's async model); lighter than Celery; Upstash is edge-compatible |
| **Search** | **Typesense** (Cloud or self-hosted) | POI + destination full-text search with typo tolerance |
| **File Storage** | **Cloudflare R2** | S3-compatible, no egress fees |
| **AI** | **Anthropic Claude API** (Python SDK) — `claude-sonnet-4-6` for itineraries, `claude-haiku-4-5` for chat/packing | Official Python SDK; streaming support; best structured JSON output |
| **Maps** | **Mapbox GL JS** / `react-native-maps` with Mapbox SDK | Better pricing than Google Maps for scale, highly customizable |
| **Payments** | **Stripe** Python SDK (web) + **RevenueCat** (mobile IAP) | Stripe for web; RevenueCat abstracts Apple/Google IAP |
| **Auth** | JWT via **python-jose** + **passlib/bcrypt** + OAuth (Google/Apple) | Standard Python JWT stack; secure, stateless, social login |
| **HTTP Client** | **httpx** (async) | Async HTTP for calling Mapbox, OpenWeather, Amadeus etc. from FastAPI |
| **Email** | **Resend** Python SDK + React Email templates (rendered server-side) | Developer-friendly; React Email handles HTML template design |
| **PDF Export** | **Playwright** (Python) | Headless Chromium renders the trip page to PDF |
| **Type Sharing** | FastAPI OpenAPI spec → **openapi-typescript** → `packages/generated-types/` | FastAPI auto-generates OpenAPI 3.1; frontend types auto-generated from spec in CI |
| **Backend Hosting** | **Railway** (Docker, Python image) | Docker-native, auto-scaling, straightforward Python deployment |
| **Web Hosting** | **Vercel** | Native Next.js, edge CDN, zero-config deployments |
| **Monitoring** | **Sentry** (Python SDK + JS SDK) + **PostHog** | Full-stack error tracking; PostHog for analytics + feature flags |
| **CI/CD** | **GitHub Actions** | Python: ruff + mypy + pytest; Node.js: eslint + tsc + jest |
| **Python Package Manager** | **uv** | Extremely fast Python dependency management; `pyproject.toml` based |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                  │
│   ┌─────────────────────┐       ┌────────────────────────────┐  │
│   │  Next.js Web App    │       │  React Native / Expo App   │  │
│   │  (Vercel + Edge CDN)│       │  (iOS + Android)           │  │
│   │  PWA / Offline      │       │  WatermelonDB (offline)    │  │
│   └──────────┬──────────┘       └─────────────┬──────────────┘  │
└──────────────┼───────────────────────────────┼──────────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │  HTTPS / WSS
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  FastAPI (Python 3.12 · Railway)                  │
│  JWT auth · Rate limiting (slowapi) · Pydantic v2 validation     │
│  OpenAPI 3.1 auto-docs · WebSocket endpoint (Starlette)          │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
  ┌─────────┐  ┌────────────┐ ┌──────────┐  ┌────────────────┐
  │  Auth   │  │ Itinerary  │ │  Social  │  │  Booking &     │
  │ Service │  │  Service   │ │  Service │  │  Affiliate     │
  │         │  │(AI Engine) │ │          │  │  Service       │
  └────┬────┘  └─────┬──────┘ └────┬─────┘  └──────┬─────────┘
       │             │             │               │
       └─────────────┴─────────────┴───────────────┘
                              │
               ┌──────────────┼─────────────┐
               ▼              ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────────┐
         │PostgreSQL│  │  Redis   │  │  BullMQ Jobs │
         │(Supabase)│  │(Upstash) │  │(Async AI,    │
         │ pgvector │  │          │  │ PDF, flights)│
         └──────────┘  └──────────┘  └──────────────┘
               │
         ┌─────┴──────┐
         │  Typesense │
         │  (Search)  │
         └────────────┘

External APIs:
┌────────────────────────────────────────────────────────────────┐
│ Claude AI API │ Mapbox API │ OpenWeatherMap │ Amadeus (flights) │
│ Stripe        │ RevenueCat │ Google Places  │ Booking.com Aff.  │
│ Firebase FCM  │ Resend     │ Cloudflare R2  │ Open Exchange Rates│
└────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Approach |
|---|---|
| **AI generation** | Always async — client gets `jobId`, receives streaming progress via WebSocket as Claude generates each day |
| **Cottage search** | Synchronous search against `cottage_properties` cache table; background ARQ job refreshes stale listings from affiliate APIs on a rolling TTL; no AI job queue needed for property search |
| **Shared types** | FastAPI auto-generates an OpenAPI 3.1 spec from Pydantic models. `openapi-typescript` runs in CI to generate `packages/generated-types/` — TypeScript types consumed by both web and mobile. Zero manual drift. |
| **Offline** | PWA (Workbox) caches itinerary pages; WatermelonDB syncs to device SQLite on mobile |
| **Security** | Row Level Security on all PostgreSQL tables; collaborator access via explicit join table + RLS policies |
| **POI caching** | `places_cache` table with 1-hour TTL avoids redundant external API calls |

---

## 3. Monorepo Structure

```
mytravel/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, type-check, test on PR
│       ├── deploy-api.yml          # Deploy to Railway on main merge
│       └── deploy-web.yml          # Deploy to Vercel on main merge
│
├── apps/
│   ├── api/                        # FastAPI backend (Python 3.12)
│   │   ├── Dockerfile
│   │   ├── pyproject.toml          # Dependencies managed with uv
│   │   ├── main.py                 # FastAPI app entry, router registration
│   │   ├── config.py               # Pydantic Settings (env vars, validated at startup)
│   │   │
│   │   ├── routers/                # FastAPI routers grouped by domain
│   │   │   ├── auth.py
│   │   │   ├── trips.py
│   │   │   ├── itinerary.py        # Itinerary items, day management
│   │   │   ├── places.py
│   │   │   ├── ai.py               # Concierge chat, packing list, suggestions
│   │   │   ├── compare.py          # Destination Matchmaker (no auth required)
│   │   │   ├── cottages.py         # Cottage & Cabin Search, wishlist, trip link
│   │   │   ├── budget.py
│   │   │   ├── social.py           # Members, votes, sharing
│   │   │   ├── flights.py
│   │   │   ├── subscriptions.py
│   │   │   ├── curated.py          # Curated itinerary catalog + purchases
│   │   │   └── admin.py            # Admin content management
│   │   │
│   │   ├── services/               # Business logic (no HTTP concerns)
│   │   │   ├── ai/
│   │   │   │   ├── itinerary_generator.py  ← CORE (Claude API + streaming)
│   │   │   │   ├── concierge.py
│   │   │   │   ├── packing_list.py
│   │   │   │   ├── destination_compare.py  # Matchmaker: scores 7 dims, returns winner + reasoning
│   │   │   │   ├── cottage_match.py        # AI property match scoring against trip profile (Premium)
│   │   │   │   └── prompts/
│   │   │   │       ├── itinerary.py
│   │   │   │       ├── concierge.py
│   │   │   │       └── destination_compare.py  # Structured comparison prompt + output schema
│   │   │   ├── maps/
│   │   │   │   ├── mapbox.py
│   │   │   │   └── places.py       # POI enrichment + caching
│   │   │   ├── weather/
│   │   │   │   └── openweather.py
│   │   │   ├── flights/
│   │   │   │   └── amadeus.py
│   │   │   ├── payments/
│   │   │   │   └── stripe.py
│   │   │   ├── notifications/
│   │   │   │   ├── email.py        # Resend SDK client
│   │   │   │   └── push.py         # FCM push notifications
│   │   │   └── export/
│   │   │       ├── pdf.py          # Playwright headless PDF render
│   │   │       └── calendar.py     # icalendar .ics generation
│   │   │
│   │   ├── workers/                # ARQ async task workers (replaces BullMQ)
│   │   │   ├── settings.py         # ARQ WorkerSettings + Redis connection
│   │   │   ├── itinerary_generation.py  ← CORE (async AI pipeline + WS broadcast)
│   │   │   ├── pdf_export.py
│   │   │   ├── flight_alert_poll.py     # Cron task (every 30 min)
│   │   │   └── email_notification.py
│   │   │
│   │   ├── db/
│   │   │   ├── base.py             # SQLAlchemy async engine + session factory
│   │   │   ├── models/             # SQLAlchemy ORM models ← CORE (all tables)
│   │   │   │   ├── user.py
│   │   │   │   ├── trip.py
│   │   │   │   ├── itinerary.py
│   │   │   │   ├── place.py
│   │   │   │   ├── budget.py
│   │   │   │   ├── subscription.py
│   │   │   │   ├── curated.py
│   │   │   │   └── ...
│   │   │   ├── migrations/         # Alembic migration scripts
│   │   │   │   ├── env.py
│   │   │   │   └── versions/
│   │   │   └── queries/            # Reusable async query functions
│   │   │       ├── trips.py
│   │   │       ├── users.py
│   │   │       └── places.py
│   │   │
│   │   ├── schemas/                # Pydantic v2 request/response models
│   │   │   ├── trip.py
│   │   │   ├── user.py
│   │   │   ├── itinerary.py        ← CORE (Claude output shape validated here)
│   │   │   ├── place.py
│   │   │   ├── compare.py          # CompareRequest, DestinationScore, CompareResponse
│   │   │   ├── curated.py
│   │   │   └── common.py           # Shared pagination, error response models
│   │   │
│   │   ├── dependencies/           # FastAPI dependency injection
│   │   │   ├── auth.py             # get_current_user, require_auth
│   │   │   ├── premium.py          # require_premium dependency
│   │   │   └── trip_access.py      # require_trip_editor / require_trip_member
│   │   │
│   │   └── websocket/
│   │       └── manager.py          # WebSocket connection manager (per-trip rooms)
│   │
│   │   # Key files for Destination Matchmaker:
│   │   # routers/compare.py        → POST /compare/destinations (no auth), GET /compare/history
│   │   # services/ai/destination_compare.py  → builds prompt, calls Haiku, parses scores
│   │   # services/ai/prompts/destination_compare.py  → structured prompt + Pydantic output schema
│   │   # schemas/compare.py        → CompareRequest, DestinationScore, CompareResult, CompareResponse
│   │
│   ├── web/                        # Next.js 15
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx        # Landing / marketing
│   │       │   ├── (auth)/         # Login, Register (no navbar)
│   │       │   ├── (app)/          # Authenticated shell
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── dashboard/  # My trips
│   │       │   │   ├── trips/
│   │       │   │   │   ├── new/
│   │       │   │   │   └── [id]/
│   │       │   │   │       ├── page.tsx        # Itinerary overview
│   │       │   │   │       ├── day/[dayNum]/
│   │       │   │   │       ├── map/
│   │       │   │   │       ├── budget/
│   │       │   │   │       ├── packing/
│   │       │   │   │       └── settings/
│   │       │   │   ├── compare/    # Destination Matchmaker (accessible without auth)
│   │       │   │   ├── concierge/  # AI chat
│   │       │   │   ├── account/    # Profile, subscription
│   │       │   │   └── rewards/    # Loyalty
│   │       │   └── share/[token]/  # Public trip view (SEO, no auth)
│   │       ├── components/
│   │       │   ├── ui/             # shadcn/ui base components
│   │       │   ├── maps/
│   │       │   │   ├── TripMap.tsx
│   │       │   │   ├── DayMapPreview.tsx
│   │       │   │   └── ScenicRouteMap.tsx
│   │       │   ├── itinerary/
│   │       │   │   ├── DayCard.tsx
│   │       │   │   ├── ActivityItem.tsx
│   │       │   │   ├── GenerationProgress.tsx  ← Most complex component
│   │       │   │   └── TimelineView.tsx
│   │       │   ├── budget/
│   │       │   └── concierge/ChatInterface.tsx
│   │       ├── hooks/
│   │       │   ├── useWebSocket.ts
│   │       │   ├── useGenerationStatus.ts
│   │       │   ├── useTrip.ts
│   │       │   └── useGeolocation.ts
│   │       ├── lib/
│   │       │   ├── api-client.ts   # Typed API client (shared schemas)
│   │       │   ├── mapbox.ts
│   │       │   └── analytics.ts    # PostHog wrapper
│   │       └── store/              # Zustand
│   │           ├── auth.store.ts
│   │           ├── trip.store.ts
│   │           └── ui.store.ts
│   │
│   └── mobile/                     # React Native + Expo
│       ├── app/                    # Expo Router (file-based)
│       │   ├── _layout.tsx         # Root layout + auth guard
│       │   ├── (tabs)/
│       │   │   ├── index.tsx       # My Trips
│       │   │   ├── discover.tsx    # Destination discovery
│       │   │   ├── concierge.tsx   # AI chat
│       │   │   └── profile.tsx
│       │   ├── trips/
│       │   │   ├── new.tsx
│       │   │   └── [id]/
│       │   └── auth/
│       ├── components/
│       ├── services/
│       │   ├── api.ts              # Typed API client (same shared schemas)
│       │   ├── offline-sync.ts     # WatermelonDB sync
│       │   └── notifications.ts    # Expo push setup
│       ├── db/                     # WatermelonDB local schema
│       └── app.json                # Expo config
│
├── packages/
│   ├── generated-types/            ← Auto-generated from FastAPI's OpenAPI spec
│   │   ├── src/
│   │   │   └── api.d.ts            # TypeScript types (never edit manually)
│   │   ├── package.json
│   │   └── README.md               # "Run pnpm generate:types to refresh"
│   │
│   ├── shared/                     # Hand-written shared frontend utilities
│   │   └── src/
│   │       └── constants/          # Shared constants (no schemas — Python owns those)
│   │           ├── travel-styles.ts
│   │           ├── categories.ts
│   │           └── currencies.ts
│   │
│   └── email-templates/            # React Email
│       └── src/
│           ├── WelcomeEmail.tsx
│           ├── TripInviteEmail.tsx
│           ├── FlightAlertEmail.tsx
│           └── SubscriptionEmail.tsx
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                    # Root devDeps + workspace scripts
├── tsconfig.base.json
├── .eslintrc.js
└── .prettierrc
```

---

## 4. Database Schema

All tables use Supabase Row Level Security (RLS). UUID primary keys throughout.

### Core Tables

```sql
-- Users
users (id, email, display_name, avatar_url, auth_provider, subscription_tier,
       loyalty_points, preferred_currency, created_at, updated_at)

-- Trips
trips (id, owner_id→users, title, destination, destination_lat, destination_lng,
       start_date, end_date, travel_style[], mobility_level, budget_total, budget_currency,
       status [draft|generating|active|completed], is_public, share_token, created_at)

-- Collaboration
trip_members (id, trip_id→trips, user_id→users, role [owner|editor|viewer], joined_at)

-- Itinerary structure
itinerary_days (id, trip_id→trips, day_number, date, theme, weather_summary, ai_notes)
itinerary_items (id, day_id→itinerary_days, position, start_time, end_time, title,
                 description, category, place_id, place_name, address, lat, lng,
                 duration_mins, estimated_cost, currency, booking_url, affiliate_partner,
                 notes, is_voted_on)

-- Group activity voting
activity_votes (id, item_id→itinerary_items, user_id→users, vote [up|down|neutral])
-- UNIQUE(item_id, user_id)

-- POI cache (reduces external API calls)
places_cache (id, external_id UNIQUE, name, category[], address, lat, lng, rating,
              review_count, price_level, opening_hours JSONB, photos text[],
              embedding vector(1536), cached_at, expires_at)

-- Budget
budget_items (id, trip_id→trips, itinerary_item_id→itinerary_items,
              category, label, planned_amount, actual_amount,
              currency, exchange_rate, receipt_url)

-- Packing lists
packing_lists (id, trip_id→trips, generated_by_ai)
packing_items (id, list_id→packing_lists, category, label, is_packed,
               is_essential, quantity)

-- Saved places (wishlist)
saved_places (id, user_id→users, place_id, place_name, notes, tags[])

-- Trip reviews
trip_reviews (id, trip_id→trips, author_id→users, overall_rating, accuracy_rating,
              body, photos text[], is_published)

-- Subscriptions & payments
subscriptions (id, user_id→users UNIQUE, stripe_customer_id, stripe_subscription_id,
               plan, status, current_period_end)

-- Affiliate tracking
affiliate_clicks (id, user_id→users, item_id→itinerary_items,
                  partner, clicked_at, converted, commission_amount)

-- Sponsored listings
sponsored_places (id, place_id, sponsor_name, campaign_id, priority_boost,
                  active_from, active_until, impressions, clicks)

-- Flight alerts
flight_alerts (id, trip_id→trips, user_id→users, flight_number, flight_date,
               departure_iata, arrival_iata, last_status, is_active)

-- AI concierge chat
chat_sessions (id, trip_id→trips, user_id→users, created_at)
chat_messages (id, session_id→chat_sessions, role [user|assistant], content, created_at)

-- Loyalty rewards
loyalty_transactions (id, user_id→users, points, reason, reference_id, created_at)

-- Curated Tour Itineraries
curated_itineraries (id, slug UNIQUE, title, destination, destination_lat/lng, duration_days,
                     travel_style[], cover_image_url, short_description, full_description,
                     author_name, full_price_usd, member_price_usd, is_premium_included,
                     is_published, is_featured, tags[], total_purchases, average_rating)

curated_itinerary_days (id, curated_itinerary_id→curated_itineraries, day_number, title, theme, description)

curated_itinerary_items (id, day_id→curated_itinerary_days, position, start_time, end_time,
                         title, description, category, place_name, address, lat, lng,
                         duration_mins, estimated_cost, currency, booking_url, tips)

curated_itinerary_purchases (id, curated_itinerary_id→curated_itineraries,
                             user_id uuid nullable,  -- null for non-member guest purchases
                             guest_email text nullable,
                             price_paid, currency, tier_at_purchase enum(non_member,member_free,member_paid,premium),
                             stripe_payment_intent_id, revenuecat_transaction_id,
                             purchased_at, access_token UNIQUE)

-- users table additions
users ++ curated_free_used int DEFAULT 0  -- count of free curated itineraries claimed
      ++ curated_free_reset_at timestamptz  -- anniversary date for annual reset

-- Cottage & Cabin Search (FR-15)
cottage_properties (id uuid PK, external_id UNIQUE, platform enum(vrbo,airbnb,booking,direct),
                    name, property_type enum(cottage,cabin,chalet,treehouse,farmhouse,lodge),
                    host_name, host_is_superhost bool,
                    location_name, region, lat, lng,
                    bedrooms int, bathrooms decimal, max_guests int, sqft int nullable,
                    price_per_night decimal, currency char(3),
                    rating decimal, review_count int,
                    amenities text[], setting text[], photos text[], description text,
                    affiliate_url, cached_at, expires_at)

trip_accommodations (id uuid PK, trip_id→trips UNIQUE,  -- one per trip
                     property_id→cottage_properties,
                     check_in date, check_out date, guests int,
                     platform_listing_url text, affiliate_click_id→affiliate_clicks nullable,
                     added_at timestamptz)

saved_properties (id uuid PK, user_id→users, property_id→cottage_properties,
                  notes text nullable, saved_at timestamptz,
                  UNIQUE(user_id, property_id))
```

---

## 5. API Design

**Base URL**: `https://api.mytravel.app/v1`

### Authentication
```
POST  /auth/register              Create account
POST  /auth/login                 Login (returns access + refresh tokens)
POST  /auth/refresh               Rotate refresh token
POST  /auth/logout                Invalidate refresh token
POST  /auth/oauth/google          Google OAuth
POST  /auth/oauth/apple           Apple OAuth
POST  /auth/forgot-password
POST  /auth/reset-password
```

### Trip Management
```
GET   /trips                      List user's trips
POST  /trips                      Create trip
GET   /trips/:id                  Full trip + itinerary
PATCH /trips/:id                  Update metadata
DELETE /trips/:id

GET   /trips/shared/:shareToken   Public trip view (no auth)

POST  /trips/:id/generate         Trigger AI generation → returns { jobId }
GET   /trips/:id/generation-status/:jobId
POST  /trips/:id/regenerate-day/:dayNumber

GET   /trips/:id/days
GET   /trips/:id/days/:dayId
PATCH /trips/:id/days/:dayId

GET    /trips/:id/days/:dayId/items
POST   /trips/:id/days/:dayId/items        Add custom item
PATCH  /trips/:id/days/:dayId/items/:itemId
DELETE /trips/:id/days/:dayId/items/:itemId
POST   /trips/:id/days/:dayId/items/reorder
```

### Collaboration
```
GET    /trips/:id/members
POST   /trips/:id/members/invite   Invite by email
PATCH  /trips/:id/members/:userId
DELETE /trips/:id/members/:userId

POST   /trips/:id/days/:dayId/items/:itemId/vote
GET    /trips/:id/days/:dayId/items/:itemId/votes
```

### Discovery
```
GET  /places/search?q=&lat=&lng=&radius=&category=
GET  /places/:placeId
GET  /places/nearby?lat=&lng=&category=&radius=
GET  /places/:placeId/similar      AI similarity (pgvector)
```

### AI Features
```
POST  /ai/chat                     Concierge (SSE streaming)
GET   /ai/chat/sessions
GET   /ai/chat/sessions/:id

POST  /ai/packing-list/:tripId
POST  /ai/suggest-alternatives/:itemId
```

### Destination Matchmaker
```
POST  /compare/destinations        AI comparison — no auth required
                                   Body: { destinations[], travel_month, duration_days,
                                           budget_level, group_type, priority }
                                   Returns: { winner, scores{}, reasoning, quickFacts{},
                                              comparisonTable[] }
GET   /compare/history             Saved comparisons for current user [auth]
POST  /compare/:id/save            Persist an ephemeral comparison result [auth]
DELETE /compare/:id                Delete saved comparison [auth]
```

### Cottage & Cabin Search
```
GET   /cottages/search             Search properties
                                   Query: location, checkin, checkout, guests,
                                          type[], bedrooms, min_price, max_price,
                                          amenities[], setting[], sort, page
GET   /cottages/featured           Curated featured listings (for dashboard card)
GET   /cottages/:id                Full property detail
GET   /cottages/:id/book           Track click → 302 to affiliate URL [auth]
POST  /cottages/:id/save           Add to wishlist [auth]
DELETE /cottages/:id/save          Remove from wishlist [auth]
GET   /cottages/saved              User wishlist [auth]
POST  /ai/cottage-match/:tripId    AI property match scoring vs trip profile [auth, Premium]

GET    /trips/:id/accommodation    Get linked accommodation [auth]
POST   /trips/:id/accommodation    Link property to trip [auth]
DELETE /trips/:id/accommodation    Remove linked accommodation [auth]
```

### Budget
```
GET   /trips/:id/budget
POST  /trips/:id/budget/items
PATCH /trips/:id/budget/items/:itemId
DELETE /trips/:id/budget/items/:itemId
GET   /currencies/rates
```

### Export & Sharing
```
POST  /trips/:id/share             Enable share link
DELETE /trips/:id/share
POST  /trips/:id/export/pdf        Async → returns { jobId }
POST  /trips/:id/export/calendar   Returns .ics file
GET   /trips/:id/export/status/:jobId
```

### Flight Alerts
```
GET    /trips/:id/flight-alerts
POST   /trips/:id/flight-alerts
DELETE /trips/:id/flight-alerts/:alertId
```

### Monetization
```
GET   /subscription/plans
POST  /subscription/checkout       Stripe checkout session URL
POST  /subscription/portal         Stripe customer portal URL
GET   /subscription/status
POST  /subscription/webhook        Stripe webhook (unsigned endpoint)

GET   /affiliate/click/:itemId     Track click → redirect to partner URL

GET   /loyalty/balance
GET   /loyalty/history
POST  /loyalty/redeem
```

### Curated Itineraries
```
GET   /curated                          Public catalog (no auth required)
GET   /curated/:slug                    Full detail + Day 1 preview (no auth)
GET   /curated/:slug/pricing            Tier-appropriate price for current user
POST  /curated/:slug/checkout           Initiate purchase
GET   /curated/library                  User's purchased/claimed itineraries [auth]
POST  /curated/:slug/claim-free         Use one of 5 member free claims [auth]
POST  /curated/:slug/import             Import as editable trip [auth]
GET   /curated/access/:accessToken      Non-member access via emailed token

POST  /admin/curated                    Create curated itinerary [admin]
PATCH /admin/curated/:id                Edit [admin]
POST  /admin/curated/:id/publish        Publish [admin]
GET   /admin/curated/:id/stats          Revenue + purchase stats [admin]
```

### WebSocket Events (`WSS /ws?token=<jwt>`)

**Client → Server**:
```json
{ "type": "subscribe_trip", "tripId": "..." }
{ "type": "subscribe_generation", "jobId": "..." }
{ "type": "unsubscribe_trip", "tripId": "..." }
```

**Server → Client**:
```json
{ "type": "generation_progress", "jobId": "...", "progress": 45, "partialDay": {...} }
{ "type": "generation_complete", "jobId": "...", "tripId": "..." }
{ "type": "trip_updated", "tripId": "...", "change": {...} }
{ "type": "vote_updated", "itemId": "...", "votes": {...} }
{ "type": "flight_alert", "tripId": "...", "message": "Flight UA123 delayed 45min" }
{ "type": "member_joined", "tripId": "...", "user": {...} }
```

---

## 6. Implementation Phases

### Phase 1 — MVP (Weeks 1–10)
**Goal**: End-to-end itinerary generation working for a single user.

| Weeks | Focus |
|---|---|
| 1–2 | **Foundation**: Monorepo scaffold (pnpm + Turborepo for Node.js apps; uv + pyproject.toml for Python API), GitHub Actions CI/CD (separate Python + Node.js jobs), provision Supabase + Upstash + Railway + Vercel |
| 3–4 | **Backend core**: FastAPI app, Pydantic Settings, SQLAlchemy 2.0 async + Alembic migrations, JWT auth + OAuth, trip CRUD endpoints, Pydantic schemas, auto-generate OpenAPI spec → `packages/generated-types/` |
| 5–6 | **AI engine**: ARQ async worker, Claude Python SDK with structured Pydantic output, WebSocket streaming via FastAPI/Starlette, OpenWeatherMap integration |
| 7–8 | **Web frontend**: Trip creation wizard, streaming generation progress UI, itinerary day/activity view, Mapbox pins |
| 9–10 | **Mobile MVP**: Expo app mirroring web flows, TestFlight + Play Store internal testing |

**MVP deliverable**: User creates account → inputs destination + dates + travel style → receives AI day-by-day itinerary with map.

---

### Phase 2 — Growth Features (Weeks 11–20)

| Weeks | Focus |
|---|---|
| 11–12 | **Social + Destination Matchmaker**: Trip member invites via email, real-time collaborative editing (WS broadcast), activity voting, public SEO share pages; **`POST /compare/destinations`** — Haiku-powered destination comparison, Compare page (web + mobile), no auth required, integrated into new-trip flow |
| 13–14 | **Monetization**: Stripe subscriptions (Premium), feature gates (`require-premium` middleware), affiliate link click tracking, sponsored listing flagging, **curated itinerary purchase flow** (non-member Stripe guest checkout, member free-claim counter, Premium entitlement check, admin content dashboard) |
| 15–16 | **Local discovery**: Mapbox Places + Google Places fallback, Typesense search index, scenic route visualizer (Directions API) |
| 17–18 | **Budget + packing**: Multi-currency budget tracker (Open Exchange Rates), AI packing list generation |
| 17–18 | **Cottage & Cabin Search**: `GET /cottages/search`, property detail page, Vrbo/Airbnb/Booking.com affiliate ingestion, `cottage_properties` cache table, "Add to Trip" flow, wishlist (`saved_properties`), affiliate click tracking |
| 19–20 | **Export + offline**: PDF export (Puppeteer), `.ics` calendar, PWA offline (Workbox), WatermelonDB offline sync (mobile) |

---

### Phase 3 — Scale & Intelligence (Weeks 21–30)

| Weeks | Focus |
|---|---|
| 21–22 | **AI concierge**: Streaming chat with full trip context injected, modify itinerary by chatting ("swap Day 2 dinner for a vegetarian option") |
| 23–24 | **Flights**: Amadeus API flight search + Booking.com hotel affiliate, BullMQ cron for flight status polling, push notifications on delay |
| 25–26 | **Reviews**: Post-trip review flow, photo uploads to Cloudflare R2, moderation queue |
| 27–28 | **Loyalty program**: Points on trips/bookings/reviews, redemption for premium access + partner discounts |
| 29–30 | **Personalization**: pgvector similarity ("trips you might like"), seasonal recommendations, PostHog A/B testing for AI prompts |

---

## 7. Third-Party Integrations

| Service | Phase | Purpose | Sign-Up |
|---|---|---|---|
| **Anthropic Claude API** | MVP | Itinerary gen (Sonnet) + chat/packing (Haiku) | console.anthropic.com |
| **Mapbox GL** | MVP | Maps, geocoding, directions, scenic routes | mapbox.com |
| **OpenWeatherMap** | MVP | Weather forecasts for smart suggestions | openweathermap.org |
| **Supabase** | MVP | PostgreSQL + Auth + RLS + Realtime | supabase.com |
| **Upstash Redis** | MVP | Cache, rate limit, ARQ job queue | upstash.com |
| **Resend** | MVP | Transactional email | resend.com |
| **Sentry** | MVP | Error monitoring (web + mobile + API) | sentry.io |
| **Stripe** | Phase 2 | Subscriptions + webhook handling | stripe.com |
| **RevenueCat** | Phase 2 | Mobile IAP (Apple/Google) abstraction | revenuecat.com |
| **Google Places API** | Phase 2 | POI enrichment fallback, photos, reviews | console.cloud.google.com |
| **Typesense** | Phase 2 | Destination + POI full-text search | typesense.org |
| **Cloudflare R2** | Phase 2 | Photo uploads, PDF storage, map tile cache | cloudflare.com |
| **Open Exchange Rates** | Phase 2 | Real-time currency conversion | openexchangerates.org |
| **PostHog** | Phase 2 | Analytics, feature flags, session replay | posthog.com |
| **Amadeus API** | Phase 3 | Flight search + live flight status | developers.amadeus.com |
| **Booking.com Affiliate** | Phase 3 | Hotel + accommodation affiliate search | developers.booking.com |
| **Firebase FCM** | Phase 3 | Push notifications (mobile + web PWA) | firebase.google.com |
| **GetYourGuide / Viator / Klook** | Phase 3 | Tours & activity affiliate links | affiliate programs |
| **Vrbo Partner API** | Phase 2 | Cottage & cabin property listings + availability | vrbo.com/p/affiliates |
| **Airbnb Affiliate Programme** | Phase 2 | Additional cottage/cabin inventory + affiliate commissions | airbnb.com/affiliates |
| **Booking.com Affiliate** | Phase 2 | Cottage, cabin & chalet inventory with affiliate commission tracking | developers.booking.com |

---

## 8. Monetization Strategy

### Free Tier
- 3 AI itinerary generations/month (enforced via Redis counter keyed to `user:{id}:gen_count`)
- Basic map view + standard recommendations
- Manual packing list only
- No offline access, no AI concierge chat
- Sponsored listings visible
- Cottage & Cabin Search — browsing, searching, and "Add to Trip" linking (free)

### Premium Tier — $9.99/month · $79/year (save 34%)
- **Unlimited** AI itinerary generations
- AI day-regeneration (regenerate individual days)
- AI concierge chat (unlimited messages)
- AI packing list generation
- **AI Property Match Scoring** — Claude scores cottage/cabin results against your trip profile and shows a match % per property
- Offline access (PWA download + mobile WatermelonDB sync)
- PDF export + `.ics` calendar sync
- No sponsored placements
- Priority customer support

**Gate enforcement**: Stripe webhook → update `subscriptions` table → `require-premium.ts` middleware checks on protected routes. PostHog feature flags allow gradual rollout of new premium features.

### Affiliate Revenue
- Every `itinerary_items.booking_url` = affiliate-tracked URL
- Partners: **GetYourGuide**, **Booking.com**, **Viator**, **Klook**, **Airbnb Experiences**
- Flow: `/affiliate/click/:itemId` → log to `affiliate_clicks` → redirect to real partner URL
- Monthly reconciliation of conversions against partner dashboards

### Sponsored Listings
- Businesses pay for placement in POI recommendations
- `sponsored_places.priority_boost` elevates rank in search results
- Required "Sponsored" badge (legal compliance)
- Phase 3: Self-serve ad portal for direct business sign-up

### Curated Tour Itineraries
Expert-crafted, pre-built itineraries for specific tours — authored by MyTravel's content team or verified local experts. **Not AI-generated on demand.**

**Pricing tiers:**

| User Type | Access |
|---|---|
| Non-member (no account) | Full price (e.g., $12.99) — Stripe guest checkout |
| Free member (registered) | First **5 free**, then member-discounted price (e.g., $7.79, ~40% off) |
| Premium subscriber | **All included** — no purchase required |

**Key implementation details:**
- `users.curated_free_used` counter tracks free claims; resets annually
- `GET /curated/:slug/pricing` returns the correct price for the requesting user before they hit checkout
- Non-members receive a unique `access_token` by email after purchase — no account required to view
- Non-members are nudged (not forced) to create a free account post-purchase
- Web purchase: Stripe Checkout (one-time, `mode: payment`)
- Mobile purchase: **Apple IAP / Google Play Billing via RevenueCat** (App Store policy requirement)
- After purchase/claim, `POST /curated/:slug/import` copies the curated itinerary into the user's trips as a fully editable trip
- Admin dashboard (`/admin/curated`) for content creation, pricing control, publish/unpublish, and revenue stats

### Loyalty Program
| Action | Points Earned |
|---|---|
| Create a trip | 50 pts |
| Book via affiliate link | 200 pts |
| Leave a trip review | 100 pts |
| Refer a friend (they sign up) | 500 pts |
| Share a public trip (5+ views) | 25 pts |

| Redemption | Points Required |
|---|---|
| 1 free Premium month | 2,000 pts |
| Unlock a curated itinerary (after free allowance exhausted) | 1,500 pts |
| Partner discount voucher | 1,000 pts |

---

## 9. AI Cost Controls

| Control | Implementation |
|---|---|
| **Caching** | Hash input params (destination, dates, style, mobility) → Redis key, 24h TTL. Identical requests skip Claude entirely |
| **Free tier cap** | Redis counter `user:{id}:gen_count` resets monthly. Enforced in `require-premium.ts` for generation route |
| **Model tiering** | `claude-sonnet-4-6` for full itinerary generation; `claude-haiku-4-5` for chat + packing list |
| **Token budget** | Set `max_tokens` per call — fail gracefully with partial result + retry prompt |
| **Extended thinking** | Opt-in for multi-city / complex itineraries only (Phase 2+) |
| **Spend alerting** | Anthropic API usage dashboard + custom alerting when daily spend > threshold |

### Itinerary Generation Prompt Strategy

The system prompt for itinerary generation must:
1. Inject: destination, dates, weather forecast, travel style, mobility level, budget
2. Demand strict JSON output schema (embed the full Pydantic `ItinerarySchema` structure in the prompt — FastAPI serializes it to JSON Schema automatically)
3. Ask Claude to sequence activities by **geographic proximity** within each day (minimise backtracking)
4. Request `distance_from_previous_km` and `why_chosen` per activity (builds user trust)
5. Use **streaming** so the UI can render each day as it arrives

---

## 10. Testing Strategy

| Layer | Tool | What to Test |
|---|---|---|
| Python unit | **pytest** + **pytest-asyncio** | AI prompt builder, affiliate URL helper, currency conversion, Pydantic schema validation |
| Python integration | **httpx** + **pytest** (FastAPI `TestClient`) | Route handlers, auth flow, Stripe webhook handling against test Supabase project |
| Python type checking | **mypy** (strict) | All Python services, schemas, and workers |
| Python linting | **ruff** | Fast Python linter + formatter (replaces flake8 + black) |
| Frontend unit | **Jest** + **React Testing Library** | Components, hooks, utility functions |
| E2E | **Playwright** (Node.js) | Trip creation → generation → itinerary view → export → share |
| Mobile | **Expo Go** (dev) + **EAS Build** | Device testing; TestFlight + Play Store internal |
| AI prompts | **pytest snapshot** (`syrupy`) | Assert Claude Pydantic output matches schema on fixture inputs; catch prompt regressions |
| Load | **k6** | Concurrent itinerary generation → validate ARQ queue behavior under pressure |
| Stripe webhooks | **Stripe CLI** | `stripe listen --forward-to localhost:8000/api/v1/subscription/webhook` |
| Type sync | **openapi-typescript** in CI | Assert generated TS types are up to date with FastAPI spec; fail PR if drift detected |

---

## 11. App Store Compliance

- All **in-app purchases and subscriptions on mobile** must route through **Apple IAP / Google Play Billing** — not Stripe directly. RevenueCat handles this abstraction.
- **Affiliate links** must open in the **system browser** (not an in-app WebView) to avoid App Store commissions on affiliate-driven purchases.
- **Sponsored content** must be clearly labeled "Sponsored" (Apple App Store Review Guideline 4.8, FTC regulations).

---

## 12. Additional On-Demand Features

These features were identified as high-demand additions beyond the original spec:

| Feature | Phase | Value |
|---|---|---|
| **Offline itinerary access** (PWA + mobile) | 2 | Essential for travel — no connectivity abroad |
| **Multi-currency budget tracker** | 2 | Reduces travel anxiety, clear differentiator |
| **Flight + accommodation search** | 3 | Completes the "end-to-end trip" experience |
| **AI chat concierge** | 3 | "Ask anything about your trip" — high engagement, premium hook |
| **Real-time flight delay alerts** | 3 | High perceived value, drives push notification opt-in |
| **Group trip coordination + voting** | 2 | Viral feature — a single group trip brings multiple users |
| **Packing list generator (AI)** | 2 | Quick win, strong premium upsell hook |
| **Loyalty rewards program** | 3 | Reduces churn, monetizes engagement |
| **Trip reviews + photo sharing** | 3 | UGC flywheel — improves recommendation quality |
| **AI itinerary similarity ("trips like this")** | 3 | Discovery loop, increases session depth |
| **Scenic route visualizer** | 2 | Visual wow factor, shareable, SEO-friendly |
| **Seasonal destination recommendations** | 3 | Content marketing + re-engagement hook |
| **Destination Matchmaker** | 2 | Converts undecided users into trip creators; free feature; drives top-of-funnel engagement; Haiku model keeps cost negligible |

---

## Critical Files Reference

| File | Why It Matters |
|---|---|
| `apps/api/services/ai/itinerary_generator.py` | Core product — Claude Python SDK, prompt building, Pydantic output parsing, streaming |
| `apps/api/workers/itinerary_generation.py` | Async AI pipeline — ARQ task + WebSocket broadcast |
| `apps/api/schemas/itinerary.py` | Pydantic v2 schema for Claude's JSON output — source of truth for itinerary shape; drives OpenAPI spec and generated TS types |
| `apps/api/db/models/` | SQLAlchemy ORM models — all other DB code derives from here |
| `apps/api/websocket/manager.py` | WebSocket room manager — handles per-trip subscriptions for generation streaming and live collaboration |
| `packages/generated-types/src/api.d.ts` | Auto-generated TypeScript types from FastAPI OpenAPI spec — consumed by web and mobile; never edit manually |
| `apps/web/src/components/itinerary/GenerationProgress.tsx` | Most complex frontend component — streaming, partial day rendering, error states |

---

*Generated: 2026-03-14 | Stack as of: Node.js 22 LTS, Next.js 15, Expo SDK 52, Claude API (claude-sonnet-4-6 / claude-haiku-4-5)*
