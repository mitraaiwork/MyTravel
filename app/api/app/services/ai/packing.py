import json
from google import genai
from google.genai import types
from app.config import settings
from app.models.trip import Trip
from app.services.ai import mock as ai_mock

client = genai.Client(api_key=settings.google_api_key)
MODEL = "gemini-2.5-flash"


async def generate_packing_list(
    trip: Trip,
    weather_summary: str,
    itinerary_activities: list[str],
) -> dict:
    if settings.mock_ai:
        return await ai_mock.mock_generate_packing_list(trip, weather_summary, itinerary_activities)

    activities_text = (
        ", ".join(itinerary_activities[:20]) if itinerary_activities else "general sightseeing"
    )
    duration_days = (trip.end_date - trip.start_date).days + 1

    prompt = f"""Generate a practical packing list for this trip as valid JSON only.

Trip: {trip.destination}
Dates: {trip.start_date} to {trip.end_date} ({duration_days} days)
Travel style: {trip.travel_style}
Group: {trip.group_size} {trip.group_type}
Planned activities: {activities_text}
Weather: {weather_summary or "Temperate, check forecast"}
Accommodation: {trip.accommodation_type or "Hotel"}

Output JSON with exactly this structure (no markdown, no extra text):
{{
  "weather_note": "One sentence about what to expect weather-wise",
  "categories": [
    {{
      "name": "Clothing",
      "icon": "👕",
      "items": [
        {{"label": "Item name", "essential": true, "note": "Optional tip"}}
      ]
    }}
  ]
}}

Include these categories: Clothing, Footwear, Toiletries, Electronics & Cables, Documents & Money, Health & Safety, Day Pack Essentials, Destination-Specific.
Keep each category to 6-10 items. Mark essential: true for must-haves, false for nice-to-haves."""

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
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No valid JSON in packing list response: {text[:200]}")
    return json.loads(text[start : end + 1])
