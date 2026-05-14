# MyTravel — Phase 2 Implementation Guide

> Implements the Phase 2 feature set from `MyTravel-GapAnalysis-TravelConcierge.md`.
> All changes are in `MyTravel/app/` (the production app, not the demo).

---

## What Was Built

| Feature | Status | Endpoints / Files |
|---|---|---|
| **User Profile** | ✅ Done | `GET/PUT /users/profile` |
| **AI Chat (SSE)** | ✅ Done | `POST /itinerary/{id}/chat` |
| **Single Day Regen** | ✅ Done | `WS /itinerary/generate/{id}/day/{n}` |
| **Smart Packing List** | ✅ Done | `GET /itinerary/{id}/packing-list` |
| **Post-Trip Feedback** | ✅ Done | `GET/PUT /trips/{id}/feedback` |
| **Phase detection** | ✅ Done | `getTripPhase()` in `web/src/lib/utils.ts` |
| **Phase banner** | ✅ Done | Inline in `trips/[id]/page.tsx` |
| **Dashboard phase badges** | ✅ Done | `dashboard/page.tsx` |
| **Profile page** | ✅ Done | `/profile` route |
| **Chat panel (UI)** | ✅ Done | `ChatPanel.tsx` |
| **Packing list tab (UI)** | ✅ Done | `PackingListTab.tsx` |
| **Feedback tab (UI)** | ✅ Done | `FeedbackTab.tsx` |
| **Sidebar profile link** | ✅ Done | `Sidebar.tsx` |

---

## Database Migrations

Two new migration files were created in `api/alembic/versions/`:

### Migration 1 — User profile fields
**File:** `c1a2b3d4e5f6_add_user_profile_fields.py`

Adds 6 nullable columns to the `users` table:
- `home_city` (String 255)
- `passport_nationality` (String 100)
- `food_preference` (String 50)
- `seat_preference` (String 20)
- `preferred_pace` (String 20)
- `preferred_styles` (String 255) — comma-separated, e.g. `"Adventure,Foodie"`

### Migration 2 — Packing list + feedback
**File:** `d2e3f4a5b6c7_add_packing_list_and_feedback.py`

- Adds `packing_list` (Text, nullable) to `itineraries` — caches Claude-generated JSON
- Creates `trip_feedback` table (one row per trip):
  - 5 rating columns: `overall_rating`, `itinerary_rating`, `restaurant_rating`, `flow_rating`, `pace_rating`
  - `keep_list`, `skip_list` (Text — JSON arrays)
  - `notes` (Text)
  - `created_at`, `updated_at` (timestamps)

### How to run migrations

```bash
cd MyTravel/app/api
uv run alembic upgrade head
```

---

## Backend Changes

### New files
| File | Purpose |
|---|---|
| `api/app/services/ai/chat.py` | SSE streaming chat using Haiku, trip-context-aware system prompt |
| `api/app/services/ai/packing.py` | Generates structured packing list JSON, cached in DB |
| `api/app/routers/users.py` | `GET/PUT /users/profile` endpoints |
| `api/app/schemas/feedback.py` | `TripFeedbackIn`, `TripFeedbackOut`, `ChatRequest` schemas |
| `api/alembic/versions/c1a2b3d4e5f6_*.py` | Migration 1 |
| `api/alembic/versions/d2e3f4a5b6c7_*.py` | Migration 2 |

### Modified files
| File | Changes |
|---|---|
| `api/app/models/user.py` | Added 6 profile `Mapped[str\|None]` columns |
| `api/app/models/trip.py` | Added `packing_list` to `Itinerary`; new `TripFeedback` model |
| `api/app/schemas/auth.py` | Added `UserProfileOut`, `UserProfileUpdate` |
| `api/app/routers/itinerary.py` | Added packing-list GET, chat SSE POST, day-regen WebSocket |
| `api/app/routers/trips.py` | Added feedback GET/PUT |
| `api/main.py` | Registered `users.router` at prefix `/users` |

---

## Frontend Changes

