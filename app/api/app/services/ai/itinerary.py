import json
import anthropic
from app.config import settings
from app.models.trip import Trip

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

# ── Day outline pre-planning ───────────────────────────────────────────────────

async def generate_day_outline(trip: Trip, day_list: list[dict]) -> list[dict]:
    """
    Fast pre-planning call (Haiku) that assigns each day a DISTINCT area and theme.
    Called once before parallel day generation so every day prompt knows the full plan
    and won't repeat the same landmarks.
    Returns list of {day, area, theme} — falls back to empty list on failure.
    """
    days_text = "\n".join(f"Day {d['day']} ({d['date']})" for d in day_list)

    prompt = f"""You are planning a {len(day_list)}-day trip to {trip.destination}.
Travel style: {trip.travel_style}
Group: {trip.group_size} {trip.group_type}
Interests: {trip.interests or "general sightseeing"}

Assign each day a UNIQUE neighbourhood or area so the major landmarks are spread across days \
without repetition. Each area should have its own iconic must-sees — no landmark should appear \
on more than one day.

Output valid JSON only (no markdown, no extra text):
[
  {{"day": 1, "area": "Specific neighbourhood or district", "theme": "Short evocative theme (4-6 words)"}},
  {{"day": 2, "area": "Different neighbourhood", "theme": "Different theme"}},
  ...
]

Days to plan:
{days_text}"""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
    except Exception:
        pass
    return []


# ── Single-day generation ──────────────────────────────────────────────────────

SINGLE_DAY_SYSTEM_PROMPT = """
You are a local expert and seasoned travel curator for MyTravel. You know every city like a long-time resident — the hidden courtyards, the tea house only regulars visit, the rooftop bar with no sign, the market that opens at dawn. Generate exactly ONE day of a travel itinerary as valid JSON.

Rules:
- Use REAL, specific place names. Never use generic placeholders.
- ACTIVITIES are the must-see, can't-miss experiences for the area: iconic landmarks, world-famous sights, and experiences the traveller will regret skipping (e.g. Times Square, WTC One World Observatory, Brooklyn Bridge, Eiffel Tower, Colosseum). Every visitor expects and deserves these. Include 2-3 of the day's genuinely famous highlights, then add 1-2 local gems that a well-connected resident would recommend alongside them.
- Sequence activities to minimise backtracking — group by neighbourhood.
- 3-4 activities maximum (NO food or dining in activities — those go in the restaurants section). Quality over quantity.
- For EVERY activity include "why_chosen": one sentence a local friend would say to convince you — specific, not generic.
- Omit optional fields unless genuinely useful — never write null values.
- Use local currency for price_range.
- CRITICAL: Provide accurate real-world lat/lng for every activity. Never use 0.0 as a coordinate.
- CRITICAL: Only suggest places within your assigned area for the day. Do NOT repeat any landmark listed under other days.
- TIME-SPECIFIC MAGIC: If the area has a famous sunrise, sunset, dawn ritual, night market, tide event, or time-of-day phenomenon — schedule it at the correct time (e.g. 04:30 for Tiger Hill sunrise, dusk for Ganga Aarti). These experiences often define a destination more than any museum.
- RESTAURANTS (2-3): Cover the meal times of the day. Mix one well-known local institution with lesser-known neighbourhood spots. State clearly what each place is famous for.
- OFFBEAT SPOTS (2-3): Places MOST tourists completely miss — things NOT already listed in activities. A rooftop with no sign, a workshop open to visitors, a viewpoint locals keep quiet, a quirky museum, a hidden garden. These are the bonus layer on top of the must-sees.

Output ONLY a valid JSON object for a single day — no markdown, no text before or after:

{
  "day": 1,
  "date": "YYYY-MM-DD",
  "theme": "Short evocative theme",
  "area": "Primary neighbourhood for the day",
  "activities": [
    {
      "name": "Full place name",
      "category": "nature|culture|adventure|nightlife|wellness|other",
      "time": "09:00",
      "duration": "2 hours",
      "location": "Neighbourhood or district",
      "lat": 35.6595,
      "lng": 139.7006,
      "why_chosen": "One sentence a local friend would say to convince you — specific, not generic",
      "highlights": [
        "Vivid fact, history, or story about this specific place that most tourists never learn",
        "Insider tip — best time to visit, what to order, where to stand, what to avoid",
        "What makes it worth going out of your way for — the detail that makes it memorable"
      ],
      "price_range": "Free | $10-15 | ¥1500",
      "booking_tip": "Practical tip (only if important)",
      "weather_note": "Weather relevance (only if important)",
      "website": "URL (only if highly useful)"
    }
  ],
  "restaurants": [
    {
      "name": "Full restaurant name",
      "meal": "breakfast|lunch|dinner|snack",
      "cuisine": "Cuisine type",
      "famous_for": "One sentence — the dish, the history, or the experience that makes it unmissable",
      "price_range": "$ | $$ | $$$",
      "location": "Street or neighbourhood",
      "insider_tip": "What to order, when to go, or how to get a table (only if genuinely useful)"
    }
  ],
  "offbeat_spots": [
    {
      "name": "Full place name",
      "why_special": "One vivid sentence — what makes this place a hidden gem worth seeking out",
      "location": "Street or neighbourhood",
      "best_time": "Morning | Evening | Any time (only if timing matters)"
    }
  ],
  "travel_tip": "One practical tip for the day"
}
"""


