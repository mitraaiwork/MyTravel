import re
import httpx

HEADERS = {
    "User-Agent": "MyTravel/1.0 (https://github.com/mytravel; contact@mytravel.app) httpx/0.28",
    "Accept": "application/json",
}

_SKIP_CATEGORIES = {"food", "accommodation", "nightlife", "shopping", "transport"}
_STOP_WORDS = {"the", "a", "an", "of", "in", "at", "on", "and", "to", "de", "le", "la", "les", "el", "al"}


def _city_name(destination: str) -> str:
    return destination.split(",")[0].strip()


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _sig_words(text: str) -> set[str]:
    return {w for w in text.lower().split() if w not in _STOP_WORDS and len(w) > 2}


async def _rest_image(client: httpx.AsyncClient, title: str) -> str | None:
    """Fetch the primary image for a Wikipedia page via the REST summary API."""
    try:
        r = await client.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
        )
        if r.status_code == 200:
            data = r.json()
            img = data.get("originalimage") or data.get("thumbnail")
            if img:
                return img.get("source")
    except Exception:
        pass
    return None


async def _wiki_search_image(client: httpx.AsyncClient, place_name: str, city: str) -> str | None:
    try:
        r = await client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": _clean(f"{place_name} {city}"),
                "srlimit": 5,
                "format": "json",
            },
        )
        results = r.json().get("query", {}).get("search", [])
        if not results:
            return None

        # Match on significant words from the PLACE NAME only (not city) to avoid false positives
        name_words = _sig_words(place_name)
        chosen_title = None
        for hit in results:
            if name_words & _sig_words(hit["title"]):
                chosen_title = hit["title"]
                break

        if not chosen_title:
            return None

        return await _rest_image(client, chosen_title)
    except Exception:
        pass
    return None


async def fetch_activity_image(
    activity_name: str,
    category: str,
    destination: str,
) -> str | None:
    if not activity_name:
        return None
    if category.lower() in _SKIP_CATEGORIES:
        return None

    city = _city_name(destination)
    async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, headers=HEADERS) as client:
        return await _wiki_search_image(client, activity_name, city)
