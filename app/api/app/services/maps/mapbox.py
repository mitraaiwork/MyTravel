import httpx
from app.config import settings


async def geocode(location: str) -> tuple[float, float] | None:
    """
    Returns (lat, lng) for the given location string, or None if not found.
    """
    if not settings.mapbox_token:
        return None

    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params={"access_token": settings.mapbox_token, "limit": 1})
        r.raise_for_status()
        features = r.json().get("features", [])

    if not features:
        return None

    lng, lat = features[0]["center"]
    return lat, lng
