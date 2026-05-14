import asyncio
import httpx
from app.config import settings

_BASE = "https://places.googleapis.com/v1/places:searchText"
_FIELD_MASK = "places.displayName,places.rating,places.formattedAddress,places.websiteUri,places.regularOpeningHours"


async def _lookup_one(client: httpx.AsyncClient, name: str, city: str) -> dict | None:
    try:
        resp = await client.post(
            _BASE,
            json={"textQuery": f"{name} {city}"},
            headers={
                "X-Goog-Api-Key": settings.google_places_api_key,
                "X-Goog-FieldMask": _FIELD_MASK,
            },
            timeout=5.0,
        )
        if resp.status_code != 200:
            return None
        places = resp.json().get("places", [])
        if not places:
            return None
        p = places[0]
        out: dict = {}
        if p.get("rating") is not None:
            out["rating"] = round(float(p["rating"]), 1)
        if p.get("websiteUri"):
            out["website"] = p["websiteUri"]
        if p.get("formattedAddress"):
            out["formatted_address"] = p["formattedAddress"]
        hours = p.get("regularOpeningHours", {})
        if isinstance(hours, dict) and hours.get("weekdayDescriptions"):
            out["hours_display"] = "; ".join(hours["weekdayDescriptions"][:2])
        return out or None
    except Exception:
        return None


async def enrich_restaurants(days: list[dict], fallback_city: str) -> None:
    """Mutate restaurant entries in all_days in-place with real Google Places data."""
    if not settings.google_places_api_key:
        return

    items: list[tuple[dict, str]] = []
    for day in days:
        city = (day.get("city") or "").strip() or fallback_city
        for r in day.get("restaurants", []):
            if r.get("name"):
                items.append((r, city))

    if not items:
        return

    sem = asyncio.Semaphore(10)

    async def bounded(r: dict, city: str) -> None:
        async with sem:
            data = await _lookup_one(client, r["name"], city)
        if not data:
            return
        if "rating" in data:
            r["rating"] = data["rating"]
        if "website" in data and not r.get("website"):
            r["website"] = data["website"]
        if "formatted_address" in data and not r.get("location"):
            r["location"] = data["formatted_address"]

    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[bounded(r, city) for r, city in items], return_exceptions=True)
