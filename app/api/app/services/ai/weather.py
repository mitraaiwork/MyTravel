import httpx
from datetime import date


WMO_CODES: dict[int, str] = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail",
}


async def get_weather_context(
    lat: float, lng: float, start: date, end: date
) -> dict[str, str]:
    """
    Returns a dict mapping date string -> weather summary.
    e.g. {"2026-04-10": "Partly cloudy, 18°C", "2026-04-11": "Rain, 12°C, 8mm rain"}
    Uses Open-Meteo — free, no API key required.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": "weathercode,temperature_2m_max,precipitation_sum",
        "timezone": "auto",
        "start_date": str(start),
        "end_date": str(end),
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()["daily"]

    result = {}
    for i, d in enumerate(data["time"]):
        code = data["weathercode"][i]
        temp = data["temperature_2m_max"][i]
        precip = data["precipitation_sum"][i] or 0
        desc = WMO_CODES.get(code, "Variable conditions")
        rain_note = f", {precip:.0f}mm rain" if precip > 2 else ""
        result[d] = f"{desc}, {temp:.0f}°C{rain_note}"

    return result
