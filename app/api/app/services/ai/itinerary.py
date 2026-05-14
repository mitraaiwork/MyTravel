import json
from google import genai
from google.genai import types
from app.config import settings
from app.models.trip import Trip
from app.services.ai import mock as ai_mock

client = genai.Client(api_key=settings.google_api_key)
MODEL = "gemini-2.5-flash"

# ── Day outline pre-planning ───────────────────────────────────────────────────

async def generate_day_outline(trip: Trip, day_list: list[dict]) -> list[dict]:
    if settings.mock_ai:
        return ai_mock.mock_generate_day_outline(trip, day_list)

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
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1024,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        text = (response.text or "").strip()
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
- 3-5 activities maximum (NO food or dining in activities — those go in the restaurants section). Quality over quantity.
- For EVERY activity include "why_chosen": one sentence a local friend would say to convince you — specific, not generic.
- Omit optional fields unless genuinely useful — never write null values.
- Use local currency for price_range.
- CRITICAL: Provide accurate real-world lat/lng for every activity. Never use 0.0 as a coordinate.
- CRITICAL: Only suggest places within your assigned area for the day. Do NOT repeat any landmark listed under other days.
- VIEWPOINTS & GOLDEN HOURS (MANDATORY CHECK): Before finalising this day's activities, always ask: does this area have a famous viewpoint, hilltop, rooftop, observation deck, or a renowned sunrise/sunset vantage point? If yes, include it as an activity with category "viewpoint". Schedule sunrise viewpoints at the precise local dawn time (e.g. 05:30), sunset viewpoints 30 minutes before local sunset (e.g. 18:30). In "why_chosen" paint the view in vivid, specific words — what the traveller will actually see. Use "highlights" for the best angle, what to look for, and any lighting tips. Use "booking_tip" for advance ticket requirements or crowd-avoidance advice. Examples: Sunrise at Tiger Hill for Kanchenjunga silhouette; sunset from Sacré-Cœur steps; dawn at Angkor Wat; dusk at Empire State Building; Trolltunga at golden hour.
- TIME-SPECIFIC MAGIC: If the area has a famous dawn ritual, night market, tide event, or time-of-day phenomenon — schedule it at the correct time. These experiences often define a destination more than any museum.
- RESTAURANTS (2-3): Cover the meal times of the day. Mix one well-known local institution with lesser-known neighbourhood spots. State clearly what each place is famous for.
- OFFBEAT SPOTS (2-3): Places MOST tourists completely miss — things NOT already listed in activities. A rooftop with no sign, a workshop open to visitors, a quirky museum, a hidden garden. These are the bonus layer on top of the must-sees.

Output ONLY a valid JSON object for a single day — no markdown, no text before or after:

{
  "day": 1,
  "date": "YYYY-MM-DD",
  "theme": "Short evocative theme",
  "area": "Primary neighbourhood for the day",
  "activities": [
    {
      "name": "Full place name",
      "category": "nature|culture|adventure|nightlife|wellness|viewpoint|other",
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
      "insider_tip": "What to order, when to go, or how to get a table (only if genuinely useful)",
      "website": "Official website URL (only if you are certain it is correct — omit otherwise)",
      "image_url": "A real, publicly accessible image URL of this specific restaurant or its signature dish (omit if unsure)"
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
    day_type: str = "destination",
    arrival_time: str | None = None,
    departure_time: str | None = None,
):
    """Async generator that yields raw text chunks for a single day."""
    if settings.mock_ai:
        async for chunk in ai_mock.mock_generate_single_day_stream(
            trip, weather_for_day, day_num, day_date, total_days, day_outline,
            day_type=day_type, arrival_time=arrival_time, departure_time=departure_time,
        ):
            yield chunk
        return

    budget_line = (
        f"Budget: {trip.budget_currency} {trip.budget_amount:,.0f} total"
        if trip.budget_amount
        else "Budget: not specified"
    )

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

    partial_note = ""
    if day_type == "partial_arrival" and arrival_time:
        partial_note = f"\nNOTE: User arrives at {arrival_time} — plan activities from {arrival_time} onwards only (afternoon/evening plan)."
    elif day_type == "partial_departure" and departure_time:
        partial_note = f"\nNOTE: User departs at {departure_time} — plan activities until {departure_time} only (morning plan)."

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
{plan_lines}{partial_note}
Output the JSON object for Day {day_num} only."""

    async for chunk in await client.aio.models.generate_content_stream(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SINGLE_DAY_SYSTEM_PROMPT,
            max_output_tokens=8192,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    ):
        if chunk.text:
            yield chunk.text


# ── En-route stop suggestions ─────────────────────────────────────────────────

async def generate_route_stops(trip: Trip) -> dict:
    """Generate interesting stops along the driving route from origin to destination."""
    if settings.mock_ai:
        return ai_mock.mock_generate_route_stops(trip)

    include_return = getattr(trip, "include_return_stops", False)

    if include_return:
        return_section = f"""
  "return": [
    {{
      "name": "Full place name",
      "category": "nature|culture|food|adventure|viewpoint",
      "location": "City or area name",
      "why_stop": "One vivid sentence — why this is worth stopping for",
      "duration": "30 minutes | 1-2 hours",
      "lat": 40.123,
      "lng": -75.456
    }}
  ]"""
        return_instruction = f'\n- "return": 2-4 stops ordered {trip.destination} → {trip.origin}'
    else:
        return_section = ""
        return_instruction = "\n- Omit the \"return\" key entirely"

    prompt = f"""Plan a road trip from {trip.origin} to {trip.destination}.

Travel style: {trip.travel_style}
Interests: {trip.interests or "general sightseeing"}

Generate 2-4 interesting stops along the DRIVING route for each direction requested.

If flying is the only practical option (e.g. ocean crossing, intercontinental), return:
{{"outbound": [], "note": "Best reached by flight — no practical en-route stops"}}

Otherwise output valid JSON only (no markdown):
{{
  "outbound": [
    {{
      "name": "Full place name",
      "category": "nature|culture|food|adventure|viewpoint",
      "location": "City or area name",
      "why_stop": "One vivid sentence — why this is worth stopping for",
      "duration": "30 minutes | 1-2 hours",
      "lat": 40.123,
      "lng": -75.456
    }}
  ]{return_section}
}}

Rules:
- Only include places actually along or very near the driving route — no detours over 15 miles off route
- "outbound": 2-4 stops ordered {trip.origin} → {trip.destination}{return_instruction}
- Use REAL specific place names"""

    try:
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=2048,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        text = (response.text or "").strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
    except Exception:
        pass
    return {"outbound": []}


# ── Trip meta (summary + practical info) ─────────────────────────────────────

async def generate_meta(trip: Trip, day_outline: list[dict] | None = None) -> dict:
    if settings.mock_ai:
        return await ai_mock.mock_generate_meta(trip, day_outline)

    num_days = (trip.end_date - trip.start_date).days + 1
    num_nights = num_days - 1

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
  "summary": "2-3 sentence trip overview tailored to a {trip.group_size} {trip.group_type} trip that gets the traveller excited — must reflect the correct group type (never say 'solo' for a family or couple trip)",
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
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=4096,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        text = (response.text or "").strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
    except Exception:
        pass
    return {}
