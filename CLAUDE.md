# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyTravel is a full-stack AI-powered travel planning app. Users create trips, generate personalized multi-day itineraries via Claude AI, and interact with an AI travel concierge. The monorepo lives under `app/` with a FastAPI backend (`app/api/`) and a Next.js 15 frontend (`app/web/`).

## Development Commands

All commands run from within `app/api/` or `app/web/` as noted.

### Backend (FastAPI + Python 3.12, managed with `uv`)

```bash
# From app/api/
uv sync                                        # Install/sync dependencies
uv run uvicorn main:app --reload               # Dev server → http://localhost:8000
uv run alembic upgrade head                    # Run DB migrations
uv run alembic revision --autogenerate -m "..."# Create new migration
uv run pytest                                  # Run all tests
uv run pytest tests/test_foo.py::test_bar      # Run single test
uv run ruff check .                            # Lint
uv run ruff format .                           # Format
uv run mypy .                                  # Type check
```

API docs (Swagger UI) auto-available at `http://localhost:8000/docs`.

### Frontend (Next.js 15 + TypeScript, managed with `pnpm`)

```bash
# From app/web/
pnpm dev          # Dev server → http://localhost:3000
pnpm build        # Production build
pnpm lint         # ESLint
pnpm type-check   # TypeScript type check
```

### Database

```bash
# From app/
docker compose up -d     # Start PostgreSQL 16 on port 5432
docker compose down      # Stop
```

### Environment Setup

```bash
cp app/api/.env.example app/api/.env       # Fill in: ANTHROPIC_API_KEY, MAPBOX_TOKEN, SECRET_KEY, DATABASE_URL
cp app/web/.env.local.example app/web/.env.local  # Fill in: NEXT_PUBLIC_MAPBOX_TOKEN
```

Set `MOCK_AI=true` in `app/api/.env` to skip Anthropic API calls and return mock data during development.

## Architecture

### Request Flow

```
Browser → Next.js (port 3000)
            └─ Axios (src/lib/api.ts) → FastAPI (port 8000)
                                            ├─ SQLAlchemy async → PostgreSQL
                                            ├─ Anthropic SDK → Claude API
                                            └─ Mapbox API (geocoding)
```

Authentication uses JWT stored in `localStorage`. The Axios interceptor in `src/lib/api.ts` attaches `Authorization: Bearer <token>` to every request and redirects to `/login` on 401.

### Backend Structure (`app/api/`)

Routers in `app/routers/` map to these URL prefixes:
- `/auth` — JWT login/register + Google OAuth (`routers/auth.py`, `routers/oauth.py`)
- `/trips` — Trip CRUD with Mapbox geocoding (`routers/trips.py`)
- `/itinerary` — Generation, streaming, chat, regen, packing list (`routers/itinerary.py`)
- `/users` — User profile and preferences (`routers/users.py`)
- `/suggest` — AI suggestions (`routers/suggest.py`)
- `/share` — Public share links (`routers/share.py`)

AI logic lives in `app/services/ai/`:
- `itinerary.py` — Two-phase generation: `generate_day_outline()` (Haiku) assigns area/theme per day, then `generate_single_day_stream()` (Sonnet) generates full activity details in parallel, streaming to client
- `chat.py` — `stream_chat_response()` with phase-aware system prompt (pre-trip / in-trip / post-trip)
- `packing.py` — Packing list generation (result cached on the `Itinerary` row)
- `mock.py` — Returns fixed fake data when `MOCK_AI=true`

### Database Models (`app/api/app/models/`)

Four core tables:
- **users** — Auth fields + travel preference fields (home_city, passport_nationality, food_preference, seat_preference, preferred_pace, preferred_styles) + monthly generation cap tracking (`gen_count`, `gen_reset_at`)
- **trips** — Trip metadata, geocoded lat/lng, all user preference inputs, share token, cascade-deletes its itinerary
- **itineraries** — JSON itinerary content, `status` enum (pending/generating/done/failed), cached `packing_list`, model metadata
- **trip_feedback** — Post-trip ratings (overall, itinerary, restaurants, flow, pace) + keep/skip lists

### Frontend Structure (`app/web/src/`)

Route groups:
- `app/(auth)/` — Login, register, password reset, OAuth callback (unauthenticated)
- `app/(app)/` — Dashboard, trips, profile (authenticated, use layout with sidebar)
- `app/share/[token]/` — Public read-only trip view (no auth required)
- `app/blog/` — Static blog posts

Key shared code:
- `lib/api.ts` — Axios client singleton with auth interceptors
- `lib/utils.ts` — Shared utility functions
- `types/index.ts` — All TypeScript interfaces (Trip, Itinerary, User, etc.)
- `hooks/useChatStream.ts` — SSE streaming hook for AI chat
- `hooks/useDayRegenStream.ts` — SSE streaming hook for day regeneration
- `components/itinerary/` — Itinerary tabs including PackingListTab
- `components/chat/` — AI concierge chat UI

### Itinerary Generation (Streaming)

The itinerary endpoint streams Server-Sent Events (SSE) to the frontend. The backend generates the day outline first (fast, Haiku), then streams each day's content in parallel (Sonnet). The frontend accumulates streamed chunks and renders them progressively. `status` on the `Itinerary` row transitions: `pending → generating → done` (or `failed`).

### Generation Cap

Free tier is enforced in `app/api/app/services/generation_cap.py`. Each user gets `FREE_TIER_GEN_LIMIT` (default 5) generations per calendar month. The cap is checked before starting generation and incremented on success.