### New files
| File | Purpose |
|---|---|
| `web/src/hooks/useChatStream.ts` | SSE hook — `fetch()` + ReadableStream, multi-turn history |
| `web/src/hooks/useDayRegenStream.ts` | WebSocket hook for single-day regeneration |
| `web/src/components/chat/ChatPanel.tsx` | Sliding chat drawer with quick-question suggestions |
| `web/src/components/itinerary/PackingListTab.tsx` | Collapsible categories, checkbox state in localStorage |
| `web/src/components/trips/FeedbackTab.tsx` | Star ratings, keep/skip lists, notes, AI memory preview |
| `web/src/app/(app)/profile/page.tsx` | Profile settings page at `/profile` |

### Modified files
| File | Changes |
|---|---|
| `web/src/types/index.ts` | Added `TripPhase`, `UserProfile`, `PackingList`, `TripFeedback`, `ChatMessage` |
| `web/src/lib/utils.ts` | Added `getTripPhase(trip)` function |
| `web/src/lib/api.ts` | Added `profileApi`, `feedbackApi`, `itineraryApi.getPackingList` |
| `web/src/components/layout/Sidebar.tsx` | Added Profile link in sidebar bottom |
| `web/src/app/(app)/trips/[id]/page.tsx` | Phase banner, Packing + Feedback tabs, floating AI Chat button |
| `web/src/app/(app)/dashboard/page.tsx` | Phase badges on trip cards |

---

## API Reference

### User Profile
```
GET  /users/profile          → UserProfileOut
PUT  /users/profile          body: UserProfileUpdate → UserProfileOut
```

### Packing List
```
GET  /itinerary/{public_id}/packing-list   → PackingList JSON (cached after first call)
```

### AI Chat
```
POST /itinerary/{public_id}/chat
  body: { message: string, history: [{role, content}][], phase: string }
  → text/event-stream  (SSE lines: "data: <text>\n\n" ... "data: [DONE]\n\n")
```

### Single Day Regeneration
```
WS   /itinerary/generate/{public_id}/day/{day_num}?token={jwt}
  Messages received: started | day_chunk | complete | error
```

### Trip Feedback
```
GET  /trips/{public_id}/feedback          → TripFeedbackOut (404 if none)
PUT  /trips/{public_id}/feedback          body: TripFeedbackIn → TripFeedbackOut
```

---

## Phase Detection Logic

```typescript
// web/src/lib/utils.ts
getTripPhase(trip) → "planning" | "pre-trip" | "in-trip" | "post-trip"
```

- `"planning"` — itinerary not yet generated
- `"pre-trip"` — generated + today < start_date
- `"in-trip"` — start_date ≤ today ≤ end_date
- `"post-trip"` — today > end_date

---

## Verification Checklist

1. **Migrations:** Run `uv run alembic upgrade head` → no errors, `trip_feedback` table exists
2. **Profile:** `PUT /users/profile {"home_city":"Toronto"}` → `GET /users/profile` returns it → Navigate to `/profile` in browser, save preferences
3. **Packing list:** Generate a trip → open Packing tab → click "Generate" → list appears → refresh page → list reloaded instantly (cached)
4. **Chat:** Open trip page with generated itinerary → floating "Ask AI" button visible → click → chat panel opens → send a message → response streams in
5. **Day regen:** (WebSocket) — verifiable by checking WS endpoint via wscat or browser devtools
6. **Feedback:** Open Feedback tab on any trip → rate + add items → save → reload → data persists
7. **Phase badges:** Dashboard shows "Pre-Trip" / "Active" / "Completed" badges on trip cards
8. **Phase banner:** Trip page shows context-appropriate banner above tabs (teal for pre-trip, green for in-trip, amber for post-trip)

---

## Phase 3 (Deferred)

The following features are documented in the gap analysis but not yet implemented:

- **Pre-Trip Prep page** — visa, health advisories, checklist, money tips
- **In-Trip Companion page** — live timeline, "what's next" AI guidance, flight monitor
- **Day regeneration UI button** — confirm modal + streaming replacement in DayCard
- **Profile injection into Claude prompts** — pass `home_city`, `food_preference` into itinerary generation system prompt
- **Weather integration on packing** — live Open-Meteo data at packing generation time
- **Structured booking fields** — hotel name, flight numbers on Trip model
