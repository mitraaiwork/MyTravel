# MyTravel — How AI Powers the Platform

**Version**: 1.2
**Date**: 2026-03-22
**Status**: For Review
**Changelog**:
- v1.2 — Added AI Capability #8: Smart Property Match Scoring for Cottage & Cabin Search (Haiku model, Premium tier, trip-profile-aware scoring of properties)
- v1.1 — Added AI Capability #7: Destination Matchmaker (Haiku model, free tier, structured scoring)

---

## Overview

AI (specifically Anthropic's Claude) is the **core engine** of MyTravel — not a bolt-on feature. It powers 8 distinct capabilities across the platform. Without AI, MyTravel is just another trip organizer. With it, the platform becomes a personal travel concierge.

---

## AI Capabilities

### 1. Itinerary Generation
**The primary product feature.**

Claude receives the user's inputs and generates a complete, coherent day-by-day travel plan:

**Inputs provided to Claude:**
- Destination, start date, end date
- Travel style (nature, food, culture, adventure, relaxation, nightlife)
- Mobility level (full, limited, wheelchair)
- Total budget and currency
- Number of travelers and group type
- Pace preference (relaxed, moderate, packed)
- Live weather forecast for the trip dates

**What Claude produces:**
- Time-slotted activities for each day (morning / afternoon / evening)
- Activities sequenced by **geographic proximity** to minimize backtracking
- Estimated **duration and cost** per activity
- A **"Why I chose this"** note per activity — builds user trust and transparency
- Results **streamed day-by-day** so the UI renders in real time rather than waiting for the full plan

**Model used**: `claude-sonnet-4-6` — selected for best-in-class structured JSON output quality and long-context handling.

---

### 2. Single-Day Regeneration
After the initial plan is created, users can ask Claude to **redo just one day** without touching the rest of the itinerary.

Example triggers:
- "Make Day 3 more food-focused"
- "Day 2 is too packed — slow it down"
- "Replace all paid attractions on Day 5 with free alternatives"

This preserves the user's edits on other days while refreshing the specific day they're unhappy with.

---

### 3. AI Concierge Chat *(Premium feature)*
A streaming chat interface where Claude has the **full itinerary injected as context**. The concierge knows exactly what's planned, where the user is going, and what their preferences are.

**Example interactions:**
- *"Find a vegetarian restaurant near my Day 2 morning stop"*
- *"What should I pack for rain in Tokyo in March?"*
- *"Swap dinner on Day 4 for something under €30 near the hotel"*
- *"Is there anything kid-friendly near the museum on Day 1?"*

The concierge can answer questions and, in a later phase, directly modify the itinerary in response to chat instructions.

**Model used**: `claude-haiku-4-5` — fast and cost-efficient for conversational back-and-forth.

---

### 4. Packing List Generation *(Premium feature)*
Claude generates a **categorized packing list** tailored specifically to the trip rather than a generic template.

**Context Claude uses:**
- Destination and climate
- Planned activity types (hiking, beach, city walking, fine dining)
- Trip duration
- Weather forecast
- Traveler count and group type (family with kids, couple, solo)

**Output**: A grouped checklist (clothing, documents, toiletries, tech, activity-specific gear) with essential items flagged.

---

### 5. Alternative Activity Suggestions
When a user removes an activity from the itinerary, Claude suggests **contextually relevant replacements** — not random alternatives, but options that fit:
- The same neighborhood or area
- The same time slot duration
- A similar category and price range
- The overall vibe of that day

---

### 6. AI Similarity Recommendations *(Phase 3)*
Past itineraries are stored as **vector embeddings** using the pgvector extension on PostgreSQL. This enables a *"Trips you might like"* recommendation engine on the user dashboard.

How it works:
1. Each generated itinerary is embedded (via Claude or a dedicated embedding model)
2. Embeddings are stored in the `places_cache` and trip tables
3. When a user returns, pgvector finds trips with similar embedding profiles
4. Recommendations surface destinations, styles, and activities aligned with their travel history

---

### 7. Destination Matchmaker *(Phase 2 · Free feature)*
When a user is undecided between 2–3 candidate destinations, Claude compares them side-by-side and recommends the best fit for their specific trip context.

**The problem it solves**: Users who can't decide where to go often abandon the planning process entirely. This feature removes the decision paralysis and converts undecided browsers into committed trip planners.

**Inputs provided to Claude:**
- 2–3 destination names
- Travel month (for weather context)
- Trip duration
- Budget level (budget / moderate / comfortable / luxury)
- Group type (solo / couple / friends group / family)
- Top priority (best value / weather / culture & food / adventure / relaxation / nightlife)

**What Claude produces:**
- A score (1–10) for each destination across 7 dimensions: weather fit for the given month, budget fit, activity match against the stated priority, crowd level, cultural depth, food scene, and visa/entry ease
- A weighted overall score per destination
- A single recommended winner with a reasoning paragraph explaining exactly why it wins for these preferences
- 3 pros and 1 consideration per destination, tailored to the user's stated context
- Quick-fact data per destination (estimated daily cost, typical weather, approximate flight details)

**Key design decision — no auth required**: The comparison runs without a login. This makes it a top-of-funnel conversion tool. After seeing the recommendation, the "Plan this trip →" CTA takes the user into the trip creation form pre-filled with the winning destination — the first step toward account creation.

**Model used**: `claude-haiku-4-5` — the comparison is a structured scoring task, not open-ended generation. Haiku handles it accurately at a fraction of Sonnet's cost (~$0.001–$0.002 per comparison).

**Caching**: Results for the same input combination (destinations + month + budget + group type + priority) can be cached in Redis for 6 hours to eliminate redundant API calls for popular destination pairs.

---

### 8. Smart Property Match Scoring *(Phase 2 · Premium feature)*
When a user is browsing Cottage & Cabin Search results with an active trip, Claude scores each property against their trip profile and returns a ranked match percentage with a brief explanation. This removes the cognitive load of comparing raw listings and makes the Premium tier feel genuinely valuable even in the browse/planning phase.

**The problem it solves**: Users browsing 40+ cottage listings across a page of results struggle to mentally connect property attributes (lakefront, 4 bedrooms, dog-friendly) with the specifics of their planned trip (8-person family trip to Muskoka, relaxation + nature style, budget of $350/night). A match score surfaces the best-fit properties instantly.

**Inputs provided to Claude:**
- Trip profile: destination region, travel style, group size, group type, trip dates, budget level
- Up to 20 property summaries from the search results (name, type, location, price/night, amenities[], setting[], bedrooms, max guests)

**What Claude produces:**
- A match score (0–100) for each property, reflecting how well it fits the trip's style, group size, amenities needs, budget, and geographic context
- A 1-sentence reasoning per top-scoring property (e.g., "Lakefront, 4-bedroom setup matches your 8-person family trip — fireplace and canoes align with your Nature + Relaxation style")
- A suggested sort order (highest-match-first) surfaced as a "Best for your trip" badge on results

**Key design decisions:**
- Results are returned as a batch (one API call scores all 20 properties) rather than per-property calls — keeps latency low (~1–2s) and cost minimal
- Match scores are ephemeral (not persisted) by default; recalculated on each search since trip profiles evolve
- Only available to Premium users — match scoring is a clear, high-value differentiator that justifies the subscription

**Model used**: `claude-haiku-4-5` — structured scoring task; batch input of property summaries with JSON output. Approx. $0.002–$0.005 per scored page of 20 results.

**Caching**: Property search results (not match scores) cached in `cottage_properties` table with 24h TTL. Match scores themselves are not cached — they depend on the user's current trip profile.

---

## AI Architecture

```
User inputs trip details
        │
        ▼
POST /trips/:id/generate
        │
        ▼  (returns jobId immediately — async)
ARQ Job Queue
        │
        ▼
itinerary_generation.py (ARQ worker)
        │
        ├── Fetch weather forecast (OpenWeatherMap API)
        │
        ├── Build system prompt
        │   (destination + dates + style + mobility + budget + weather)
        │
        ├── Call Claude API (claude-sonnet-4-6)
        │   └── Streaming response, structured JSON output
        │
        ├── Parse + validate each day against Pydantic schema
        │
        ├── Save day to PostgreSQL as it arrives
        │
        └── Broadcast via WebSocket → UI renders each day live
                │
                ▼
        generation_complete event → user sees full itinerary
```

**Destination Matchmaker flow (synchronous — no job queue needed):**
```
User enters 2–3 destinations + preferences
        │
        ▼
POST /compare/destinations  (no auth required)
        │
        ▼
destination_compare.py
        │
        ├── Build structured comparison prompt
        │   (destinations + month + budget + group type + priority)
        │
        ├── Check Redis cache (6h TTL on identical inputs)
        │   └── Cache hit → return immediately, no API call
        │
        ├── Call Claude API (claude-haiku-4-5)
        │   └── Synchronous response, structured Pydantic JSON output
        │   └── ~1–3 seconds response time
        │
        ├── Parse + validate CompareResponse schema
        │
        ├── Optionally write to destination_comparisons table (if user is logged in)
        │
        └── Return scores, winner, reasoning, quickFacts, comparisonTable
                │
                ▼
        UI animates score bars → winner card highlighted → "Plan this trip" CTA
```

---

## Cost Controls

AI is the most expensive component of the platform. The following controls are built into the architecture from day one:

| Control | Implementation | Purpose |
|---|---|---|
| **Request caching** | Hash input params → Redis key (24h TTL). Identical requests skip Claude entirely | Eliminate duplicate API calls |
| **Model tiering** | `claude-sonnet-4-6` for itinerary generation; `claude-haiku-4-5` for chat, packing lists, and destination comparison | Haiku is ~10× cheaper for simpler tasks |
| **Async job queue** | ARQ processes generation in background workers | Prevents HTTP timeouts; enables retries on failure |
| **Free tier cap** | Redis counter `user:{id}:gen_count:{month}` — max 3 generations/month on free tier | Limits cost exposure from non-paying users |
| **Comparison caching** | Hash destination + preference params → Redis key (6h TTL) | Popular pairs (Tokyo vs Bali vs Paris) served from cache; near-zero marginal cost |
| **Token budgets** | `max_tokens` set per API call; graceful partial failure if limit hit | Prevents runaway costs on edge cases |
| **Extended thinking** | Opt-in only for complex multi-city itineraries (Phase 2+) | Reserved for cases where quality uplift justifies cost |
| **Spend alerting** | Anthropic API usage dashboard + custom alert when daily spend exceeds threshold | Early warning before overruns become significant |

---

## Prompt Strategy

The itinerary generation prompt is the most critical piece of engineering in the product. Key principles:

1. **Strict JSON schema** — the full Zod schema structure is embedded in the prompt so Claude outputs machine-parseable, validated JSON every time
2. **Geographic sequencing instruction** — Claude is explicitly told to order activities to minimize travel time within each day
3. **Transparency field** — a `why_chosen` field is required per activity so users understand the reasoning, not just the result
4. **Weather awareness** — the current forecast is injected so Claude can suggest indoor alternatives on rainy days and outdoor highlights on clear days
5. **Constraint respect** — mobility level, budget ceiling, and pace preference are stated as hard constraints, not suggestions

---

## Summary

| Capability | Model | Phase | Tier |
|---|---|---|---|
| Itinerary generation | claude-sonnet-4-6 | MVP | Free (3/mo) + Premium (unlimited) |
| Day regeneration | claude-sonnet-4-6 | MVP | Premium |
| Concierge chat | claude-haiku-4-5 | Phase 3 | Premium |
| Packing list | claude-haiku-4-5 | Phase 2 | Premium |
| Alternative suggestions | claude-haiku-4-5 | Phase 2 | Free + Premium |
| Similarity recommendations | Embedding model + pgvector | Phase 3 | Free + Premium |
| **Destination Matchmaker** | **claude-haiku-4-5** | **Phase 2** | **Free (no cap, no auth required)** |
| **Smart Property Match Scoring** | **claude-haiku-4-5** | **Phase 2** | **Premium** |

---

*Document version: 1.2 | Last updated: 2026-03-22*