async def generate_single_day_stream(
    trip: Trip,
    weather_for_day: str,
    day_num: int,
    day_date: str,
    total_days: int,
    day_outline: list[dict] | None = None,
):
    """Async generator that yields raw text chunks for a single day."""
    budget_line = (
        f"Budget: {trip.budget_currency} {trip.budget_amount:,.0f} total"
        if trip.budget_amount
        else "Budget: not specified"
    )

    # Build the trip plan overview so this day knows what every other day covers
    plan_lines = ""
    if day_outline:
        plan_lines = "\nFULL TRIP PLAN — do NOT suggest any place listed under another day:\n"
        for entry in day_outline:
            marker = " ← YOU ARE GENERATING THIS DAY" if entry["day"] == day_num else ""
            plan_lines += f"  Day {entry['day']}: {entry['area']} — {entry['theme']}{marker}\n"

    accom_context = (
        f"Stay type: {trip.accommodation_type} — let this influence activity suggestions "
        f"(e.g. cabin/camping → morning hikes, campfires, ranger programs; "
        f"resort → spa, scenic drives, fine dining)."
        if trip.accommodation_type and trip.accommodation_type != "any"
        else ""
    )

    prompt = f"""Generate Day {day_num} of {total_days} for this trip.

Destination: {trip.destination}
Date: {day_date} (Day {day_num} of {total_days})
Travel style: {trip.travel_style}
Mobility: {trip.mobility_level}
{budget_line}
Group: {trip.group_size} {trip.group_type}
Pace: {trip.pace}
Special interests: {trip.interests or "None specified"}
{accom_context}
Weather: {weather_for_day}
{plan_lines}
Output the JSON object for Day {day_num} only."""

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        system=SINGLE_DAY_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


# ── Trip meta (summary + practical info) ─────────────────────────────────────

async def generate_meta(trip: Trip, day_outline: list[dict] | None = None) -> dict:
    """
    Non-streaming call (haiku) for trip summary, practical info, and accommodation suggestions.
    Runs in parallel with day generation.
    """
    num_days = (trip.end_date - trip.start_date).days + 1
    num_nights = num_days - 1

    # Build zone context from day outline so AI can cluster nights intelligently
    zone_hint = ""
    if day_outline:
        zone_hint = "\nDay-by-day area plan:\n" + "\n".join(
            f"  Day {d['day']}: {d['area']}" for d in day_outline
        )

    accom_pref = trip.accommodation_type or "any"
    accom_line = (
        f"Accommodation preference: {accom_pref}"
        if accom_pref != "any"
        else "Accommodation preference: no preference — suggest the best fit for each zone"
    )

    prompt = f"""For a {num_days}-day trip to {trip.destination} ({num_nights} nights):
Travel style: {trip.travel_style}
Group: {trip.group_size} {trip.group_type}
Interests: {trip.interests or "general sightseeing"}
{accom_line}
{zone_hint}

Generate as JSON only (no markdown):
{{
  "summary": "2-3 sentence trip overview that gets the traveller excited",
  "destination": "{trip.destination}",
  "country": "Country name",
  "practical_info": {{
    "currency": "e.g. Japanese Yen (JPY)",
    "language": "Primary language(s)",
    "timezone": "e.g. JST (UTC+9)",
    "transport_tips": ["tip 1", "tip 2"],
    "packing_suggestions": ["item 1", "item 2"]
  }},
  "accommodations": [
    {{
      "zone": "Short zone name, e.g. Zion Area",
      "nights": "Nights 1-2",
      "location": "Town or area name",
      "options": [
        {{
          "name": "Full property name",
          "type": "cabin|hotel|hostel|glamping|resort|vacation_rental|camping|boutique",
          "description": "1-2 sentences — why it suits this trip specifically",
          "price_range": "e.g. $150-200/night",
          "location": "Specific neighbourhood or address area",
          "booking_tip": "Urgency or insider tip (only if important)",
          "search_query": "Best search query to find this on Airbnb/Booking.com"
        }}
      ]
    }}
  ]
}}

Rules for accommodations:
- Cluster nights into logical stay-zones based on the itinerary areas (travellers don't move hotels every night).
- Suggest 3 options per zone: one splurge, one mid-range, one budget — unless the user has a specific preference.
- If the user has a preference (e.g. "cabin"), ALL options should match that type.
- Use REAL property names where possible. Flag high-demand properties that require early booking.
- search_query should be specific enough to find the right area on Airbnb (e.g. "Springdale Utah near Zion").
"""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1800,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
    except Exception:
        pass
    return {}
