# MyTravel — Product Requirements Document (PRD)

**Version**: 1.5
**Date**: 2026-03-22
**Status**: Approved
**Owner**: Product Team
**Changelog**:
- v1.5 — Added FR-15 Cottage & Cabin Search feature (property browsing with search + filter, property detail page, "Add to Trip" integration, AI property match scoring via Haiku, affiliate booking through Vrbo/Airbnb/Booking.com; Phase 2; free tier for browsing; new DB tables `cottage_properties`, `trip_accommodations`, `saved_properties`; new API routes under `/cottages/` and `/trips/:id/accommodation`); added Persona 5 (The Cottage Vacationer); updated monetization and architecture sections accordingly
- v1.4 — Added FR-14 Destination Matchmaker feature (AI-powered side-by-side comparison of 2–3 destinations; free tier; Haiku model; `/compare/destinations` endpoint; `destination_comparisons` DB table)
- v1.3 — Tech stack updated: backend changed from Fastify (Node.js) to FastAPI (Python); ORM changed from Drizzle to SQLAlchemy 2.0 + Alembic; job queue changed from BullMQ to ARQ; type sharing updated to OpenAPI spec → openapi-typescript
- v1.2 — Added Section 14: Marketing & Go-to-Market Strategy; updated KPIs with marketing metrics
- v1.1 — Added FR-13 Curated Tour Itineraries feature (tiered access for non-members, members, and Premium)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas](#3-user-personas)
4. [User Journey Maps](#4-user-journey-maps)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Tech Stack Decisions](#8-tech-stack-decisions)
9. [Database Schema](#9-database-schema)
10. [API Specification](#10-api-specification)
11. [Implementation Plan (Phased Roadmap)](#11-implementation-plan-phased-roadmap)
12. [Development Workflow](#12-development-workflow)
13. [Monetization Model](#13-monetization-model)
14. [Marketing & Go-to-Market Strategy](#14-marketing--go-to-market-strategy)
15. [Success Metrics & KPIs](#15-success-metrics--kpis)
16. [Risk Register](#16-risk-register)
17. [Open Questions & Decisions](#17-open-questions--decisions)

---

## 1. Executive Summary

**MyTravel** is an AI-powered travel platform that generates personalized, day-by-day itineraries and acts as an intelligent local concierge. Users input their destination, dates, travel style, and preferences — MyTravel does the rest: crafting time-slotted plans, surfacing the best local food, nature, and culture, and adapting recommendations to weather, mobility, and budget.

The platform launches as a **web app and mobile app (iOS + Android)** sharing a single backend API. Monetization is built in from day one through a freemium subscription model, affiliate bookings, and sponsored local listings.

**Target market**: Independent and semi-independent travelers aged 22–45 who want smart, personalized travel experiences without spending hours on research.

**Competitive differentiation**: Unlike TripAdvisor (reviews-first) or Google Travel (search-first), MyTravel is **generation-first** — the AI builds a complete, coherent plan and lets users refine it, rather than expecting users to assemble pieces themselves.

---

## 2. Product Vision & Goals

### Vision Statement
> *"MyTravel makes every trip feel like it was planned by a local friend who knows everything."*

### Business Goals

| Goal | Target | Timeline |
|---|---|---|
| Reach 10,000 registered users | 10,000 users | 6 months post-launch |
| Achieve $5,000 MRR | ~500 Premium subscribers | 9 months post-launch |
| App Store rating | ≥ 4.5 stars | Within 3 months |
| Affiliate revenue | $2,000/month | 12 months post-launch |
| Itinerary generation success rate | ≥ 95% | MVP launch |

### Product Goals

- Deliver a complete, usable AI itinerary in under 60 seconds
- Make trip planning require **zero external tools** (no switching to Google Maps, TripAdvisor, or spreadsheets)
- Enable group travel coordination natively
- Support offline access — travelers often have poor connectivity abroad

---

## 3. User Personas

### Persona 1 — "The Independent Explorer" (Primary)
**Name**: Maya, 28, Marketing Manager
**Travel frequency**: 4–6 trips/year
**Pain points**:
- Spends 10+ hours researching each trip across 5+ tabs
- Keeps losing saved places across browser bookmarks, Google Maps lists, and notes apps
- Misses hidden gems because she only finds what's in the top 10 lists

**Goals**:
- Get a solid starting itinerary fast, then customize
- Discover non-touristy restaurants and experiences
- Share the plan with a travel partner easily

**Devices**: iPhone primary, MacBook for research

---

### Persona 2 — "The Group Trip Organizer" (Secondary)
**Name**: David, 34, Software Engineer
**Travel frequency**: 2–3 group trips/year
**Pain points**:
- Coordinating 6 people's preferences is a nightmare via WhatsApp
- Someone always disagrees with activity choices — no neutral arbitration
- Splits and budgets tracked in messy Google Sheets

**Goals**:
- Invite friends to a shared trip and let everyone vote on activities
- Track shared budget in one place
- Export the final plan to everyone's calendar

**Devices**: Android + Windows

---

### Persona 3 — "The Family Planner" (Secondary)
**Name**: Sarah, 42, Teacher
**Travel frequency**: 1–2 family trips/year
**Pain points**:
- Planning with kids requires mobility/accessibility filters mainstream apps lack
- Needs to balance adult and child-friendly activities
- Worried about over-scheduling

**Goals**:
- Filter by family-friendly and mobility requirements
- Get time-buffered plans that account for slower pace
- Generate a packing list for the whole family

**Devices**: iPad + iPhone

---

### Persona 4 — "The Business Traveler" (Opportunistic)
**Name**: James, 39, Consultant
**Travel frequency**: 20+ trips/year
**Pain points**:
- Needs to find good restaurants fast during 1-day stopovers
- Wants to know what's walkable from the hotel
- No time to plan — needs instant recommendations

**Goals**:
- Fast "what to do in 4 hours near [location]" answers
- Premium features worth paying for given frequent travel
- Calendar export to corporate calendar

**Devices**: iPhone + MacBook

---

### Persona 5 — "The Cottage Vacationer" (New · Phase 2)
**Name**: Jennifer, 38, Nurse
**Travel frequency**: 1–3 cottage / cabin trips per year, usually with extended family or a group of friends
**Pain points**:
- Plans her trips on MyTravel but has to leave the app entirely to search for a cottage across VRBO, Airbnb, and Cottage.ca in separate browser tabs
- Hard to compare properties across platforms when dates, guest counts, and amenities are scattered across different UIs
- Forgets which cottage she shortlisted by the time she's back in her itinerary planning context

**Goals**:
- Find a lakefront cottage or forest cabin in the same place she plans the rest of her trip
- Filter by key requirements (private dock, pet-friendly, fireplace, enough bedrooms for 8 people) without wading through irrelevant results
- Link the chosen cottage to her MyTravel itinerary so it appears alongside her AI-generated day plans

**Devices**: iPhone primary, iPad for evening browsing

---

## 4. User Journey Maps

### Core Journey: First-Time Itinerary Generation

```
AWARENESS          ACQUISITION         ACTIVATION          RETENTION
    │                   │                   │                   │
    ▼                   ▼                   ▼                   ▼
User sees a       Lands on             Creates account     Returns to view
shared trip on    marketing page       (OAuth or email)    saved trip
social media      ──────────────►      ──────────────►     ──────────────►
    │             Sees demo of AI      Enters destination,  Edits itinerary,
    │             generating a trip    dates, style         adds notes
    ▼                   │                   │                   │
Google search          ▼                   ▼                   ▼
"AI travel       Clicks "Plan my      Generation runs     Shares trip
planner"         trip free"           (streaming, ~45s)   with friend
                                           │                   │
                                           ▼                   ▼
                                      Sees day-by-day     Friend opens
                                      plan + map           share link,
                                           │               signs up
                                           ▼                   │
                                      Taps "Book tour"    REFERRAL LOOP
                                      (affiliate click)
```

### Group Trip Journey

```
Organizer creates trip
        │
        ▼
Invites friends via email link
        │
        ▼
AI generates base itinerary
        │
        ▼
Each member votes on activities (👍 👎)
        │
        ▼
AI rebalances plan based on votes
        │
        ▼
Organizer approves final plan
        │
        ▼
Everyone exports to their calendar
        │
        ▼
Trip happens → post-trip review prompted
```

---

## 5. Functional Requirements

### FR-1: Authentication & User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Users can register with email + password | Must Have |
| FR-1.2 | Users can sign in with Google OAuth | Must Have |
| FR-1.3 | Users can sign in with Apple OAuth | Must Have |
| FR-1.4 | Forgot password / email reset flow | Must Have |
| FR-1.5 | User profile: display name, avatar, preferred currency | Should Have |
| FR-1.6 | Account deletion with data export (GDPR) | Must Have |

---

### FR-2: Trip Creation

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | User inputs: destination (text + geocode), start date, end date | Must Have |
| FR-2.2 | Travel style multi-select: Nature, Food, Culture, Adventure, Relaxation, Nightlife | Must Have |
| FR-2.3 | Mobility level select: Full mobility, Some limitations, Wheelchair accessible only | Must Have |
| FR-2.4 | Budget input: total budget + currency selector | Should Have |
| FR-2.5 | Interests free-text (optional): e.g., "vegan food", "street art", "WWII history" | Should Have |
| FR-2.6 | Number of travelers + group type (solo, couple, family, friends) | Should Have |
| FR-2.7 | Pace preference: Relaxed / Moderate / Packed | Should Have |

---

### FR-3: AI Itinerary Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | AI generates a day-by-day itinerary with time slots (morning / afternoon / evening) | Must Have |
| FR-3.2 | Activities are sequenced to minimize geographic backtracking within each day | Must Have |
| FR-3.3 | Each activity includes: name, description, address, lat/lng, estimated duration, estimated cost | Must Have |
| FR-3.4 | Weather forecast for trip dates is factored into suggestions | Should Have |
| FR-3.5 | Generation runs asynchronously; UI shows streaming day-by-day progress | Must Have |
| FR-3.6 | Generation completes in < 90 seconds for a 7-day trip | Must Have |
| FR-3.7 | Free tier: 3 generations/month. Premium: unlimited | Must Have |
| FR-3.8 | User can regenerate a single day without regenerating the whole trip | Should Have |
| FR-3.9 | User can add a custom activity to any time slot | Must Have |
| FR-3.10 | User can remove, reorder, or swap any activity | Must Have |
| FR-3.11 | Each activity shows a "Why Claude chose this" note | Should Have |

---

### FR-4: Maps & Local Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Interactive map showing all activities pinned, grouped by day | Must Have |
| FR-4.2 | Tap a pin to see activity detail card | Must Have |
| FR-4.3 | Day-specific map showing only that day's route | Should Have |
| FR-4.4 | Scenic route visualizer: show the suggested travel path between activities | Should Have |
| FR-4.5 | Nearby places discovery: restaurants, attractions, transport within radius | Should Have |
| FR-4.6 | Each place card shows: name, category, rating, price level, opening hours, photos | Should Have |
| FR-4.7 | User can search for a place and add it directly to an itinerary slot | Should Have |
| FR-4.8 | Sponsored places clearly labeled with "Sponsored" badge | Must Have |

---

### FR-5: Collaboration & Sharing

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Trip owner can invite collaborators by email | Should Have |
| FR-5.2 | Collaborator roles: Viewer, Editor, Owner | Should Have |
| FR-5.3 | Real-time collaborative editing (changes broadcast to all connected members) | Should Have |
| FR-5.4 | Group members can vote 👍 / 👎 on any activity | Should Have |
| FR-5.5 | Vote summary visible per activity | Should Have |
| FR-5.6 | Owner can generate a public share link (read-only view) | Must Have |
| FR-5.7 | Public share link is SEO-friendly with trip title/destination in the URL | Should Have |
| FR-5.8 | User can disable the public share link at any time | Must Have |

---

### FR-6: Budget Tracker

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Budget tracker with categories: Accommodation, Food, Transport, Activities, Shopping, Other | Should Have |
| FR-6.2 | Planned vs. actual spend per category | Should Have |
| FR-6.3 | Multi-currency support with real-time exchange rates | Should Have |
| FR-6.4 | AI activities auto-populate planned amounts (from estimated costs) | Should Have |
| FR-6.5 | User can record actual spend and upload receipt photo | Could Have |
| FR-6.6 | Budget summary: total spent, remaining, variance | Should Have |

---

### FR-7: Packing List

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Manual packing list with category grouping | Should Have |
| FR-7.2 | AI-generated packing list based on trip profile (destination, dates, weather, activities) | Should Have |
| FR-7.3 | Items can be marked as packed / unpacked | Should Have |
| FR-7.4 | Essential items flagged | Should Have |
| FR-7.5 | List syncs across devices | Should Have |

---

### FR-8: Export & Calendar Sync

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | Export full itinerary as PDF (Premium) | Should Have |
| FR-8.2 | Export as `.ics` calendar file compatible with Google Calendar, Apple Calendar, Outlook | Should Have |
| FR-8.3 | Google Calendar deep-link (add each day's activities directly) | Could Have |

---

### FR-9: AI Concierge Chat (Premium)

| ID | Requirement | Priority |
|---|---|---|
| FR-9.1 | Streaming AI chat interface attached to a specific trip | Should Have |
| FR-9.2 | Chat context includes full itinerary, destination, dates, preferences | Must Have (if feature built) |
| FR-9.3 | Concierge can modify itinerary on request ("swap dinner on Day 3 for something vegetarian") | Could Have |
| FR-9.4 | Suggested prompt chips: common questions pre-populated | Should Have |
| FR-9.5 | Chat history persists per trip | Should Have |

---

### FR-10: Flight Alerts (Phase 3)

| ID | Requirement | Priority |
|---|---|---|
| FR-10.1 | User links a flight number + date to their trip | Could Have |
| FR-10.2 | System polls flight status every 30 minutes | Could Have |
| FR-10.3 | Push notification + in-app alert if flight is delayed or gate changes | Could Have |
| FR-10.4 | Email alert as fallback | Could Have |

---

### FR-11: Reviews & Ratings (Phase 3)

| ID | Requirement | Priority |
|---|---|---|
| FR-11.1 | Post-trip review prompted after trip end date passes | Could Have |
| FR-11.2 | Rate: overall experience, itinerary accuracy, local recommendations | Could Have |
| FR-11.3 | Written review + photo upload | Could Have |
| FR-11.4 | Reviews visible on public trip share pages | Could Have |

---

### FR-12: Monetization Features

| ID | Requirement | Priority |
|---|---|---|
| FR-12.1 | Stripe subscription checkout for Premium (web) | Must Have |
| FR-12.2 | Apple IAP + Google Play Billing for Premium (mobile) via RevenueCat | Must Have |
| FR-12.3 | Affiliate link click tracking before redirect | Must Have |
| FR-12.4 | Sponsored listing flagging in discovery results | Must Have |
| FR-12.5 | Loyalty points earned on key actions | Should Have |
| FR-12.6 | Loyalty points redeemable for Premium access and partner discounts | Should Have |
| FR-12.7 | Curated itinerary purchase flow for non-members and members | Must Have |

---

### FR-13: Curated Tour Itineraries

Pre-built, expert-crafted itineraries for specific tours and destinations — available for purchase. These are **not AI-generated on demand**; they are authored and maintained by MyTravel's content team or verified local experts.

#### FR-13.1 — Catalog & Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-13.1.1 | A publicly accessible catalog of curated itineraries, browsable without an account | Must Have |
| FR-13.1.2 | Each listing shows: title, destination, duration, tour type, preview cover image, price, short description, and sample day | Must Have |
| FR-13.1.3 | Catalog filterable by: destination, duration, travel style, price, rating | Should Have |
| FR-13.1.4 | Search within the catalog by destination name or keyword | Should Have |
| FR-13.1.5 | "Best seller", "New", and "Staff Pick" badges on listings | Could Have |

#### FR-13.2 — Access Tiers

| User Type | Access |
|---|---|
| **Non-member** (no account) | Full-price purchase only |
| **Member** (registered, free tier) | First 5 curated itineraries free; member-discounted price thereafter |
| **Premium subscriber** | All curated itineraries included — no additional purchase required |

| ID | Requirement | Priority |
|---|---|---|
| FR-13.2.1 | Non-members can purchase any curated itinerary at full price (Stripe guest checkout — no account required) | Must Have |
| FR-13.2.2 | On purchase, non-members are prompted (not forced) to create a free account to access their itinerary | Should Have |
| FR-13.2.3 | Registered members receive their first 5 curated itineraries at no cost | Must Have |
| FR-13.2.4 | Member free allowance tracked: `curated_free_used` counter on the user record | Must Have |
| FR-13.2.5 | After 5 free uses, members are offered the member-discounted price (e.g., 40% off full price) | Must Have |
| FR-13.2.6 | Premium subscribers have unlimited access to all curated itineraries with no purchase required | Must Have |
| FR-13.2.7 | Pricing is clearly displayed per tier on each listing: Full price / Member price / Premium (included) | Must Have |
| FR-13.2.8 | Member free allowance resets annually (not monthly) | Should Have |

#### FR-13.3 — Purchase & Access

| ID | Requirement | Priority |
|---|---|---|
| FR-13.3.1 | Web purchase via Stripe Checkout (one-time payment, not subscription) | Must Have |
| FR-13.3.2 | Mobile purchase via Apple IAP / Google Play Billing through RevenueCat | Must Have |
| FR-13.3.3 | Purchase grants permanent access to that itinerary — never expires | Must Have |
| FR-13.3.4 | Purchased itineraries accessible in a "My Library" section of the user dashboard | Must Have |
| FR-13.3.5 | User can import a purchased curated itinerary as a trip and then customize it | Must Have |
| FR-13.3.6 | Imported curated itinerary becomes a standard trip — user can edit, add, or remove items | Must Have |
| FR-13.3.7 | Curated itineraries can be previewed (Day 1 visible) before purchase | Should Have |
| FR-13.3.8 | Gift a curated itinerary to another user by email | Could Have |

#### FR-13.4 — Content Management (Admin)

| ID | Requirement | Priority |
|---|---|---|
| FR-13.4.1 | Admin dashboard to create, edit, publish, and unpublish curated itineraries | Must Have |
| FR-13.4.2 | Admin can set full price, member price (or % discount), and whether Premium includes it | Must Have |
| FR-13.4.3 | Admin can tag itineraries with destination, travel style, duration, difficulty | Must Have |
| FR-13.4.4 | Admin can see purchase count and revenue per itinerary | Should Have |
| FR-13.4.5 | Support for external contributor/author attribution on each itinerary | Could Have |

---

### FR-14: Destination Matchmaker

An AI-powered comparison tool that helps undecided users choose between 2–3 destination candidates. The user provides the destinations and their trip context; MyTravel-AI scores each across multiple dimensions and returns a ranked recommendation with reasoning.

**Tier**: Free — available to all users (registered and non-registered). No generation cap. This feature drives trip creation conversions and is a discovery/pre-planning tool.

**AI model**: `claude-haiku-4-5` — structured comparison, not full itinerary generation.

#### FR-14.1 — Input

| ID | Requirement | Priority |
|---|---|---|
| FR-14.1.1 | User can enter 2 to 3 destination names to compare | Must Have |
| FR-14.1.2 | User specifies trip context: travel month, duration, budget level, group type, and top priority (e.g. culture & food, best value, weather, adventure) | Must Have |
| FR-14.1.3 | All fields pre-populated with sensible defaults to reduce friction | Should Have |
| FR-14.1.4 | Third destination slot is optional — comparison works with 2 destinations | Must Have |
| FR-14.1.5 | Non-registered users can run a comparison from the landing page (no auth required) | Should Have |

#### FR-14.2 — AI Scoring & Output

| ID | Requirement | Priority |
|---|---|---|
| FR-14.2.1 | AI scores each destination across 7 dimensions: weather fit for the given month, budget fit, activity match against stated priority, crowd level, cultural depth, food scene, visa/entry ease | Must Have |
| FR-14.2.2 | Each dimension scored 1–10; weighted overall score calculated and displayed | Must Have |
| FR-14.2.3 | A single winning destination is declared with a brief AI reasoning paragraph explaining why it wins for these specific preferences | Must Have |
| FR-14.2.4 | Each destination card lists 3 pros and 1 consideration specific to the user's stated preferences | Should Have |
| FR-14.2.5 | Quick-fact summary per destination: estimated daily cost for the group type, typical weather for the travel month, approximate flight duration and cost from a major hub | Should Have |
| FR-14.2.6 | A full side-by-side comparison table is presented below the score cards | Should Have |
| FR-14.2.7 | "Plan this trip" CTA on each destination card links directly to the trip creation form pre-filled with that destination | Must Have |

#### FR-14.3 — Performance & UX

| ID | Requirement | Priority |
|---|---|---|
| FR-14.3.1 | Comparison result returned in under 5 seconds | Must Have |
| FR-14.3.2 | A loading state with per-destination animation is shown while the AI processes | Must Have |
| FR-14.3.3 | Score bars animate in after results appear (progressive reveal) | Should Have |
| FR-14.3.4 | User can adjust preferences and re-run the comparison without re-entering destinations | Should Have |
| FR-14.3.5 | Comparison results are ephemeral — not persisted by default (no DB write required for MVP) | Must Have |
| FR-14.3.6 | Optional: logged-in users can save a comparison to their dashboard for later reference | Could Have |

#### FR-14.4 — Integration

| ID | Requirement | Priority |
|---|---|---|
| FR-14.4.1 | Accessible from: main navigation sidebar, dashboard "quick actions", and new-trip creation form ("Not sure where to go?" prompt) | Must Have |
| FR-14.4.2 | Landing page features Destination Matchmaker as a named free feature in the features section | Should Have |
| FR-14.4.3 | From the completed-trip Memories tab, a returning user can use a past destination as one of the comparison candidates (pre-fill from trip history) | Could Have |

---

### FR-15: Cottage & Cabin Search

A property search and discovery feature that lets users browse, filter, and save cottage and cabin rentals — lakefront retreats, forest hideaways, mountain chalets, treehouses, and farmhouses — without leaving MyTravel. Properties can be linked directly to a trip itinerary and booked through affiliate partner platforms.

**Tier**: Free — browsing, searching, saving, and "Add to Trip" are available to all registered users. AI property match scoring is a Premium feature.

**Revenue model**: Affiliate commission on booking clicks routed through Vrbo, Airbnb, and Booking.com affiliate programmes (~3–8% of booking value). High average booking values ($1,500–$4,000/week for Ontario cottage country) make this a significant affiliate revenue opportunity even at modest click volumes.

**Phase**: 2

#### FR-15.1 — Search & Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-15.1.1 | User can search for properties by location name (e.g., "Muskoka", "Blue Mountains", "Ucluelet") | Must Have |
| FR-15.1.2 | User specifies check-in date, check-out date, and number of guests | Must Have |
| FR-15.1.3 | Results are displayed as a card grid, each showing: property name, location, star rating, review count, key stats (bedrooms, bathrooms, max guests), up to 3 amenity tags, and price per night | Must Have |
| FR-15.1.4 | A map view toggle shows all results pinned on an interactive Mapbox map; clicking a pin surfaces the property card | Should Have |
| FR-15.1.5 | Results are sortable by: Recommended, Price (low to high), Price (high to low), Rating, Newest | Should Have |
| FR-15.1.6 | Pagination or infinite scroll for result sets beyond 20 properties | Must Have |
| FR-15.1.7 | Featured/curated property recommendations surfaced at the top of results for popular search areas | Could Have |

#### FR-15.2 — Filtering

| ID | Requirement | Priority |
|---|---|---|
| FR-15.2.1 | Filter by property type: Cottage, Cabin, Chalet, Treehouse, Farmhouse, Lodge | Must Have |
| FR-15.2.2 | Filter by number of bedrooms: Any, 1+, 2+, 3+, 4+ | Must Have |
| FR-15.2.3 | Filter by price range (min/max per night, currency-aware) | Must Have |
| FR-15.2.4 | Filter by amenities: Lakefront / Waterfront, Hot Tub, Fireplace, Private Dock, Pet Friendly, WiFi, Sauna, Canoe / Kayak available | Must Have |
| FR-15.2.5 | Filter by setting: Lakeside, Forest / Wooded, Mountain / Ski, Riverside, Oceanfront | Should Have |
| FR-15.2.6 | "Clear all filters" action resets to defaults without losing search location or dates | Must Have |
| FR-15.2.7 | Active filter count badge shown on filter toggle button (mobile) | Should Have |

#### FR-15.3 — Property Detail Page

| ID | Requirement | Priority |
|---|---|---|
| FR-15.3.1 | Photo gallery: main hero image + 4 thumbnails in a grid; "Show all photos" opens full lightbox | Must Have |
| FR-15.3.2 | Key stats bar: bedrooms, bathrooms, max guests, square footage, waterfront length (where applicable) | Must Have |
| FR-15.3.3 | Full property description with "Read more" expand/collapse | Must Have |
| FR-15.3.4 | Complete amenities list grouped by category; "Show all X amenities" expand | Must Have |
| FR-15.3.5 | House rules section: check-in/check-out times, max guests, pet policy, smoking, quiet hours | Should Have |
| FR-15.3.6 | Host profile: name, Superhost badge (if applicable), response rate, years hosting | Should Have |
| FR-15.3.7 | Guest reviews: overall score with breakdown per dimension (cleanliness, location, value, check-in, host), individual review cards, "Show all reviews" pagination | Should Have |
| FR-15.3.8 | Location section: area description, map pin (exact location revealed post-booking), driving distance from nearest major city | Should Have |
| FR-15.3.9 | Sticky booking widget (desktop sidebar; bottom sheet on mobile): check-in/checkout date pickers, guest count selector, dynamic pricing summary (nights × rate + cleaning fee + service fee = total), availability indicator | Must Have |
| FR-15.3.10 | "Reserve" / "Book Now" CTA routes user to the affiliate platform via a tracked click link | Must Have |
| FR-15.3.11 | "Similar properties" strip at the bottom with 3 comparable nearby listings | Could Have |

#### FR-15.4 — Trip Integration

| ID | Requirement | Priority |
|---|---|---|
| FR-15.4.1 | "Add to a MyTravel Trip" button on the property detail page prompts the user to select an existing trip | Must Have |
| FR-15.4.2 | The selected property is linked to the trip and visible in the trip's itinerary sidebar and budget tracker (as an Accommodation line item) | Must Have |
| FR-15.4.3 | Each trip can have one active linked accommodation; linking a new property replaces the previous one (with confirmation) | Should Have |
| FR-15.4.4 | User can save (wishlist) a property to review later, independent of any specific trip | Should Have |
| FR-15.4.5 | Saved/wishlisted properties accessible from the dashboard under a "Saved Places" section | Should Have |
| FR-15.4.6 | When a user creates a new trip for dates that overlap with a saved property's availability, a contextual suggestion surfaces ("You saved a Muskoka cottage — it's available for these dates") | Could Have |

#### FR-15.5 — AI Property Match Scoring *(Premium)*

| ID | Requirement | Priority |
|---|---|---|
| FR-15.5.1 | For a given trip, Claude scores each search result property on how well it fits the trip profile (destination proximity, travel style, group size, budget, activity types planned) | Should Have |
| FR-15.5.2 | A "Match %" badge (e.g., "94% match for your Muskoka trip") is overlaid on property cards when AI scoring is active | Should Have |
| FR-15.5.3 | An AI insight blurb on the property detail page explains why the property fits this specific trip ("Based on your Bali trip style — relaxation + nature — this lakefront cottage scores highly for the morning paddle activities already in your itinerary") | Should Have |
| FR-15.5.4 | Model used: `claude-haiku-4-5` — scoring task, not generation; ~$0.001–$0.002 per scored set | Must Have (if feature built) |

#### FR-15.6 — Integration Points

| ID | Requirement | Priority |
|---|---|---|
| FR-15.6.1 | Accessible from the main navigation sidebar (all authenticated pages), dashboard "Quick Actions" card, and the new-trip wizard ("Planning a cottage trip? Browse properties →") | Must Have |
| FR-15.6.2 | Landing page features Cottage & Cabin Search as a named free feature in the features section | Should Have |
| FR-15.6.3 | All affiliate clicks tracked before redirect (`GET /cottages/:id/book` → logs click → 302 to affiliate URL) for commission attribution | Must Have |
| FR-15.6.4 | Properties sourced via affiliate partner APIs (Vrbo Partner API, Airbnb affiliate, Booking.com Affiliate) and cached in `cottage_properties` table with configurable TTL | Must Have |

---

## 6. Non-Functional Requirements

### Performance
| Requirement | Target |
|---|---|
| API response time (non-AI endpoints) | < 200ms at p95 |
| AI itinerary generation (7-day trip) | < 90 seconds end-to-end |
| Map initial load | < 2 seconds |
| Web Lighthouse performance score | ≥ 85 |
| Mobile app cold start | < 3 seconds |

### Scalability
| Requirement | Target |
|---|---|
| Concurrent active users (MVP launch) | Support 1,000 concurrent users |
| Concurrent AI generation jobs | Handle 50 simultaneous without queuing delay > 10s |
| Database queries | All primary queries indexed; no full table scans |

### Reliability
| Requirement | Target |
|---|---|
| API uptime | 99.5% monthly |
| AI generation success rate | ≥ 95% (retries on failure) |
| Data backup | Daily automated backups with 30-day retention |

### Security
| Requirement | Approach |
|---|---|
| All traffic | HTTPS/TLS 1.3 only |
| Auth tokens | Short-lived JWTs (15 min) + HTTP-only refresh tokens (7 days) |
| Database access | Row Level Security (RLS) on all user-data tables |
| API rate limiting | 100 req/min per IP (unauthenticated); 300 req/min per user (authenticated) |
| Payment data | Never stored — delegated entirely to Stripe / RevenueCat |
| PII | Encrypted at rest (Supabase default); GDPR-compliant data deletion |

### Accessibility
- WCAG 2.1 AA compliance for web frontend
- Screen reader support on mobile (VoiceOver / TalkBack)
- Minimum tap target size: 44×44pt on mobile

### Compliance
- GDPR: Right to deletion, data export, cookie consent
- App Store: Apple IAP for digital subscriptions, no direct payment in mobile web views
- FTC/ASA: Clear "Sponsored" and "Ad" labeling on sponsored content
- CCPA: California privacy rights supported

---

## 7. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   ┌──────────────────────┐        ┌────────────────────────────┐   │
│   │   Next.js 15 Web App │        │  React Native / Expo App   │   │
│   │   (Vercel + Edge CDN)│        │  (iOS + Android)           │   │
│   │   PWA / Offline      │        │  WatermelonDB offline sync │   │
│   │   Mapbox GL JS       │        │  react-native-maps         │   │
│   └──────────┬───────────┘        └─────────────┬──────────────┘   │
└──────────────┼──────────────────────────────────┼──────────────────┘
               │ HTTPS                            │ HTTPS
               └──────────────┬───────────────────┘
                              │ + WSS (WebSocket)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               FastAPI (Python 3.12) — Railway (Docker)              │
│                                                                     │
│   JWT auth · Rate Limit (slowapi) · Pydantic v2 · OpenAPI 3.1     │
│   WebSocket (real-time collab, generation streaming, flight alerts) │
│                                                                     │
│   ┌──────────┐ ┌────────────────┐ ┌──────────┐ ┌───────────────┐  │
│   │  /auth   │ │    /trips      │ │ /places  │ │ /subscription │  │
│   │          │ │  /ai           │ │ /ai/chat │ │ /affiliate    │  │
│   │          │ │  /budget       │ │          │ │ /loyalty      │  │
│   └──────────┘ └────────┬───────┘ └──────────┘ └───────────────┘  │
└────────────────────────┼────────────────────────────────────────────┘
                         │
          ┌──────────────┼────────────────────────┐
          ▼              ▼                        ▼
   ┌──────────┐   ┌──────────────┐        ┌──────────────────┐
   │PostgreSQL│   │ Redis/Upstash│        │  BullMQ Workers  │
   │(Supabase)│   │              │        │                  │
   │ + pgvector│  │ • Sessions   │        │ • AI generation  │
   │ + RLS     │  │ • Rate limits│        │ • PDF export     │
   └──────────┘  │ • Job queue  │        │ • Flight polling │
         │       │ • POI cache  │        │ • Email dispatch │
         │       └──────────────┘        └──────────────────┘
   ┌─────┴──────┐
   │  Typesense │
   │  (Search)  │
   └────────────┘

                    EXTERNAL SERVICES
   ┌────────────────────────────────────────────────────────────┐
   │ Anthropic Claude API │ Mapbox API  │ OpenWeatherMap API    │
   │ Google Places API    │ Amadeus API │ Open Exchange Rates   │
   │ Stripe               │ RevenueCat  │ Cloudflare R2         │
   │ Resend (Email)       │ Firebase FCM│ Sentry / PostHog      │
   │ Vrbo Partner API     │ Airbnb Aff. │ Booking.com Affiliate │
   └────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. AI generation is always asynchronous**
HTTP requests for itinerary generation would time out on long trips. Instead, the client receives a `jobId` immediately, then subscribes via WebSocket. BullMQ processes the job in a worker. Claude streams the response token-by-token; the worker parses completed days and broadcasts them via WebSocket so the UI renders days as they arrive — not all at once at the end.

**2. FastAPI OpenAPI spec as the single source of truth**
FastAPI auto-generates an OpenAPI 3.1 spec from Pydantic v2 models. A CI step runs `openapi-typescript` to generate `packages/generated-types/src/api.d.ts` — TypeScript types consumed by both the web app and mobile app. When a Pydantic schema changes in Python, the CI type-generation step fails if the frontend hasn't been updated, preventing silent runtime mismatches across the Python/Node.js boundary.

**3. Row Level Security enforced at the database**
RLS policies on all PostgreSQL tables ensure users can only access their own data. Collaborator access is controlled by the `trip_members` table with an RLS policy. Even if API middleware is bypassed, the database rejects unauthorized queries.

**4. Offline-first on mobile, PWA offline on web**
Mobile uses WatermelonDB (SQLite-based, sync-capable) for local itinerary storage. The web PWA uses Workbox to cache itinerary pages and map tiles. Travelers in areas with poor connectivity can still view their saved plans.

**5. Monorepo with Turborepo**
All three apps and shared packages live in one repository. Turborepo caches build outputs and only rebuilds what changed. This enables shared TypeScript configs, shared ESLint rules, and atomic commits across the whole stack.

---

## 8. Tech Stack Decisions

| Layer | Technology | Alternatives Considered | Decision Rationale |
|---|---|---|---|
| Backend framework | **FastAPI (Python 3.12)** | Fastify, Django REST, Flask | Comfortable with it; async-native (ASGI); Pydantic v2 validation built-in; auto-generates OpenAPI 3.1 spec; excellent Claude Python SDK integration |
| ASGI server | **Uvicorn** | Hypercorn, Gunicorn | Standard production ASGI server for FastAPI; supports HTTP/2 and WebSockets |
| Python validation | **Pydantic v2** | marshmallow, attrs | FastAPI's native validation layer; ~5–50× faster than v1; JSON Schema export drives type generation |
| Python ORM | **SQLAlchemy 2.0** (async) + **asyncpg** | Tortoise ORM, Peewee | Most mature Python ORM; async-first in v2; excellent PostgreSQL + pgvector support |
| DB migrations | **Alembic** | Django migrations, Flyway | Standard Python migration tool; integrates directly with SQLAlchemy |
| Job queue | **ARQ** (Async Redis Queue) | Celery, Dramatiq, RQ | Async-native (fits FastAPI's async model); lighter than Celery; built on Redis; supports cron tasks |
| Python package manager | **uv** | Poetry, pip, Pipenv | Extremely fast (Rust-based); `pyproject.toml` standard; lockfile-based reproducibility |
| Web framework | **Next.js 15** (Node.js) | Remix, SvelteKit, Nuxt | App Router SSR for SEO, largest ecosystem, Vercel native, excellent image/font optimization |
| Mobile | **Expo SDK 52** (React Native, Node.js) | Flutter, native iOS/Android | Shared React logic with web; Expo Router mirrors Next.js routing; fastest path to App Store |
| Type bridge | **openapi-typescript** → `packages/generated-types/` | Manual types, tRPC | FastAPI auto-generates spec; TS types auto-generated in CI; no manual sync across Python/Node.js boundary |
| Database | **PostgreSQL 16 (Supabase)** | PlanetScale, MongoDB, Neon | pgvector for AI similarity; RLS for security; managed (saves ops overhead) |
| Cache + Queue broker | **Upstash Redis** | AWS ElastiCache, Railway Redis | Serverless/edge-compatible; usage-based pricing; works as both cache and ARQ broker |
| Maps | **Mapbox GL JS** | Google Maps, Leaflet, Apple Maps | Token-based pricing (no per-load fees); Directions API for routing; Places API for POI |
| AI | **Anthropic Python SDK** (`anthropic`) | OpenAI, Gemini | Best structured JSON output; native streaming; `claude-sonnet-4-6` for itineraries; `claude-haiku-4-5` for chat |
| Payments (web) | **Stripe** Python SDK | Paddle, Braintree | Industry standard; Python SDK first-class; strong webhook + subscription support |
| Payments (mobile) | **RevenueCat** | Direct IAP SDK | Abstracts Apple + Google IAP; syncs entitlements with Stripe |
| Hosting (API) | **Railway** (Python Docker) | Fly.io, Render, AWS ECS | Docker-native; auto-scaling; simple Python deployment; `railway up` in CI |
| Hosting (web) | **Vercel** | Netlify, Cloudflare Pages | Native Next.js; edge middleware; preview deployments per PR |
| File storage | **Cloudflare R2** | AWS S3, Supabase Storage | No egress fees; S3-compatible; global CDN |
| Search | **Typesense** | Algolia, Meilisearch | Open-source; typo-tolerant; Python + JS client SDKs |
| Monitoring | **Sentry** (Python SDK + JS SDK) + **PostHog** | Datadog, Mixpanel | Full-stack error tracking; PostHog for analytics + feature flags + session replay |

---

## 9. Database Schema

All tables use UUIDs, `created_at` / `updated_at` timestamps, and Supabase Row Level Security unless noted.

```
users
  id uuid PK | email text UNIQUE | display_name text | avatar_url text
  auth_provider enum(email,google,apple) | subscription_tier enum(free,premium) DEFAULT free
  loyalty_points int DEFAULT 0 | preferred_currency char(3) DEFAULT USD

trips
  id uuid PK | owner_id→users | title text | destination text
  destination_lat decimal | destination_lng decimal | start_date date | end_date date
  travel_style text[] | mobility_level enum(full,limited,wheelchair)
  budget_total decimal | budget_currency char(3) | traveler_count int | group_type enum(solo,couple,family,friends)
  pace enum(relaxed,moderate,packed) | status enum(draft,generating,active,completed)
  is_public bool DEFAULT false | share_token text UNIQUE

trip_members
  id uuid PK | trip_id→trips | user_id→users | role enum(owner,editor,viewer)

itinerary_days
  id uuid PK | trip_id→trips | day_number int | date date
  theme text | weather_summary text | ai_notes text
  UNIQUE(trip_id, day_number)

itinerary_items
  id uuid PK | day_id→itinerary_days | position int | start_time time | end_time time
  title text | description text | why_chosen text
  category enum(attraction,restaurant,hotel,transport,activity,free_time)
  place_id text | place_name text | address text | lat decimal | lng decimal
  duration_mins int | estimated_cost decimal | currency char(3)
  booking_url text | affiliate_partner text | notes text

activity_votes
  id uuid PK | item_id→itinerary_items | user_id→users | vote enum(up,down,neutral)
  UNIQUE(item_id, user_id)

places_cache
  id uuid PK | external_id text UNIQUE | name text | category text[]
  address text | lat decimal | lng decimal | rating decimal | review_count int
  price_level int | opening_hours jsonb | photos text[]
  embedding vector(1536) | cached_at timestamptz | expires_at timestamptz

budget_items
  id uuid PK | trip_id→trips | itinerary_item_id→itinerary_items nullable
  category enum(accommodation,food,transport,activity,shopping,other)
  label text | planned_amount decimal | actual_amount decimal
  currency char(3) | exchange_rate decimal | receipt_url text

packing_lists
  id uuid PK | trip_id→trips | generated_by_ai bool

packing_items
  id uuid PK | list_id→packing_lists | category text | label text
  is_packed bool | is_essential bool | quantity int DEFAULT 1

saved_places
  id uuid PK | user_id→users | place_id text | place_name text | notes text | tags text[]

trip_reviews
  id uuid PK | trip_id→trips | author_id→users | overall_rating int(1-5)
  accuracy_rating int(1-5) | body text | photos text[] | is_published bool

subscriptions
  id uuid PK | user_id→users UNIQUE | stripe_customer_id text
  stripe_subscription_id text | plan enum(premium_monthly,premium_annual)
  status enum(active,canceled,past_due,trialing) | current_period_end timestamptz

affiliate_clicks
  id uuid PK | user_id→users nullable | item_id→itinerary_items
  partner text | clicked_at timestamptz | converted bool | commission_amount decimal

sponsored_places
  id uuid PK | place_id text | sponsor_name text | campaign_id text
  priority_boost int DEFAULT 0 | active_from timestamptz | active_until timestamptz
  impressions int | clicks int

flight_alerts
  id uuid PK | trip_id→trips | user_id→users | flight_number text
  flight_date date | departure_iata char(3) | arrival_iata char(3)
  last_status text | is_active bool

chat_sessions
  id uuid PK | trip_id→trips nullable | user_id→users

chat_messages
  id uuid PK | session_id→chat_sessions | role enum(user,assistant) | content text

loyalty_transactions
  id uuid PK | user_id→users | points int | reason text | reference_id uuid

-- Curated Tour Itineraries
curated_itineraries
  id uuid PK | slug text UNIQUE | title text | destination text
  destination_lat decimal | destination_lng decimal | duration_days int
  travel_style text[] | difficulty enum(easy,moderate,challenging)
  cover_image_url text | short_description text | full_description text
  author_name text | author_bio text | author_avatar_url text
  full_price_usd decimal | member_price_usd decimal
  is_premium_included bool DEFAULT true
  is_published bool DEFAULT false | is_featured bool DEFAULT false
  tags text[] | total_purchases int DEFAULT 0
  average_rating decimal | review_count int DEFAULT 0
  created_at timestamptz | updated_at timestamptz

curated_itinerary_days
  id uuid PK | curated_itinerary_id→curated_itineraries
  day_number int | title text | theme text | description text
  UNIQUE(curated_itinerary_id, day_number)

curated_itinerary_items
  id uuid PK | day_id→curated_itinerary_days | position int
  start_time time | end_time time | title text | description text
  category enum(attraction,restaurant,hotel,transport,activity,free_time)
  place_name text | address text | lat decimal | lng decimal
  duration_mins int | estimated_cost decimal | currency char(3)
  booking_url text | tips text

curated_itinerary_purchases
  id uuid PK | curated_itinerary_id→curated_itineraries
  user_id uuid nullable  -- null for non-member guest purchases
  guest_email text nullable  -- for non-member purchases
  price_paid decimal | currency char(3)
  tier_at_purchase enum(non_member,member_free,member_paid,premium)
  stripe_payment_intent_id text | revenuecat_transaction_id text
  purchased_at timestamptz
  access_token text UNIQUE  -- for non-member access via email link

users
  -- add field:
  curated_free_used int DEFAULT 0  -- count of free curated itineraries claimed
  curated_free_reset_at timestamptz  -- anniversary date for annual reset

-- Destination Matchmaker (optional persistence — comparisons are ephemeral by default)
destination_comparisons
  id uuid PK
  user_id uuid nullable → users  -- null for anonymous comparisons
  destinations text[]            -- e.g. ["Tokyo, Japan", "Bali, Indonesia", "Paris, France"]
  travel_month int               -- 1–12
  duration_days int
  budget_level enum(budget,moderate,comfortable,luxury)
  group_type enum(solo,couple,friends,family)
  priority enum(best_value,weather,culture_food,adventure,relaxation,nightlife)
  result_winner text             -- winning destination name
  result_scores jsonb            -- { destination: { overall, weather, budget, ... } }
  result_reasoning text          -- AI reasoning paragraph
  created_at timestamptz

-- Cottage & Cabin Search (FR-15)
cottage_properties
  id uuid PK
  external_id text UNIQUE        -- partner platform's listing ID
  platform enum(vrbo,airbnb,booking,direct)
  name text
  property_type enum(cottage,cabin,chalet,treehouse,farmhouse,lodge)
  host_name text | host_is_superhost bool DEFAULT false
  location_name text             -- human-readable area, e.g. "Lake Rosseau, Muskoka, ON"
  region text                    -- indexed for search, e.g. "Muskoka"
  lat decimal | lng decimal
  bedrooms int | bathrooms decimal | max_guests int | sqft int nullable
  price_per_night decimal | currency char(3)
  rating decimal | review_count int
  amenities text[]               -- e.g. ["fireplace","hot_tub","private_dock","pet_friendly"]
  setting text[]                 -- e.g. ["lakefront","forest"]
  photos text[]                  -- URLs to cached images (Cloudflare R2)
  description text
  affiliate_url text             -- tracking URL for click attribution
  cached_at timestamptz | expires_at timestamptz  -- cache TTL (default 24h)

-- Links a specific property to a trip (one active accommodation per trip)
trip_accommodations
  id uuid PK
  trip_id→trips UNIQUE           -- one accommodation per trip
  property_id→cottage_properties
  check_in date | check_out date | guests int
  platform_listing_url text      -- canonical affiliate booking URL at time of save
  affiliate_click_id→affiliate_clicks nullable  -- populated when user clicks "Book Now"
  added_at timestamptz

-- User property wishlist (independent of any trip)
saved_properties
  id uuid PK
  user_id→users | property_id→cottage_properties
  notes text nullable
  saved_at timestamptz
  UNIQUE(user_id, property_id)
```

---

## 10. API Specification

**Base URL**: `https://api.mytravel.app/v1`
**Auth**: Bearer JWT in `Authorization` header
**Content-Type**: `application/json`
**Docs**: Auto-generated OpenAPI 3.1 at `/docs`

### Endpoint Reference

```
── Authentication ──────────────────────────────────────────────────
POST   /auth/register
POST   /auth/login                    → { accessToken, refreshToken }
POST   /auth/refresh
POST   /auth/logout
POST   /auth/oauth/google
POST   /auth/oauth/apple
POST   /auth/forgot-password
POST   /auth/reset-password

── Trips ───────────────────────────────────────────────────────────
GET    /trips                         List user's trips
POST   /trips                         Create trip
GET    /trips/:id                     Full trip + itinerary
PATCH  /trips/:id
DELETE /trips/:id
GET    /trips/shared/:shareToken      Public view (no auth required)

POST   /trips/:id/generate            → { jobId }  [async]
GET    /trips/:id/generation-status/:jobId
POST   /trips/:id/regenerate-day/:dayNumber

── Itinerary ───────────────────────────────────────────────────────
GET    /trips/:id/days
GET    /trips/:id/days/:dayId
PATCH  /trips/:id/days/:dayId
GET    /trips/:id/days/:dayId/items
POST   /trips/:id/days/:dayId/items
PATCH  /trips/:id/days/:dayId/items/:itemId
DELETE /trips/:id/days/:dayId/items/:itemId
POST   /trips/:id/days/:dayId/items/reorder

── Collaboration ───────────────────────────────────────────────────
GET    /trips/:id/members
POST   /trips/:id/members/invite
PATCH  /trips/:id/members/:userId
DELETE /trips/:id/members/:userId
POST   /trips/:id/days/:dayId/items/:itemId/vote
GET    /trips/:id/days/:dayId/items/:itemId/votes

── Discovery ───────────────────────────────────────────────────────
GET    /places/search?q=&lat=&lng=&radius=&category=
GET    /places/:placeId
GET    /places/nearby?lat=&lng=&category=&radius=
GET    /places/:placeId/similar       AI vector similarity

── AI ──────────────────────────────────────────────────────────────
POST   /ai/chat                       SSE streaming response
GET    /ai/chat/sessions
GET    /ai/chat/sessions/:id
POST   /ai/packing-list/:tripId
POST   /ai/suggest-alternatives/:itemId

── Destination Matchmaker ──────────────────────────────────────────
POST   /compare/destinations          Run AI comparison (no auth required)
                                      Body: { destinations[], travel_month, duration_days,
                                              budget_level, group_type, priority }
                                      Returns: { winner, scores{}, reasoning, quickFacts{},
                                                 comparisonTable[] }
GET    /compare/history               User's saved comparisons [auth required]
POST   /compare/:id/save              Save an ephemeral comparison result [auth required]
DELETE /compare/:id                   Delete a saved comparison [auth required]

── Cottage & Cabin Search ──────────────────────────────────────────
GET    /cottages/search               Search properties
                                      Query: location, checkin, checkout, guests,
                                             type[], bedrooms, min_price, max_price,
                                             amenities[], setting[], sort, page
                                      Returns: { results[], total, page, pages }
GET    /cottages/featured             Curated featured properties for homepage/dashboard
GET    /cottages/:id                  Full property detail
GET    /cottages/:id/book             Track affiliate click → 302 redirect to platform [auth]
POST   /cottages/:id/save             Add to user wishlist [auth]
DELETE /cottages/:id/save             Remove from wishlist [auth]
GET    /cottages/saved                User's wishlisted properties [auth]
POST   /ai/cottage-match/:tripId      AI property scoring against trip profile [auth, Premium]
                                      Returns property IDs with match scores + reasoning

GET    /trips/:id/accommodation       Get linked accommodation for a trip [auth]
POST   /trips/:id/accommodation       Link a property to a trip [auth]
                                      Body: { propertyId, checkIn, checkOut, guests }
DELETE /trips/:id/accommodation       Remove linked accommodation [auth]

── Budget ──────────────────────────────────────────────────────────
GET    /trips/:id/budget
POST   /trips/:id/budget/items
PATCH  /trips/:id/budget/items/:itemId
DELETE /trips/:id/budget/items/:itemId
GET    /currencies/rates

── Export & Sharing ────────────────────────────────────────────────
POST   /trips/:id/share
DELETE /trips/:id/share
POST   /trips/:id/export/pdf          → { jobId }  [async, Premium]
POST   /trips/:id/export/calendar     → .ics file  [Premium]
GET    /trips/:id/export/status/:jobId

── Flights ─────────────────────────────────────────────────────────
GET    /trips/:id/flight-alerts
POST   /trips/:id/flight-alerts
DELETE /trips/:id/flight-alerts/:alertId

── Monetization ────────────────────────────────────────────────────
GET    /subscription/plans
POST   /subscription/checkout
POST   /subscription/portal
GET    /subscription/status
POST   /subscription/webhook          [no auth — Stripe signature verified]
GET    /affiliate/click/:itemId        → 302 redirect
GET    /loyalty/balance
GET    /loyalty/history
POST   /loyalty/redeem

── Curated Itineraries ─────────────────────────────────────────────
GET    /curated                          Public catalog (no auth required)
GET    /curated/:slug                    Full detail + Day 1 preview (no auth required)
GET    /curated/:slug/pricing            Returns tier-appropriate price for current user
POST   /curated/:slug/checkout           Initiate purchase → { checkoutUrl, tier, pricePaid }
GET    /curated/library                  User's purchased itineraries [auth required]
POST   /curated/:slug/claim-free         Claim one of 5 member free uses [auth required]
POST   /curated/:slug/import             Import into user trips as editable trip [auth required]
GET    /curated/access/:accessToken      Non-member access via emailed token [no auth]

── Admin (Curated Content) ─────────────────────────────────────────
GET    /admin/curated                    List all (including unpublished)
POST   /admin/curated                    Create new curated itinerary
GET    /admin/curated/:id
PATCH  /admin/curated/:id
DELETE /admin/curated/:id
POST   /admin/curated/:id/publish
POST   /admin/curated/:id/unpublish
GET    /admin/curated/:id/stats          Purchase count, revenue, ratings
```

### WebSocket Protocol (`WSS /ws?token=<jwt>`)

```json
// Client subscribes
{ "type": "subscribe_trip",       "tripId": "uuid" }
{ "type": "subscribe_generation", "jobId": "string" }
{ "type": "unsubscribe_trip",     "tripId": "uuid" }

// Server broadcasts
{ "type": "generation_progress", "jobId": "...", "progress": 45, "partialDay": { ... } }
{ "type": "generation_complete", "jobId": "...", "tripId": "..." }
{ "type": "trip_updated",        "tripId": "...", "change": { ... } }
{ "type": "vote_updated",        "itemId": "...", "votes": { up: 3, down: 1 } }
{ "type": "flight_alert",        "tripId": "...", "message": "UA123 delayed 45 min" }
{ "type": "member_joined",       "tripId": "...", "user": { ... } }
```

---

## 11. Implementation Plan (Phased Roadmap)

### Overview

```
Phase 1: MVP              Phase 2: Growth           Phase 3: Scale
Weeks 1–10                Weeks 11–20               Weeks 21–30
─────────────────────     ─────────────────────     ─────────────────────
✓ Core auth               ✓ Collaboration           ✓ AI concierge chat
✓ Trip CRUD               ✓ Real-time editing       ✓ Flight search + alerts
✓ AI generation           ✓ Activity voting         ✓ Trip reviews
✓ Itinerary view          ✓ Premium subscriptions   ✓ Loyalty rewards
✓ Mapbox maps             ✓ Affiliate tracking      ✓ AI recommendations
✓ Web + Mobile MVP        ✓ Local discovery         ✓ A/B testing
✓ Basic sharing           ✓ Budget + packing        ✓ Personalization
                          ✓ PDF + calendar export
                          ✓ Offline access
```

---

### Phase 1 — MVP (Weeks 1–10)

**Goal**: A single user can create an account, input trip preferences, receive an AI-generated day-by-day itinerary, and view it on a map.

#### Week 1–2: Foundation

**Infrastructure provisioning:**
- Supabase project (PostgreSQL + Auth)
- Upstash Redis (cache + queue)
- Railway project (API Docker container)
- Vercel project (web frontend)
- GitHub repository with branch protection rules
- Sentry projects (API + web + mobile)

**Monorepo scaffold:**
```
pnpm init
pnpm add -D turbo typescript eslint prettier
# Initialize apps/api, apps/web, apps/mobile, packages/shared
# Configure pnpm-workspace.yaml, turbo.json, tsconfig.base.json
```

**CI/CD pipeline** (GitHub Actions):
- `ci.yml`: On every PR — lint, type-check, unit tests
- `deploy-api.yml`: On merge to `main` — build Docker image, push to Railway
- `deploy-web.yml`: On merge to `main` — Vercel auto-deploy (via GitHub integration)

---

#### Week 3–4: Backend Core

**Deliverables:**
- Fastify app with plugins: auth (JWT), CORS, rate-limit, swagger, websocket
- User registration / login / OAuth (Google + Apple) endpoints
- JWT access token (15 min) + refresh token (7 days, HTTP-only cookie)
- Trip CRUD endpoints (`GET /trips`, `POST /trips`, `GET /trips/:id`, `PATCH`, `DELETE`)
- Drizzle ORM setup + initial migrations: `users`, `trips`, `trip_members` tables
- Shared Zod schemas in `packages/shared` for user and trip entities
- Environment variable validation with Zod at startup

**Testing targets:**
- Unit: auth helpers (token generation, bcrypt)
- Integration: auth routes with test Supabase project

---

#### Week 5–6: AI Itinerary Engine

**Deliverables:**
- `itinerary_days` + `itinerary_items` DB tables + migrations
- `packages/shared/src/schemas/itinerary.schema.ts` — full Zod schema for structured Claude output
- `apps/api/src/services/ai/itinerary-generator.ts`:
  - Builds system prompt with destination, dates, travel_style, mobility, budget, weather
  - Calls `claude-sonnet-4-6` with structured JSON output requirement
  - Parses streaming response, validates each day against Zod schema
  - Saves to DB as days arrive (partial persistence)
- `apps/api/src/jobs/itinerary-generation.job.ts`:
  - BullMQ job processor
  - Broadcasts `generation_progress` events via WebSocket after each day
  - Broadcasts `generation_complete` on finish
- `POST /trips/:id/generate` route returns `{ jobId }` immediately
- OpenWeatherMap integration: fetch 7-day forecast, inject into prompt
- Redis counter for free-tier generation limit (3/month)
- Error handling: retry on transient Claude API errors; mark trip `status: failed` after 3 retries

**Testing targets:**
- Snapshot tests: fixture inputs → assert Claude JSON output matches schema
- Integration: submit generation job, wait for completion, verify DB rows created

---

#### Week 7–8: Web Frontend MVP

**Deliverables:**
- Next.js 15 app with Tailwind + shadcn/ui
- Auth flow: `/login`, `/register`, Google OAuth callback
- Trip creation wizard: destination (Mapbox geocoder), dates, travel style picker, mobility selector
- `POST /trips/:id/generate` triggered on wizard completion
- `GenerationProgress.tsx`: WebSocket subscription, streaming day cards rendered as they arrive, progress bar
- Itinerary overview page: day accordion with activity cards
- Activity card: title, time, description, "Why chosen" note, estimated cost, "Book now" affiliate button
- Mapbox map with day-filtered pins (click pin → activity card slide-up)
- Dashboard: list of user's trips with cover image and status chip
- Responsive design (mobile-first)

**Testing targets:**
- Playwright E2E: register → create trip → generation → itinerary view
- Visual regression snapshots for key components

---

#### Week 9–10: Mobile MVP

**Deliverables:**
- Expo SDK 52 app with Expo Router
- Auth screens (login, register) — same API
- Trip list screen (tabs: active, upcoming, past)
- Trip creation wizard (same flow as web)
- Generation progress screen with streaming day cards
- Itinerary viewer with bottom-sheet activity details
- Map screen (react-native-maps + Mapbox SDK)
- Basic offline: Expo SecureStore caches last-fetched trip data
- EAS Build configuration for TestFlight + Play Store internal testing

**Testing targets:**
- Expo Go smoke tests on physical iOS + Android devices
- EAS Build successful on both platforms

---

### Phase 2 — Growth Features (Weeks 11–20)

#### Week 11–12: Collaboration, Sharing & Destination Matchmaker

| Task | Details |
|---|---|
| Member invites | `POST /trips/:id/members/invite` → Resend email with magic link |
| Role management | Owner/Editor/Viewer roles enforced in `require-trip-access.ts` middleware |
| Real-time editing | WebSocket broadcasts `trip_updated` events to all connected members |
| Activity voting | `activity_votes` table; vote UI on each activity card; vote summary badge |
| Public share links | `share_token` on trips; `GET /trips/shared/:token` returns read-only view |
| SEO share pages | Next.js `generateMetadata()` with OG image (trip destination photo) |
| **Destination Matchmaker** | `POST /compare/destinations`; `services/ai/destination_compare.py`; Haiku model; structured JSON output with scores + reasoning; Compare page in web app + mobile Discover tab; no auth required |

#### Week 13–14: Monetization Infrastructure

| Task | Details |
|---|---|
| Stripe subscriptions | `POST /subscription/checkout` → Stripe Checkout session; webhook updates `subscriptions` table |
| Premium feature gates | `require-premium.ts` middleware on: unlimited gen, PDF, calendar, AI chat, offline |
| RevenueCat (mobile) | Mobile subscriptions via Apple IAP / Google Play Billing; entitlements synced |
| Affiliate tracking | `GET /affiliate/click/:itemId` logs click, redirects; partner URLs stored in `itinerary_items.booking_url` |
| Sponsored listings | `sponsored_places` table; POI search injects sponsored entries with priority boost + "Sponsored" badge |

#### Week 15–16: Local Discovery

| Task | Details |
|---|---|
| Mapbox Places API | POI search in `GET /places/search`, enriched data in `places_cache` |
| Google Places fallback | Used for additional reviews/photos when Mapbox data is sparse |
| Typesense index | Index `places_cache` for fast full-text search in discovery UI |
| Scenic route visualizer | Mapbox Directions API; polyline drawn on map between day's activities |
| Nearby places panel | Sidebar/sheet showing POIs near selected activity pin |

#### Week 17–18: Budget Tracker + Packing List

| Task | Details |
|---|---|
| Budget tracker | `budget_items` table; planned vs actual UI; category totals |
| Multi-currency | Open Exchange Rates API; rates cached in Redis (1h TTL); all amounts normalized to trip currency |
| AI packing list | `POST /ai/packing-list/:tripId`; Claude Haiku generates categorized list from trip profile + weather |
| Packing list UI | Checkbox list with category groups; swipe-to-pack gesture on mobile |

#### Week 19–20: Export, Offline, PWA

| Task | Details |
|---|---|
| PDF export | Puppeteer renders a Next.js route `/trips/:id/print` to PDF; stored in Cloudflare R2; async BullMQ job |
| Calendar export | `ical.js` generates `.ics` with one event per activity; download link |
| PWA offline | `next-pwa` + Workbox; cache itinerary pages + map tiles in service worker |
| Mobile offline | WatermelonDB SQLite schema mirrors `itinerary_days` + `itinerary_items`; sync on app foreground |

---

### Phase 3 — Scale & Intelligence (Weeks 21–30)

#### Week 21–22: AI Concierge Chat

Full trip context (itinerary + destination + preferences) injected into Claude system prompt. Streaming SSE response. Chat history persisted in `chat_messages`. Suggested prompt chips. Optional: modify itinerary by chatting ("Replace dinner on Day 3 with something near the hotel and under €30").

#### Week 23–24: Flights & Accommodation

- Amadeus API: flight search + live status polling (BullMQ cron every 30 minutes per active alert)
- Booking.com + GetYourGuide affiliate API: accommodation and tour search embedded in itinerary items
- Push notification on delay/gate change via Expo Notifications + Firebase FCM (web PWA)
- Email fallback via Resend

#### Week 25–26: Reviews & Photos

- Post-trip review prompt triggered automatically after `end_date` passes
- 5-star rating + text review + photo upload (Cloudflare R2)
- Basic moderation: flag system + admin review queue
- Reviews displayed on public `share/[token]` pages

#### Week 27–28: Loyalty Program

Points earned on: trip creation (50), affiliate click converts (200), review submitted (100), referral (500), public trip shared + 5 views (25). Redemption: Premium month (2,000 pts), curated itinerary unlock (1,500 pts), partner voucher (1,000 pts). Dashboard with history and balance.

#### Week 29–30: Personalization & A/B Testing

- pgvector: embed trip profiles; "Trips similar to yours" recommendations on dashboard
- Seasonal suggestions: destination recommendations based on current month + user history
- PostHog feature flags: A/B test itinerary prompt variants, pricing pages, CTA copy
- Experiment tracking pipeline: log generation job outcomes by prompt variant

---

## 12. Development Workflow

### Repository Structure

```
mytravel/                   # Monorepo root
├── apps/
│   ├── api/                # Fastify backend
│   ├── web/                # Next.js frontend
│   └── mobile/             # Expo mobile app
├── packages/
│   ├── shared/             # Zod schemas + TypeScript types
│   └── email-templates/    # React Email components
└── .github/workflows/      # CI/CD pipelines
```

### Branching Strategy (GitHub Flow)

```
main  ──────────────────────────────────────────────────────►
       │            │              │              │
       └── feat/    └── fix/       └── chore/     └── release/
           auth         map-pins       deps           v1.2.0
           ──────►      ──────►        ──────►
           PR → review  PR → review    PR → review
           CI passes    CI passes      CI passes
           Squash merge Squash merge   Squash merge
```

**Branch naming conventions:**
- `feat/<short-description>` — new feature
- `fix/<short-description>` — bug fix
- `chore/<short-description>` — dependency update, config, tooling
- `release/v<semver>` — release candidate (tag after merge)

**Rules on `main`:**
- Direct pushes blocked; all changes via PR
- Minimum 1 approving review required
- CI pipeline must pass (lint + type-check + tests)
- Squash merge only (keeps linear history)

---

### CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  PULL REQUEST                                                │
│                                                              │
│  GitHub Actions: ci.yml                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  pnpm    │  │ TypeScript   │  │  Jest unit + integ.  │  │
│  │  install │→ │ type-check   │→ │  tests               │  │
│  │          │  │ (all apps)   │  │                      │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                                              │
│  Vercel preview deployment (web) ← automatic on PR          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                             │
                       PR approved + merged to main
                             │
┌──────────────────────────────────────────────────────────────┐
│  MAIN BRANCH DEPLOY                                          │
│                                                              │
│  Parallel:                                                   │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │  deploy-api.yml        │  │  deploy-web.yml            │ │
│  │  Docker build → push   │  │  Vercel production deploy  │ │
│  │  → Railway deploy      │  │  (triggered by Vercel GH   │ │
│  │  → health check        │  │   integration)             │ │
│  └────────────────────────┘  └────────────────────────────┘ │
│                                                              │
│  Mobile:                                                     │
│  ┌────────────────────────┐                                  │
│  │  deploy-mobile.yml     │                                  │
│  │  EAS Build (on tag)    │                                  │
│  │  → TestFlight / Play   │                                  │
│  └────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────┘
```

**CI checks (`ci.yml`) — two parallel jobs:**
```yaml
jobs:
  ci-python:                          # FastAPI backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4   # Install uv
      - run: uv sync                  # Install Python deps from pyproject.toml
        working-directory: apps/api
      - run: uv run ruff check .      # Lint
        working-directory: apps/api
      - run: uv run mypy .            # Type check
        working-directory: apps/api
      - run: uv run pytest            # Tests
        working-directory: apps/api

  ci-node:                            # Next.js + Expo
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint type-check test
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

  ci-types-sync:                      # Assert TS types match FastAPI spec
    runs-on: ubuntu-latest
    needs: [ci-python]
    steps:
      - uses: actions/checkout@v4
      - run: npx openapi-typescript http://localhost:8000/openapi.json -o packages/generated-types/src/api.d.ts
      - run: git diff --exit-code packages/generated-types/  # Fail if types drifted
```

---

### Environment Management

| Environment | Purpose | How deployed |
|---|---|---|
| **local** | Developer machine | `.env.local` files per app |
| **preview** | Per-PR Vercel preview | Vercel env vars (preview scope) |
| **staging** | Pre-production QA | Railway staging environment |
| **production** | Live | Railway + Vercel production |

**Environment variable structure per app:**

```
apps/api/.env.example
  DATABASE_URL=
  REDIS_URL=
  JWT_SECRET=
  ANTHROPIC_API_KEY=
  MAPBOX_SECRET_TOKEN=
  OPENWEATHER_API_KEY=
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  RESEND_API_KEY=
  SENTRY_DSN=

apps/web/.env.example
  NEXT_PUBLIC_API_URL=
  NEXT_PUBLIC_MAPBOX_TOKEN=
  NEXT_PUBLIC_POSTHOG_KEY=
  NEXT_PUBLIC_SENTRY_DSN=

apps/mobile/.env.example  (via Expo .env or app.config.ts)
  EXPO_PUBLIC_API_URL=
  EXPO_PUBLIC_MAPBOX_TOKEN=
  EXPO_PUBLIC_SENTRY_DSN=
```

---

### Local Development Setup

```bash
# Prerequisites: Python 3.12, Node.js 22, pnpm 9, uv, Docker Desktop

# 1. Clone repo
git clone https://github.com/your-org/mytravel.git
cd mytravel

# 2. Install Python dependencies (FastAPI backend)
cd apps/api && uv sync && cd ../..

# 3. Install Node.js dependencies (web + mobile)
pnpm install

# 4. Start local services (PostgreSQL + Redis + Typesense via Docker Compose)
docker compose up -d

# 5. Run database migrations (Alembic)
cd apps/api && uv run alembic upgrade head && cd ../..

# 6. Seed development data
cd apps/api && uv run python -m scripts.seed && cd ../..

# 7. Generate TypeScript types from FastAPI OpenAPI spec
pnpm generate:types
# Runs: openapi-typescript http://localhost:8000/openapi.json -o packages/generated-types/src/api.d.ts

# 8. Start the FastAPI backend
cd apps/api && uv run uvicorn main:app --reload --port 8000

# 9. Start web + mobile (in a new terminal)
pnpm dev
# Starts: Web (port 3000), Mobile (Expo Go)
```

**`docker-compose.yml` (local dev):**
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: mytravel_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  typesense:
    image: typesense/typesense:26.0
    ports: ["8108:8108"]
    command: "--data-dir /data --api-key=local-dev-key"

  arq-worker:                         # ARQ background job worker
    build: ./apps/api
    command: uv run arq workers.settings.WorkerSettings
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/mytravel_dev
    depends_on: [postgres, redis]
```

---

### Code Quality Standards

**Python config** (`apps/api/pyproject.toml`):
```toml
[tool.ruff]
target-version = "py312"
select = ["E", "F", "I", "N", "UP", "ASYNC"]   # lint + import sort + async checks

[tool.mypy]
strict = true
plugins = ["pydantic.mypy"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

**TypeScript config** (`tsconfig.base.json`):
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Commit message convention** (Conventional Commits):
```
feat(itinerary): add day regeneration endpoint
fix(auth): correct refresh token expiry calculation
chore(deps): upgrade to Expo SDK 52
docs(api): add WebSocket event documentation
test(ai): add snapshot tests for itinerary prompt
```

**Pre-commit hooks** (via `simple-git-hooks` + `lint-staged`):
```
lint-staged:
  "*.py":         ["uv run ruff check --fix", "uv run ruff format"]
  "*.{ts,tsx}":   ["eslint --fix", "prettier --write"]
  "*.{json,md,yaml}": ["prettier --write"]
```

**PR checklist** (in `.github/PULL_REQUEST_TEMPLATE.md`):
- [ ] CI passes
- [ ] Unit/integration tests added for new logic
- [ ] No new TypeScript errors
- [ ] Migrations reviewed (destructive migrations require team approval)
- [ ] Feature flag added for large features (PostHog)
- [ ] Environment variable additions documented in `.env.example`

---

### Release Process

1. **Versioning**: Semantic Versioning (`MAJOR.MINOR.PATCH`)
   - `PATCH`: Bug fixes; auto-deployed on merge to main
   - `MINOR`: New features; tagged release + changelog entry
   - `MAJOR`: Breaking changes; announced in advance

2. **Release cadence**: 2-week sprints; minor release per sprint for Phase 1–2; weekly hotfix window

3. **Mobile releases**:
   - **OTA updates** (JS bundle only): instant via Expo Updates — no App Store review
   - **Native binary updates** (new native modules, Expo SDK upgrade): requires App Store/Play Store submission (3–7 day review buffer planned)

4. **Database migrations**:
   - Backwards-compatible migrations only (add columns, never drop until next release)
   - Destructive migrations require separate "cleanup" PR after 2 releases
   - Run via `pnpm --filter api db:migrate` in Railway deploy hook

---

### Incident Response

| Severity | Definition | Response Time | Process |
|---|---|---|---|
| P0 | Service down / data loss | 15 min | PagerDuty alert → war room Slack channel → hotfix branch → expedited deploy |
| P1 | Core feature broken (generation failing) | 1 hour | Sentry alert → issue created → hot-fix PR |
| P2 | Non-critical feature broken | 4 hours | Normal PR process, next sprint |
| P3 | Minor bug / cosmetic | Next sprint | Backlog |

**On-call rotation**: Starting at 3 engineers; 1-week rotation.

---

## 13. Monetization Model

### Tier Comparison

| Feature | Non-member | Free Member | Premium ($9.99/mo · $79/yr) |
|---|---|---|---|
| AI itinerary generations | ✗ | 3/month | Unlimited |
| AI day regeneration | ✗ | ✗ | ✓ |
| AI concierge chat | ✗ | ✗ | Unlimited |
| AI packing list | ✗ | ✗ | ✓ |
| **Destination Matchmaker** | ✓ Free | ✓ Free | ✓ Free |
| **Cottage & Cabin Search** | ✗ (browse only, no trip link) | ✓ Free | ✓ Free |
| **AI Property Match Scoring** | ✗ | ✗ | ✓ |
| Offline access | ✗ | ✗ | ✓ |
| PDF export | ✗ | ✗ | ✓ |
| Calendar export | ✗ | ✗ | ✓ |
| Sponsored placements | Visible | Visible | Hidden |
| Group collaboration | ✗ | ✓ (up to 5 members) | ✓ (unlimited) |
| **Curated itineraries** | Full price | **5 free**, then member price | **Unlimited (all included)** |

### Revenue Streams

| Stream | Implementation | Est. Revenue (12 mo) |
|---|---|---|
| Premium subscriptions | Stripe + RevenueCat | Primary |
| Curated itinerary sales | Non-member full price + member post-free-tier purchases | Secondary |
| **Cottage & cabin affiliate commissions** | Click tracking → Vrbo Partner API, Airbnb Affiliate, Booking.com Affiliate (~3–8% commission per booking; average Ontario cottage booking ~$2,000–$4,000/week) | Secondary (high value) |
| Affiliate commissions — activities | Click tracking → GetYourGuide, Viator, Klook | Tertiary |
| Sponsored listings | Priority boost in POI results + "Sponsored" badge | Supplementary |

### Free Tier Enforcement

```
Redis key: user:{userId}:gen_count:{YYYY-MM}
TTL: auto-expires end of month

On POST /trips/:id/generate:
  count = INCR user:{userId}:gen_count:{month}
  if count > 3 AND user.subscription_tier == 'free':
    return 402 Payment Required
      { error: "generation_limit_reached",
        message: "Upgrade to Premium for unlimited itineraries" }
```

### Curated Itinerary Pricing Logic

```
GET /curated/:slug/pricing  (and during checkout)

if user is not authenticated:
  → return { tier: "non_member", price: itinerary.full_price_usd }

if user.subscription_tier == 'premium':
  → return { tier: "premium", price: 0, included: true }

if user.curated_free_used < 5:
  → return { tier: "member_free", price: 0, freeRemaining: 5 - used }

else:
  → return { tier: "member_paid", price: itinerary.member_price_usd,
             saving: itinerary.full_price_usd - itinerary.member_price_usd }


On POST /curated/:slug/claim-free:
  if user.curated_free_used >= 5: return 402
  INCREMENT users.curated_free_used
  INSERT curated_itinerary_purchases (tier_at_purchase: 'member_free', price_paid: 0)
  → grant access

On POST /curated/:slug/checkout (non-member guest):
  Create Stripe Checkout session (mode: payment, no account required)
  On webhook payment_intent.succeeded:
    INSERT curated_itinerary_purchases (user_id: null, guest_email, tier: 'non_member')
    Send access email with unique access_token link
```

### Curated Itinerary Pricing Example

| Scenario | Price |
|---|---|
| Non-member buys "Kyoto Cherry Blossom 5-Day" | $12.99 (full price) |
| Free member claims 1st–5th curated itinerary | $0.00 (free allowance) |
| Free member buys after 5 free uses | $7.79 (40% member discount) |
| Premium subscriber accesses any curated itinerary | $0.00 (included) |

---

## 14. Marketing & Go-to-Market Strategy

### 14.1 Unique Selling Proposition (USP)

> **"Your entire trip, planned in 60 seconds — by an AI that thinks like a local."**

This USP targets the single biggest pain point in travel planning: the **research-to-plan gap**. Travelers spend 10+ hours across 15+ tabs stitching together a trip from reviews, maps, blog posts, and spreadsheets. MyTravel collapses that into one generation.

#### Competitive Positioning

| Competitor | Their Approach | MyTravel's Edge |
|---|---|---|
| TripAdvisor | Reviews-first; user assembles the plan | MyTravel generates the full plan — nothing to assemble |
| Google Travel | Search-first; saves places to a list | MyTravel sequences places intelligently: geography, time, weather |
| ChatGPT (DIY) | User must prompt-engineer their own itinerary | Purpose-built: maps, booking, budget, and collaboration in one flow |
| Lonely Planet | Static editorial content | Personalized to your style, dates, budget, and mobility |
| Wanderlog | Manual collaborative planning tool | AI does the planning for you; collaboration is additive, not the core |

**The real moat** is the combination: AI generation + map visualization + group coordination + offline access + booking — connected in a single flow. No competitor joins all these dots today.

---

### 14.2 Target Audience Segments

| Segment | Size | Priority | Channel |
|---|---|---|---|
| Independent travelers (solo/couple, 22–35) | Very large | Primary | Instagram, TikTok, SEO |
| Group trip organizers (friends/family, 28–40) | Large | Primary | Facebook Groups, word-of-mouth |
| Family planners (parents, 32–45) | Large | Secondary | Pinterest, parenting communities |
| Travel content creators | Small but high-leverage | Influencer | Direct outreach |
| Business travelers | Medium | Opportunistic | LinkedIn, App Store search |

---

### 14.3 Messaging by Persona

| Persona | Primary Message | Supporting Proof Point |
|---|---|---|
| Solo traveler | "Stop spending 10 hours on 15 tabs. Get your full trip plan in 60 seconds." | Show the generation animation — instant gratification |
| Group organizer | "Everyone agrees on the plan. No more WhatsApp arguments." | Group voting feature demo |
| Family planner | "Family-friendly, mobility-aware trips — built around your pace, not a tourist's." | Mobility filter + kid-friendly activity examples |
| Business traveler | "4 hours in a new city? Know exactly where to go before you land." | Instant city guide from a single prompt |
| Non-member (curated) | "Expert-planned tours, ready to go. No account needed." | Curated itinerary catalog + guest checkout |

---

### 14.4 Go-to-Market Phases

#### Phase 1 — Pre-Launch (4 weeks before launch)
**Goal**: Build a qualified waitlist of 2,000+ emails before the first public release.

| Activity | Details |
|---|---|
| Landing page | Single-page site with a **live demo** showing 30 seconds of AI generation. Email capture: "Get early access". No sign-up friction. |
| Demo video | 60-second screen recording: enter destination → watch itinerary stream in → see map pins appear. No narration needed — the product sells itself. Post on LinkedIn, X, Instagram. |
| Reddit seeding | Post genuinely helpful itinerary examples in r/solotravel, r/travel, r/digitalnomad — no sales pitch. Link to waitlist only if asked. |
| Travel blogger outreach | Contact 30–50 mid-tier travel bloggers (50k–500k followers). Offer free lifetime Premium in exchange for an honest first-look post or video. |
| ProductHunt teaser | "Ship it" post + teaser on PH upcoming page to capture PH audience before launch day. |

---

#### Phase 2 — Launch (Week 1–2)
**Goal**: Drive first 1,000 registrations and generate initial reviews and press.

| Activity | Details |
|---|---|
| **Product Hunt launch** | Submit on a Tuesday or Wednesday (highest traffic days). Hunter with a strong following if possible. Prepare founder comment thread, GIFs, and a compelling tagline. Target: #1 Product of the Day. |
| App Store / Play Store launch | Optimize title: *"MyTravel — AI Trip Planner"*. Screenshot set shows: generation in progress → itinerary view → map → group voting. |
| Launch email to waitlist | Personal-tone email from the founder. Subject: *"Your AI travel planner is here."* Include a 30-day free Premium code. |
| Social proof sprint | Activate the 30–50 bloggers seeded in Phase 1. Ask for posts to go live on or within 48 hours of launch day. |
| Press outreach | Pitch to: TechCrunch, The Verge, Skift (travel tech), Mashable Travel. Angle: *"The AI that plans your entire trip — not just answers questions about it."* |

---

#### Phase 3 — Growth (Months 2–6)
**Goal**: Reach 10,000 registered users and $5,000 MRR through scalable channels.

| Channel | Strategy | Investment |
|---|---|---|
| **Viral sharing loop** | Every public trip share page is a free ad impression. Make share pages beautiful — cover photo, map, day cards. Prominent "Plan my own trip →" CTA. | Engineering only |
| **SEO** | Every curated itinerary and public shared trip becomes an SEO landing page targeting "[X] days in [Destination] itinerary". Invest in 100+ curated itinerary pages at launch. | Content + engineering |
| **TikTok / Reels** | 30-second demos: *"I let AI plan my trip to [X]"*. The generation streaming animation is visually compelling and native to short-form. Seed 10 creators per month. | Creator budget |
| **Pinterest** | Travel boards have extremely high purchase intent. Pin every curated itinerary as a rich pin with cover image and destination metadata. | Low — automated from catalog |
| **Google Search Ads** | Bid on high-intent keywords: *"AI trip planner"*, *"itinerary generator"*, *"vacation planner app"*. Start with $500/month test budget; scale on positive ROAS. | Paid budget |
| **Meta / Instagram Ads** | Retarget landing page visitors. Lookalike audiences of Premium converters. Video creative showing generation. | Paid budget |
| **Community seeding** | r/solotravel, r/travel, r/backpacking, Facebook travel groups, travel Discord servers. Share genuinely helpful AI-generated itineraries — link naturally. | Time only |
| **Partnership & co-marketing** | Affiliate partners (GetYourGuide, Booking.com) promote MyTravel to their email lists in exchange for preferred placement in itinerary recommendations. | Negotiation |

---

### 14.5 Viral Growth Loop

The most important growth mechanism is built into the product itself:

```
User creates a trip
       │
       ▼
Shares the plan with their travel group
       │
       ▼
Group members open the beautiful share page
       │
       ▼
Each member thinks: "I want this for my own trips"
       │
       ▼
They sign up → generate their own itinerary → share with their group
       │
       └──────────────────────────────────────► (loop)
```

**Amplifiers:**
- Share page has a persistent "Plan your trip free →" CTA
- Trip cover image auto-generated (destination hero photo) — visually shareable
- OG meta tags make shared links look great in WhatsApp, iMessage, and social previews
- Group trip coordination inherently brings 4–8 users per organizer

---

### 14.6 SEO Strategy

**Primary keyword targets (high volume, high intent):**

| Keyword | Monthly Searches (est.) | Content Type |
|---|---|---|
| "[City] itinerary [X] days" | 5,000–50,000 per city | Curated itinerary page |
| "AI travel planner" | 40,000+ | Landing page + blog |
| "trip itinerary generator" | 25,000+ | Landing page |
| "travel planner app" | 60,000+ | App Store + landing page |
| "[City] travel guide" | Variable | Curated itinerary + blog |
| "things to do in [City]" | Very high | Discovery / place pages |

**Execution:**
1. Launch with 50+ curated itinerary pages for the world's top destinations (Paris, Tokyo, Bali, New York, Barcelona, etc.)
2. Every public shared trip auto-generates a canonical SEO page at `/share/:token` with destination and duration in the `<title>` and OG tags
3. Internal linking between related destination pages builds topical authority
4. Target featured snippets for itinerary queries with structured day-by-day content
5. Schema markup (`TouristTrip`, `TouristAttraction`) on curated pages for Google rich results

---

### 14.7 Content Marketing

| Content Type | Frequency | Goal |
|---|---|---|
| "AI planned my trip to X" case studies | 2/month | SEO + social proof |
| Destination guides (blog) | 4/month | SEO long-tail traffic |
| Travel tips & packing guides | 2/month | Drive packing list feature awareness |
| Creator partnerships ("use MyTravel for your next trip") | 4–8 creators/month | Social reach + trust |
| User-generated trip showcases | Ongoing | Community + SEO via public share pages |

---

### 14.8 Influencer & Creator Strategy

**Tier structure:**

| Tier | Follower Range | Offer | Expected Output |
|---|---|---|---|
| Nano (high authenticity) | 5k–50k | Free lifetime Premium | 1 honest post or reel |
| Mid-tier (broad reach) | 50k–500k | Free Premium + $200–500 | Dedicated post + stories |
| Macro (scale) | 500k+ | Paid partnership ($1k–5k) | Full video + multiple posts |

**Target niches:** Solo travel, budget travel, luxury travel, digital nomad, family travel, adventure travel.

**Brief to creators:** Film the generation experience — show the itinerary streaming in. No scripted talking points. Authentic reaction to a genuinely impressive product moment.

---

### 14.9 App Store Optimization (ASO)

| Element | Approach |
|---|---|
| **App name** | MyTravel — AI Trip Planner |
| **Subtitle** | Itinerary Generator & Planner |
| **Keywords** | ai travel planner, trip itinerary, vacation planner, travel guide, trip generator |
| **Screenshots** | 1: Generation in progress (the "wow" moment) · 2: Day-by-day itinerary · 3: Map with pins · 4: Group voting · 5: Curated itinerary catalog |
| **Preview video** | 15–30 seconds showing generation → itinerary → map — no voiceover needed |
| **Ratings strategy** | In-app prompt triggered after user successfully views their first generated itinerary (peak satisfaction moment) |

---

### 14.10 Launch Timeline

```
Week -4   Build waitlist landing page + demo video
Week -3   Outreach to 50 travel bloggers; seed Reddit + communities
Week -2   ProductHunt "upcoming" teaser; finalize press kit
Week -1   Brief all creator partners; prepare launch email
──────────────────────────────────── LAUNCH DAY ────
Week 1    ProductHunt submission; App Store launch; waitlist email; PR outreach
Week 2    Follow-up press pitches; creator content goes live; monitor ASO rankings
Week 3–4  Analyze first-week data; double down on highest-converting channel
Month 2   Launch paid acquisition (Google Search + Meta); scale creator program
Month 3   SEO momentum from curated itinerary pages; assess organic growth rate
Month 4–6 Optimize conversion funnel; grow affiliate partnerships; expand curated catalog
```

---

### 14.11 Budget Allocation (First 6 Months)

| Category | Allocation | Notes |
|---|---|---|
| Creator partnerships | 35% | Highest ROI for consumer apps at this stage |
| Paid acquisition (Google + Meta) | 30% | Start small, scale on positive signal |
| Content production | 15% | Curated itinerary pages, blog, SEO |
| PR & press | 10% | Press kit, media outreach |
| ASO & store assets | 5% | Screenshots, preview video |
| Community & events | 5% | Travel meetups, digital nomad communities |

---

## 15. Success Metrics & KPIs

### Acquisition
| Metric | Target (6 months) |
|---|---|
| Registered users | 10,000 |
| Monthly Active Users (MAU) | 3,000 |
| App Store installs | 5,000 |
| Organic search traffic | 2,000 sessions/month |
| Waitlist sign-ups (pre-launch) | 2,000 emails |
| ProductHunt launch ranking | Top 5 Product of the Day |
| Share page viral coefficient | ≥ 0.3 new sign-ups per shared trip |

### Activation
| Metric | Target |
|---|---|
| % of registered users who generate ≥1 itinerary | ≥ 60% |
| Time-to-first-itinerary | < 5 minutes from registration |
| Itinerary generation success rate | ≥ 95% |

### Retention
| Metric | Target |
|---|---|
| Day-7 retention | ≥ 30% |
| Month-1 retention | ≥ 20% |
| Premium subscriber churn | < 5%/month |

### Revenue
| Metric | Target (12 months) |
|---|---|
| Monthly Recurring Revenue (MRR) | $5,000 |
| Average Revenue Per User (ARPU) | $2.00/month |
| Affiliate click-through rate | ≥ 8% of itinerary views |
| Affiliate conversion rate | ≥ 2% of clicks |

### Marketing Efficiency
| Metric | Target |
|---|---|
| Cost per registered user (paid channels) | < $3.00 |
| Cost per Premium subscriber (paid channels) | < $30.00 |
| Creator content pieces live within 30 days of launch | ≥ 20 |
| SEO-indexed curated itinerary pages at launch | ≥ 50 |
| Organic share of total acquisition (month 3+) | ≥ 50% |

### Product Quality
| Metric | Target |
|---|---|
| AI itinerary generation time (7 days) | < 90 seconds |
| API p95 latency (non-AI) | < 200ms |
| App Store rating | ≥ 4.5 stars |
| NPS score | ≥ 40 |
| Support ticket rate | < 2% of MAU/month |

---

## 16. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Claude API costs exceed budget** | Medium | High | Cache identical requests (Redis, 24h TTL); model tiering (Haiku for chat, Sonnet for itinerary); free tier cap; spend alerting |
| **App Store rejection (IAP compliance)** | Medium | High | RevenueCat for IAP abstraction; affiliate links open in system browser; no Stripe checkout on mobile for digital goods |
| **AI generates inaccurate/outdated place info** | High | Medium | Show "AI-generated" disclaimer; link to live source for place details; users can edit all activities; reviews build ground truth over time |
| **Poor AI generation quality (hallucinated places)** | Medium | High | Validate generated `place_id` against Mapbox; fallback to place name if ID invalid; "Why chosen" transparency; user feedback loop |
| **Mapbox API cost overrun** | Low | Medium | Cache geocoding results; avoid server-side map rendering; use Mapbox Static Images API for thumbnails instead of interactive maps where possible |
| **Data breach / unauthorized access** | Low | Very High | Supabase RLS on all tables; JWT with short TTL; no plaintext secrets; Sentry alerts on auth failures; regular dependency audits |
| **GDPR non-compliance** | Low | High | Data deletion endpoint (FR-1.6); cookie consent; privacy policy; data retention policy; EU data residency on Supabase |
| **Mobile release delays (App Store review)** | Medium | Medium | Buffer 7 days for iOS review in roadmap; use OTA updates (Expo Updates) for JS changes; avoid native binary changes near launch |
| **Competitor launches similar AI feature** | Medium | Medium | Speed to market; differentiate on group collaboration and offline-first; build loyalty program early for retention |
| **BullMQ job queue backup under load** | Low | Medium | Horizontal scaling of worker containers on Railway; job priority tiers; dead-letter queue + alerting |

---

## 17. Open Questions & Decisions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Which affiliate partners to onboard at launch? GetYourGuide and Booking.com confirmed; Viator TBD | BD | Open |
| 2 | Should the free tier include offline access for 1 trip? (Potential activation driver) | Product | Open |
| 3 | Localization: which languages to support at launch? English-only for MVP vs. Spanish + French? | Product | Open |
| 4 | Will we need a content moderation team for reviews, or rely on automated flagging only? | Ops | Open |
| 5 | Should curated itineraries be a separate product or built into the Premium tier? | Product | **Resolved** — Separate purchasable product. Non-members pay full price. Members get 5 free then discounted price. Premium subscribers get all included. |
| 6 | Self-hosted vs. Typesense Cloud? (Cost vs. ops overhead) | Eng | Open |
| 7 | What is the max trip duration we support? (14 days? 30 days? Affects AI token costs) | Eng/Product | Open |
| 8 | Do we build a web admin dashboard for sponsored listing management in Phase 2 or Phase 3? | Product | Open |

---

*Document version: 1.3 | Last updated: 2026-03-14*
*Next review: After Phase 1 MVP launch — update KPI targets based on real data.*
