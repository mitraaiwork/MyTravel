import re
import httpx

HEADERS = {
    "User-Agent": "MyTravel/1.0 (https://github.com/mytravel; contact@mytravel.app) httpx/0.28",
    "Accept": "application/json",
}

# Categories where Wikipedia rarely has a useful page — skip image fetch entirely
_SKIP_CATEGORIES = {"food", "accommodation", "nightlife", "shopping", "transport"}


def _city_name(destination: str) -> str:
    """Extract the city part from a destination string, e.g. 'New York, USA' → 'New York'."""
    return destination.split(",")[0].strip()


def _clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


async def _wiki_search_image(client: httpx.AsyncClient, query: str) -> str | None:
    """
    Search Wikipedia for `query`, verify the top result title closely matches
    the query (to avoid wrong-place hits), then return its thumbnail URL.
    """
    try:
        r = await client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": 3,          # fetch top 3 so we can pick the best match
                "format": "json",
            },
        )
        results = r.json().get("query", {}).get("search", [])
        if not results:
            return None

        # Pick the first result whose title shares at least one significant word
        # with the place name — avoids completely unrelated hits
        place_words = set(query.lower().split())
        chosen_title = None
        for hit in results:
            title_words = set(hit["title"].lower().split())
            if place_words & title_words:          # non-empty intersection
                chosen_title = hit["title"]
                break
        if not chosen_title:
            chosen_title = results[0]["title"]     # last resort: top result

        r2 = await client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "titles": chosen_title,
                "prop": "pageimages",
                "format": "json",
                "pithumbsize": 1200,
                "redirects": 1,
            },
        )
        pages = r2.json().get("query", {}).get("pages", {})
        for page in pages.values():
            src = (page.get("thumbnail") or {}).get("source")
            if src:
                return src
    except Exception:
        pass
    return None


async def fetch_activity_image(
    activity_name: str,
    category: str,
    destination: str,
) -> str | None:
    """
    Return a Wikipedia image URL for a specific activity/place.

    Strategy:
    1. Skip categories that rarely have useful Wikipedia pages (restaurants etc.)
    2. Search for "<activity name> <city>" for geographic disambiguation
    3. Return None (no image) rather than falling back to a generic destination
       photo — avoids the same image appearing for multiple activities.
    """
    if not activity_name:
        return None

    if category.lower() in _SKIP_CATEGORIES:
        return None

    city = _city_name(destination)
    # Include city in query to disambiguate (e.g. "Tower Bridge London" not just "Tower Bridge")
    query = _clean(f"{activity_name} {city}")

    async with httpx.AsyncClient(
        timeout=8.0, follow_redirects=True, headers=HEADERS
    ) as client:
        return await _wiki_search_image(client, query)
