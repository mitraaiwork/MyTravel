# MyTravel — MVP1 Review Build Scope

**Version**: 1.2
**Date**: 2026-03-22
**Status**: For Review
**Purpose**: Define the exact scope of the first build to be shared with free users for feedback — before committing to Phase 2 features.
**Changelog**:
- v1.2 — Added Cottage & Cabin Search to Section 2 (out of MVP1), Section 3 (tease), Section 7 feedback survey Q6, Section 9 build-next table, and Summary Card.
- v1.1 — Added Destination Matchmaker to Section 2 (out of MVP1), Section 3 (tease), Section 7 feedback survey Q6, Section 9 build-next table, and Summary Card.

---

## The One Question MVP1 Must Answer

> *"Is the AI-generated itinerary quality good enough that a real person would use it to plan a real trip?"*

Everything in MVP1 is justified only if it helps answer that question, or if it would be **embarrassing to ship without**. Nothing else gets built yet.

---

## Table of Contents

1. [What's In](#1-whats-in)
2. [What's Deliberately Out](#2-whats-deliberately-out)
3. [What to Tease but Not Build](#3-what-to-tease-but-not-build)
4. [Architecture Simplifications](#4-architecture-simplifications)
5. [Services to Sign Up For Now](#5-services-to-sign-up-for-now)
6. [Services to Skip Until Phase 2](#6-services-to-skip-until-phase-2)
7. [The Feedback Loop](#7-the-feedback-loop)
8. [MVP1 Success Signals](#8-mvp1-success-signals)
9. [What to Build Next Based on Feedback](#9-what-to-build-next-based-on-feedback)

---

## 1. What's In

These are the features that make it into MVP1. Each one earns its place with a clear reason.

---

### ✅ Authentication

| Feature | Why it's in |
|---|---|
| Email + password registration | Minimum viable auth; needed to track usage per user |
| Google OAuth sign-in | Reduces sign-up friction dramatically — the #1 drop-off point for review participants |
| Forgot password / email reset | Without this, anyone who forgets their password emails you directly |
| Basic profile (display name only) | You need to greet them by name somewhere |

**Skip for now:** Apple OAuth (mobile-only, no native app yet), avatar upload, GDPR data export.

---

### ✅ Trip Creation Form

The form is the first step in the "magic moment" — it sets up the AI's context. Ship all inputs. Users who feel the form is incomplete won't trust the output.

| Input | Why it's in |
|---|---|
| Destination (text + geocode) | Core input |
| Start date + end date | Core input |
| Travel style (multi-select: Nature, Food, Culture, Adventure, Relaxation, Nightlife) | Directly shapes AI output — critical for testing |
| Mobility level (Full / Some limitations / Wheelchair accessible) | Low effort to add, high trust signal — shows you thought about accessibility |
| Budget (amount + currency selector) | Core input — users want cost-aware planning |
| Number of travellers + group type | Shapes tone of recommendations |
| Pace (Relaxed / Moderate / Packed) | Users feel heard; AI uses this to adjust activity density |
| Interests free text (optional) | "Vegan food, street art, jazz bars" — this is the differentiating input that makes itineraries feel personal |

**Validation:** All required fields must be clear. The form should take 60 seconds to complete, not 10 minutes.

---

### ✅ AI Itinerary Generation (The Core)

This is the product. Everything else in MVP1 is scaffolding for this.

| Feature | Why it's in |
|---|---|
| Day-by-day itinerary generation | The core value proposition |
| Live streaming — days appear one by one as AI writes them | This is the "wow" moment. A spinner for 45 seconds kills it. |
| Activities sequenced by geographic proximity | This is a key differentiator — users notice when there's no backtracking |
| Each activity: name, time slot, duration, estimated cost, address, map coordinates | The minimum useful card |
| **"Why MyTravel-AI chose this" note** per activity | This is the trust-building feature. It's also what separates you from every other travel app. Put it on every card. |
| Weather context for each day (e.g. "🌧 Rain forecast — indoor options prioritised") | Low effort (Open-Meteo is free, no key needed). High signal — it shows the AI is situationally aware, not just listing generic attractions. |
| Free tier cap: 3 generations / month | Required to enforce the monetisation signal. Display it clearly: "2 of 3 free generations used this month." |
| Generation status bar (e.g. "Generating Day 3 of 5…") | Without this, users don't know if it's working or frozen |
| Graceful error state with retry | Itinerary generation can fail. Users need a clean "something went wrong, try again" state — not a blank screen |

**Skip for now:** Day regeneration (Premium), ARQ job queue (simplify the architecture — see Section 4).

---

### ✅ Itinerary View

Once generated, users need to explore and lightly edit the plan. The view must be good enough that they'd screenshot it or share it.

| Feature | Why it's in |
|---|---|
| Day cards (collapsible) with date, theme, weather summary | Lets users scan the full trip quickly |
| Activity cards: time, name, "why chosen", duration, cost, category badge | The primary content unit |
| Delete an activity | Users will always want to remove something ("I've been to Senso-ji") |
| Reorder activities within a day | Drag-and-drop or up/down arrows — users will want to shift the morning/afternoon order |
| Add a custom activity to a slot | "I already booked a restaurant on Day 2 — let me add it" is an obvious ask |
| Edit activity notes | Users want to annotate ("need to book in advance", "bring cash") |
| Basic Mapbox map — all activities pinned, colour-coded by day | Without the map, you can't show the geographic sequencing advantage. This is core to the value proposition. |
| Tap a pin to see the activity card | Basic usability |
| Trip title (auto-generated, editable) | "Tokyo · Apr 2026" — users want to name their trips |

**Skip for now:** Scenic route visualiser, nearby places search, day-specific map routing. These are enhancements — the basic pin map is sufficient.

---

### ✅ Trip Dashboard

Users need somewhere to return to their trips. Without a dashboard, every generation is throwaway.

| Feature | Why it's in |
|---|---|
| List of past trips (destination, dates, status) | Users will generate 2-3 trips and want to compare them |
| Open and continue editing a past trip | Re-engagement; also needed for the share flow |
| Delete a trip | Basic data hygiene |
| Generation counter display ("2 of 3 free generations used") | Primes users for the Premium upsell conversation without being pushy |

---

### ✅ Public Share Link

This is both a virality feature and an essential usability feature for review participants who want to show a travel partner.

| Feature | Why it's in |
|---|---|
| Generate a public share link for any trip | The most natural way to say "look what this thing made for me" |
| Public view is read-only, no account required | Anyone can open it, which is critical for the viral loop |
| Disable the share link | Users need control; legally important |
| Share link is SEO-friendly URL (`mytravel.app/share/tokyo-apr-2026-[token]`) | Future SEO benefit; also looks professional in a text/email |

---

### ✅ Transactional Email (Minimal)

| Email | Why it's in |
|---|---|
| Welcome email on sign-up | Basic product professionalism |
| Password reset email | Required for email/password auth to work |

**Skip for now:** Trip invite emails, flight alert emails, marketing emails.

---

### ✅ Error Monitoring

Set up Sentry from day one. You will have bugs. You need to know about them before your review users do.

---

## 2. What's Deliberately Out

These features are confirmed **not** in MVP1. Attempting to build them before validating the core will waste weeks and produce something unfocused.

| Feature | Why it's out |
|---|---|
| **Day regeneration** | Premium feature — and you haven't validated the base generation quality yet. Tease it (locked UI). Build it only if users specifically ask. |
| **AI Concierge Chat** | Phase 2/3 Premium feature. Complex to build, expensive per query. Tease it. |
| **AI Packing List** | Premium feature. Users haven't asked for it yet — wait for feedback to confirm demand. |
| **Group collaboration + voting** | Phase 2 feature. Valuable but complex. MVP1 is about validating solo trip planning first. |
| **Budget tracker** | Phase 2. Nice to have — but if the itinerary quality is bad, no one cares about the budget tracker. Validate the core first. |
| **PDF / calendar export** | Phase 2. The public share link serves the same "send this to someone" need for now. |
| **Alternative activity suggestions** | Phase 2. The delete + add custom flow handles the immediate need. |
| **Nearby places search** | Phase 2. Adds complexity; the AI already chose nearby places. |
| **Offline / PWA download** | Phase 2. Review users are at a laptop or connected phone. |
| **Payments (Stripe)** | Not needed for a free review build. Focus entirely on the product. |
| **Mobile native app (Expo)** | The web app is sufficient for review. Ship web first, validate quality, then invest in mobile. |
| **Destination Matchmaker** | Phase 2. High-value conversion tool but not needed to validate itinerary quality — the core MVP1 question. Tease the compare page (locked). Ship after MVP1 confirms users want to plan more trips. |
| **Cottage & Cabin Search** | Phase 2. High-value affiliate revenue feature but completely separate from itinerary quality validation. Tease the nav link (locked). Ship after MVP1 confirms users are planning real trips and have accommodation needs. |
| **Affiliate links** | Phase 2. Don't clutter the itinerary with booking links until the itinerary quality is proven. |
| **Curated itineraries** | Phase 2. A separate product surface that shouldn't distract from the core. |
| **Flight alerts** | Phase 3. |
| **Reviews & ratings** | Phase 3. |
| **Loyalty programme** | Phase 3. |
| **Typesense search** | Phase 2. The geocoder from Mapbox handles destination lookup. |
| **Apple OAuth** | No native iOS app yet — skip. |
| **Admin dashboard** | Not needed until there's content to manage. |

---

## 3. What to Tease but Not Build

Show users the Premium features exist — but lock them. This primes the monetisation conversation and tells you which locked features users click on (PostHog click tracking, or even just asking them).

| Tease | How to show it |
|---|---|
| **Day regeneration** | Show a "↺ Regenerate this day" button on each day card — greyed out with a `✦ Premium` badge. Clicking it shows a "Coming soon for Premium members" tooltip. |
| **AI Concierge Chat** | Show a "Chat with AI about your trip" tab in the itinerary view — locked with the same `✦ Premium` badge. |
| **Packing List** | Show a "Packing List" tab — locked. |
| **PDF Export** | Show an "Export PDF" button in the itinerary actions — locked. |
| **Unlimited generations** | When a user hits 3/3 generations, show a tasteful upgrade prompt: "You've used all 3 free generations this month. Get unlimited access for $9.99/month." (No Stripe yet — just a waitlist/interest form.) |
| **Destination Matchmaker** | Show a "⚖️ Compare Destinations" item in the sidebar — greyed out with a `Coming soon` badge. Clicking shows a brief tooltip: "Can't decide where to go? AI will compare your shortlisted destinations and pick the best fit — coming in the next update." This seeds the concept early, before the feature ships. |
| **Cottage & Cabin Search** | Show a "🏡 Cottages & Cabins" item in the sidebar — locked with a `Coming soon` badge. Clicking shows a brief tooltip: "Planning a cottage or cabin getaway? Browse lakefront retreats, forest hideaways, and mountain lodges — and link them directly to your trip. Coming soon." This primes the feature before it ships and signals that MyTravel covers the full trip, not just city itineraries. |

---

## 4. Architecture Simplifications

The full implementation plan includes ARQ job queues, WebSocket rooms, and async workers. For MVP1, simplify ruthlessly. These simplifications save 2-3 weeks of engineering and are easy to upgrade later.

### Drop the ARQ job queue for now
The full architecture processes itinerary generation as an async background job. For MVP1, stream directly from the FastAPI endpoint using **Server-Sent Events (SSE)** or a **direct WebSocket connection** from the browser to the API. This means:

- No ARQ worker process to manage
- No Redis job queue dependency
- Simpler error handling (the connection failing = the request failed)
- Still shows the streaming day-by-day experience to users

**Upgrade path:** When you have >50 concurrent users, or when Railway starts timing out long HTTP connections, switch to the ARQ queue architecture. The streaming UI stays exactly the same — only the backend plumbing changes.

### Use Open-Meteo instead of OpenWeatherMap (for now)
Open-Meteo is completely free, has no API key, and returns good 7-day forecasts. Swap to OpenWeatherMap later when you need higher precision or more forecast data.

### Skip Redis at launch, add it after the first week
Use the Supabase database as a simple generation counter for the free tier cap. Redis adds operational complexity (another service, another connection). The Supabase `users.gen_count` column is perfectly adequate until you're handling real traffic.

**Upgrade path:** Add Redis/Upstash for caching and rate limiting once you have 50+ daily active users.

### Web only — skip the Expo mobile app
The Next.js web app runs fine on mobile browsers. A mobile-responsive web app is sufficient for the review cohort. Build the native app in Phase 2 after the product is validated.

### Mapbox — basic pins only
Set up Mapbox with pins coloured by day. No routing API calls, no scenic route API calls. Keeps costs at zero (within the free tier) and reduces implementation time significantly.

---

## 5. Services to Sign Up For Now

These are the only services needed to ship MVP1.

| Service | Plan | Monthly Cost | Purpose |
|---|---|---|---|
| **Anthropic API** | Pay-as-you-go | ~$50–$100 | Core AI |
| **Supabase** | Free → Pro ($25) | $0 (dev) / $25 (prod) | Database + Auth |
| **Mapbox** | Free tier | $0 | Maps + geocoding |
| **Open-Meteo** | Free (no key needed) | $0 | Weather |
| **Resend** | Free tier | $0 | Welcome + reset emails |
| **Sentry** | Free tier | $0 | Error monitoring |
| **Railway** | Starter | $20–$40 | FastAPI hosting |
| **Vercel** | Hobby (free) | $0 | Next.js hosting |
| **MVP1 Total** | | **~$70–$165/mo** | |

> You do not need Redis, Stripe, RevenueCat, Google Places, Typesense, Cloudflare R2, PostHog, Amadeus, Firebase, or any affiliate programme for MVP1.

---

## 6. Services to Skip Until Phase 2

Do not sign up for these yet. Signing up early creates noise (unused dashboards, billing to monitor, integrations to maintain) and distracts from shipping.

| Service | When to add |
|---|---|
| Upstash Redis | Phase 2 — when you need caching and proper rate limiting |
| Stripe | Phase 2 — when you're ready to charge money |
| RevenueCat | Phase 2 — when the native mobile app is ready |
| Google Places API | Phase 2 — when you build the nearby places search |
| Typesense | Phase 2 — when you build destination search |
| Cloudflare R2 | Phase 2 — when users can upload photos or download PDFs |
| Open Exchange Rates | Phase 2 — when the budget tracker is built |
| PostHog | Phase 2 — the Tally feedback form and Sentry are sufficient for MVP1 |
| Amadeus | Phase 3 — flight search |
| Firebase FCM | Phase 3 — push notifications |
| All affiliate programmes | Phase 2 — not until itinerary quality is validated and affiliate links are contextually placed |

---

## 7. The Feedback Loop

Don't build a custom feedback system. Use a free tool. The goal is to collect honest opinions in the first 2–4 weeks with minimal overhead.

### Who to share with
- 20–50 people, personally invited — not a public launch
- Mix of: frequent travellers, people planning a real trip in the next 3 months, friends who will be honest
- Avoid: family members who will only say nice things

### How to collect feedback
Create a short Tally.so or Typeform survey. Send the link after users have had 24 hours to try the product. Ask exactly these questions — nothing more:

1. **Did you generate an itinerary?** (Yes / No)
2. **If yes — destination and trip length?** (Free text, optional)
3. **How would you rate the quality of the itinerary?** (1–5 stars)
4. **Would you use this itinerary for a real trip without major changes?** (Yes / Mostly yes / No, needs work)
5. **What was missing or wrong about the itinerary?** (Free text)
6. **Which coming feature interests you most?** (Day regeneration / AI chat / Packing list / Destination Matchmaker — compare 2–3 destinations / Cottage & Cabin Search / Unlimited generations / None)
7. **What's the #1 thing you'd add to the app?** (Free text)
8. **Would you pay for unlimited access?** (Yes, at $9.99/mo / Yes, at $4.99/mo / No / Maybe)

### In-app signal
Add a subtle persistent button in the UI: `💬 Give feedback` → opens the Tally form in a modal. This catches feedback right after a frustrating or delightful moment.

---

## 8. MVP1 Success Signals

The review is successful if you see these signals within 4 weeks:

### Green lights — build Phase 2

| Signal | Target |
|---|---|
| ≥ 70% of respondents rate the itinerary 4 or 5 stars | Quality is good enough |
| ≥ 60% say they'd use the plan for a real trip without major changes | Core value is proven |
| ≥ 40% generate more than one itinerary | Re-engagement; they want to explore more |
| ≥ 25% share the public link with someone | Viral loop is working |
| Multiple users mention the same missing feature unprompted | Clear Phase 2 priority signal |
| ≥ 30% say they'd pay ≥ $9.99/month | Monetisation is viable |

### Yellow flags — fix before Phase 2

| Signal | What it means |
|---|---|
| Users complain itineraries feel generic / not tailored | Prompt engineering needs work — improve before scaling |
| Users confused by the generation form | UX redesign needed; the form is the entry point to everything |
| High bounce rate after first generation | The itinerary view isn't compelling enough; improve the card design |
| Users say it's too slow | Target < 45s for a 5-day trip; if users report feeling like it hangs, add better progress messaging |
| Many users hit the 3-generation cap and complain | Good problem to have — but add a waitlist email capture for Premium |

### Red flags — rethink before proceeding

| Signal | What it means |
|---|---|
| < 40% rate the itinerary 4+ stars | The AI output quality is not there yet — rework the prompts before building any new features |
| Multiple users report the same wrong or nonsensical activity | Structured JSON output validation is failing — fix the Pydantic schema and retry logic |
| < 15% would consider paying | Either the value proposition isn't clear or the quality isn't there |

---

## 9. What to Build Next Based on Feedback

The review data will point you to one of these Phase 2 priorities:

| If users ask for this | Build this next |
|---|---|
| "I want to redo just Day 3" | Day regeneration (first Premium feature to ship) |
| "I want to ask it follow-up questions" | AI Concierge Chat |
| "I can't share it with my travel partner for them to edit" | Group collaboration + shared editing |
| "I want to know what to pack" | AI Packing List |
| "I want to see how much I'm spending" | Budget tracker |
| "I want this on my phone as an app" | Expo mobile app |
| "I want to export this to my calendar" | .ics export (quick win — 1–2 days to build) |
| "The map is too basic" | Day-specific routing + Mapbox Directions API |
| "I can't decide between two destinations" | Destination Matchmaker — AI scores 2–3 candidates across 7 dimensions and recommends the best fit. Free feature, no auth required, high conversion value as a top-of-funnel entry point. |
| "I want to find a cottage or cabin for my trip" | Cottage & Cabin Search — property browse/filter, detail page, "Add to Trip" link, affiliate booking via Vrbo/Airbnb/Booking.com. High affiliate revenue opportunity. Phase 2 feature. |

**The single most important thing to do after the review period:**
Fix whatever the most common complaint is in Question 5 ("what was missing or wrong") **before** adding any new features. Quality compounds — a better core product converts more users than more features layered on a weak base.

---

## Summary Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MVP1 — IN SCOPE                                  │
│                                                                      │
│  ✅ Auth (email + Google OAuth)                                      │
│  ✅ Trip creation form (all 7 inputs)                                │
│  ✅ AI generation with live streaming + weather context              │
│  ✅ "Why MyTravel-AI chose this" note per activity                   │
│  ✅ Itinerary view (day cards + activity cards)                      │
│  ✅ Basic editing (delete, reorder, add custom, add note)            │
│  ✅ Mapbox map — pins by day                                         │
│  ✅ Trip dashboard (past trips)                                      │
│  ✅ Public share link (read-only, no auth required)                  │
│  ✅ Generation counter + cap display (3/month free)                  │
│  ✅ Teased Premium features (locked with ✦ badge)                    │
│  ✅ Welcome + password reset emails                                  │
│  ✅ Sentry error monitoring                                          │
│                                                                      │
│                     OUT OF SCOPE                                     │
│                                                                      │
│  ❌ Day regeneration    ❌ AI chat        ❌ Packing list           │
│  ❌ Destination Matchmaker  ❌ Collaboration  ❌ Payments           │
│  ❌ Cottage & Cabin Search  ❌ Budget tracker  ❌ PDF/calendar export│
│  ❌ Affiliates
│  ❌ Mobile app          ❌ ARQ job queue  ❌ Redis                  │
│  ❌ Typesense           ❌ Curated itineraries  ❌ All Phase 2+     │
│                                                                      │
│  Estimated monthly infra cost: $70 – $165                            │
│  Break-even: 17 Premium subscribers at $9.99                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

*Document version: 1.2 | Last updated: 2026-03-22*
