import json
from datetime import date
from google import genai
from google.genai import types
from app.config import settings
from app.services.ai import mock as ai_mock

client = genai.Client(api_key=settings.google_api_key)
MODEL = "gemini-2.5-flash"


def _current_season() -> str:
    month = date.today().month
    if month in (12, 1, 2):
        return "winter"
    elif month in (3, 4, 5):
        return "spring"
    elif month in (6, 7, 8):
        return "summer"
    return "autumn"


async def suggest_destinations(  # noqa: RET503
    from_location: str,
    radius_miles: int | None,
    terrain: list[str],
    activities: list[str],
) -> list[dict]:
    if settings.mock_ai:
        return ai_mock.mock_suggest_destinations(from_location, radius_miles, terrain, activities)

    season = _current_season()

    radius_str = (
        f"within {radius_miles} miles of {from_location}"
        if radius_miles and from_location
        else (f"near {from_location}" if from_location else "anywhere in the world")
    )
    terrain_str = ", ".join(terrain) if terrain else "any"
    activities_str = ", ".join(activities) if activities else "any"

    prompt = f"""You are an expert travel advisor. A user wants destination suggestions with these criteria:

- Starting location: {from_location or "not specified"}
- Distance: {radius_str}
- Terrain / place type: {terrain_str}
- Activities: {activities_str}
- Current season: {season}

Return ONLY a valid JSON array — no markdown, no explanation, no extra text.
Return up to 5 destinations. Return fewer if fewer genuinely fit all the criteria well.

Each item must have exactly these fields:
{{
  "destination": "Specific City or Region, State/Country",
  "distance": "~X miles from {from_location or 'starting point'}",
  "tagline": "One compelling sentence explaining why this fits the request",
  "highlights": ["specific highlight 1", "specific highlight 2", "specific highlight 3"],
  "emoji": "single most relevant emoji"
}}

Rules:
- Prioritise destinations that genuinely fit ALL criteria (terrain, activities, season, distance)
- Be precise about distances — calculate them accurately
- Highlights must be specific and concrete, not generic phrases like "great views"
- Rank by best overall fit first
- If radius is specified, do not suggest places outside it"""

    response = await client.aio.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=2048,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )

    text = (response.text or "").strip()

    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    return json.loads(text)
