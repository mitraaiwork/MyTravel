import httpx
from collections import Counter
from datetime import date, timedelta


WMO_CODES: dict[int, str] = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail",
}

_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
_ARCHIVE_URL  = "https://archive-api.open-meteo.com/v1/archive"
_FORECAST_HORIZON = 16  # days Open-Meteo forecast covers


def _proxy_dates(start: date, end: date) -> tuple[date, date]:
    """Return same-month/day dates from the most recent past year available in the archive."""
    today = date.today()
    for years_back in range(1, 5):
        try:
            ps = date(start.year - years_back, start.month, start.day)
            pe = date(end.year - years_back, end.month, end.day)
        except ValueError:
            # Feb 29 in a non-leap year
            ps = date(start.year - years_back, start.month, 28)
            pe = date(end.year - years_back, end.month, 28)
        if pe < today - timedelta(days=7):
            return ps, pe
    return ps, pe


async def _fetch_daily(url: str, lat: float, lng: float, start: date, end: date) -> dict:
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset",
        "timezone": "auto",
        "start_date": str(start),
        "end_date": str(end),
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()["daily"]


async def get_full_weather(
    lat: float, lng: float, start: date, end: date
) -> dict:
    """
    Fetch weather for the trip and return both per-day prompt strings and a
    structured summary suitable for storage in the itinerary JSON.

    Falls back to same-calendar-dates from the previous year (historical proxy)
    when the trip is beyond the 16-day forecast window.

    Returns:
    {
      "per_day": {"YYYY-MM-DD": "Sunny, 24°C / 15°C", ...},   # for AI prompts
      "summary": {                                               # for UI + packing
        "is_forecast": bool,
        "avg_high_c": int, "avg_low_c": int,
        "dominant_condition": str,
        "rain_days": int, "total_days": int,
        "days": [{"date", "condition", "high_c", "low_c", "precip_mm"}, ...]
      }
    }
    """
    today = date.today()
    days_until_start = (start - today).days

    if start >= today and (end - today).days <= _FORECAST_HORIZON:
        url = _FORECAST_URL
        fetch_start, fetch_end = start, end
        is_forecast = True
    elif start < today:
        # Past trip — archive with actual dates (archive lags ~5 days)
        url = _ARCHIVE_URL
        fetch_start = start
        fetch_end = min(end, today - timedelta(days=6))
        is_forecast = False
    else:
        # Future beyond forecast window — historical proxy from a prior year
        url = _ARCHIVE_URL
        fetch_start, fetch_end = _proxy_dates(start, end)
        is_forecast = False

    try:
        data = await _fetch_daily(url, lat, lng, fetch_start, fetch_end)
    except Exception:
        return {}

    trip_dates = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    structured_days = []
    sunrise_list = data.get("sunrise", [])
    sunset_list  = data.get("sunset", [])

    for i, trip_date in enumerate(trip_dates):
        if i >= len(data["time"]):
            break
        code = data["weathercode"][i]
        high = data["temperature_2m_max"][i]
        low  = data["temperature_2m_min"][i]
        precip = data["precipitation_sum"][i] or 0
        entry: dict = {
            "date":      str(trip_date),
            "condition": WMO_CODES.get(code, "Variable"),
            "high_c":    round(high),
            "low_c":     round(low),
            "precip_mm": round(precip, 1),
        }
        if i < len(sunrise_list) and sunrise_list[i] and "T" in sunrise_list[i]:
            entry["sunrise"] = sunrise_list[i].split("T")[1][:5]
        if i < len(sunset_list) and sunset_list[i] and "T" in sunset_list[i]:
            entry["sunset"] = sunset_list[i].split("T")[1][:5]
        structured_days.append(entry)

    if not structured_days:
        return {}

    highs = [d["high_c"] for d in structured_days]
    lows  = [d["low_c"]  for d in structured_days]
    dominant = Counter(d["condition"] for d in structured_days).most_common(1)[0][0]
    rain_days = sum(1 for d in structured_days if d["precip_mm"] > 2)

    per_day: dict[str, str] = {}
    for d in structured_days:
        rain_note = f", {d['precip_mm']:.0f}mm rain" if d["precip_mm"] > 2 else ""
        per_day[d["date"]] = f"{d['condition']}, {d['high_c']}°C / {d['low_c']}°C{rain_note}"

    summary = {
        "is_forecast":        is_forecast,
        "avg_high_c":         round(sum(highs) / len(highs)),
        "avg_low_c":          round(sum(lows)  / len(lows)),
        "dominant_condition": dominant,
        "rain_days":          rain_days,
        "total_days":         len(structured_days),
        "days":               structured_days,
    }

    return {"per_day": per_day, "summary": summary}


# Keep old name as a thin wrapper so nothing else breaks
async def get_weather_context(
    lat: float, lng: float, start: date, end: date
) -> dict[str, str]:
    result = await get_full_weather(lat, lng, start, end)
    return result.get("per_day", {})
