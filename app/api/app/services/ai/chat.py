import json
from typing import AsyncGenerator
from google import genai
from google.genai import types
from app.config import settings
from app.models.trip import Trip, Itinerary
from app.services.ai import mock as ai_mock

client = genai.Client(api_key=settings.google_api_key)
MODEL = "gemini-2.5-flash"


def _build_system_prompt(trip: Trip, itinerary: Itinerary | None, phase: str) -> str:
    itin_summary = ""
    if itinerary and itinerary.content:
        data = json.loads(itinerary.content)
        days = data.get("days", [])
        day_lines = "\n".join(
            f"Day {d['day']} ({d.get('date', '')}) — {d.get('theme', '')} in {d.get('area', '')}"
            for d in days
        )
        itin_summary = f"\n\nItinerary overview:\n{day_lines}"

    return f"""You are the AI concierge for MyTravel — a knowledgeable, practical travel companion.

Current trip: {trip.destination} | {trip.start_date} to {trip.end_date}
Trip phase: {phase}
Travel style: {trip.travel_style} | Group: {trip.group_size} {trip.group_type} | Pace: {trip.pace}
{itin_summary}

Answer questions about this specific trip concisely. Be practical and specific — name real places, real routes, real prices. If asked about something outside travel, politely redirect.
Phase-aware behaviour:
- pre-trip: focus on preparation, visa, packing, booking tips
- in-trip: focus on navigation, what to do next, practical logistics
- post-trip: collect feedback, suggest future trips based on what they enjoyed"""


def _to_gemini_contents(messages: list[dict]) -> list[dict]:
    result = []
    for m in messages:
        role = "model" if m["role"] == "assistant" else m["role"]
        result.append({"role": role, "parts": [{"text": m["content"]}]})
    return result


async def stream_chat_response(
    trip: Trip,
    itinerary: Itinerary | None,
    phase: str,
    history: list[dict],
    user_message: str,
) -> AsyncGenerator[str, None]:
    """AsyncGenerator yielding SSE-formatted text chunks."""
    if settings.mock_ai:
        async for chunk in ai_mock.mock_stream_chat_response(trip, itinerary, phase, history, user_message):
            yield chunk
        return

    system = _build_system_prompt(trip, itinerary, phase)
    messages = history[-10:] + [{"role": "user", "content": user_message}]
    contents = _to_gemini_contents(messages)

    async for chunk in await client.aio.models.generate_content_stream(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=2048,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    ):
        if chunk.text:
            escaped = chunk.text.replace("\n", "\\n")
            yield f"data: {escaped}\n\n"
    yield "data: [DONE]\n\n"
