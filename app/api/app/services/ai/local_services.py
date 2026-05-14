import json
from google import genai
from google.genai import types
from app.config import settings
from app.models.trip import Trip
from app.services.ai import mock as ai_mock

client = genai.Client(api_key=settings.google_api_key)
MODEL = "gemini-2.5-flash"


async def generate_local_services(trip: Trip) -> dict:
    if settings.mock_ai:
        return await ai_mock.mock_generate_local_services(trip)

    # Build a precise destination string using geocoordinates when available
    dest = trip.destination
    if trip.destination_lat and trip.destination_lng:
        dest = f"{trip.destination} (coordinates: {trip.destination_lat:.5f}°N, {trip.destination_lng:.5f}°E)"

    origin_note = ""
    if trip.origin:
        origin_note = (
            f"\nCRITICAL: The traveller departs FROM {trip.origin} and travels TO {trip.destination}. "
            f"You must generate services for the DESTINATION ({trip.destination}) ONLY. "
            f"Do NOT generate services for {trip.origin} or anywhere along the route."
        )

    prompt = f"""You are generating a local services reference card for a traveller whose DESTINATION is {dest}.{origin_note}
Return valid JSON only — no markdown, no extra text.

First, classify this destination as one of:
- "continent" (e.g., Europe, Asia, South America, Africa)
- "country" (e.g., France, Japan, Italy, USA, India)
- "region" (e.g., Amalfi Coast Italy, Tuscany, Finger Lakes NY, Scottish Highlands, Patagonia)
- "city" (a specific city, town, or village)

Then respond with the appropriate JSON:

If the destination is a continent or country, return:
{{
  "not_applicable": true,
  "message": "Local services are shown for specific cities or towns. Try a destination like [suggest one well-known city within {trip.destination}]."
}}

If the destination is a region or city, return:
{{
  "reference_city": "City Name, Country",
  "categories": [ ... ]
}}

For a region: identify the most representative town or city in that region and set "reference_city" to it.
For a specific city: set "reference_city" to that city and its country.

Include exactly these 6 category ids in order: emergency, hospital, pharmacy, grocery, atm, embassy

Rules — services must be within 25 miles (40 km) of the reference_city. Maximum 3 items per category.

- emergency: local emergency phone number (not always 911 — use the correct number for the country), police non-emergency line, nearest fire station
- hospital: nearest real hospitals or urgent care clinics with address area and hours
- pharmacy: nearest pharmacies; note if any are 24-hour
- grocery: supermarket chains or local markets near the reference_city
- atm: ATM networks available, foreign card fees, currency exchange bureaux
- embassy: US Embassy and one or two other major embassies; note that embassies are typically in capital cities — if reference_city is not the capital, indicate where the nearest embassy is

For each item include as many of: name, address, phone, hours, note, website.
Keep addresses to neighbourhood or district level — no full street numbers.
Omit any field you don't know rather than guessing.

If no services can be identified within 25 miles for a category, return an empty items array and a "not_found_note" explaining this:
{{"id": "embassy", "label": "Embassy & Consulate", "emoji": "🛟", "items": [], "not_found_note": "Nearest embassies are in [city], approximately [X] miles away."}}"""

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
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No valid JSON in local services response: {text[:200]}")
    return json.loads(text[start : end + 1])
