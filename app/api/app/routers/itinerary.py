import asyncio
import json
import math
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip, Itinerary
from app.models.user import User
from app.schemas.feedback import ChatRequest
from app.services.ai.itinerary import generate_single_day_stream, generate_meta, generate_day_outline, generate_route_stops
from app.services.ai.chat import stream_chat_response
from app.services.ai.packing import generate_packing_list
from app.services.ai.local_services import generate_local_services
from app.services.foursquare import enrich_restaurants
from app.services.ai.weather import get_full_weather
from app.services.maps.mapbox import geocode
from app.dependencies.auth import get_current_user
from app.auth import decode_token
from app.config import settings
from app.services.images import fetch_activity_image

router = APIRouter()



def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 3958.8
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lng2 - lng1)
    a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _nn_order(activities: list[dict]) -> list[dict]:
    """Nearest-neighbour reorder to minimise backtracking within a day."""
    if len(activities) <= 2:
        return activities
    remaining = list(activities)
    ordered = [remaining.pop(0)]
    while remaining:
        last = ordered[-1]
        last_lat = last.get("lat") or 0.0
        last_lng = last.get("lng") or 0.0
        if not last_lat or not last_lng:
            ordered.append(remaining.pop(0))
            continue
        best_i, best_dist = 0, float("inf")
        for i, act in enumerate(remaining):
            act_lat = act.get("lat") or 0.0
            act_lng = act.get("lng") or 0.0
            if act_lat and act_lng:
                d = _haversine_miles(last_lat, last_lng, act_lat, act_lng)
                if d < best_dist:
                    best_dist = d
                    best_i = i
        ordered.append(remaining.pop(best_i))
    return ordered


def _time_minutes(t: str) -> int:
    try:
        h, m = t.split(":")
        return int(h) * 60 + int(m)
    except Exception:
        return -1


def _reorder_and_retime(activities: list[dict]) -> list[dict]:
    """
    1. NN-reorder for geographic efficiency.
    2. Collect the AI-assigned times, sort them, and redistribute across the
       geo-ordered sequence so visit order matches time order.
    3. Return sorted by time.
    """
    if not activities:
        return activities

    geo_ordered = _nn_order(list(activities))

    sorted_times = sorted(
        [a["time"] for a in activities if a.get("time")],
        key=_time_minutes,
    )

    timed_count = len(sorted_times)
    for i, act in enumerate(geo_ordered):
        if i < timed_count:
            act["time"] = sorted_times[i]
        else:
            act.pop("time", None)

    return sorted(geo_ordered, key=lambda a: _time_minutes(a["time"]) if a.get("time") else 9999)


async def _get_trip_by_public_id(public_id: str, db: AsyncSession) -> Trip | None:
    result = await db.scalars(
        select(Trip).where(Trip.public_id == public_id).options(selectinload(Trip.itinerary))
    )
    return result.first()


def _content_response(trip_id: int, itinerary: Itinerary) -> dict:
    content = json.loads(itinerary.content)
    content["trip_id"] = trip_id
    content["generated_at"] = (
        itinerary.generated_at.isoformat() if itinerary.generated_at else None
    )
    return content


def _iter_dates(start_date, end_date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def _classify_days(trip: Trip) -> list[dict]:
    """Return a list of day dicts with day_type classification for road trips."""
    dates = list(_iter_dates(trip.start_date, trip.end_date))
    is_roadtrip = getattr(trip, "trip_type", "destination") == "roadtrip"
    arrive_date = getattr(trip, "arrive_destination_date", None)
    arrive_time = getattr(trip, "arrive_destination_time", None)
    leave_date = getattr(trip, "leave_destination_date", None)
    leave_time = getattr(trip, "leave_destination_time", None)

    classified = []
    for i, d in enumerate(dates):
        entry: dict = {"day": i + 1, "date": str(d)}
        if not is_roadtrip or arrive_date is None:
            entry["day_type"] = "destination"
        elif d < arrive_date:
            entry["day_type"] = "travel_outbound"
        elif d == arrive_date:
            if arrive_time:
                entry["day_type"] = "partial_arrival"
                entry["arrival_time"] = arrive_time
            else:
                entry["day_type"] = "travel_outbound"
        elif leave_date is None or d < leave_date:
            entry["day_type"] = "destination"
        elif d == leave_date:
            if leave_time:
                entry["day_type"] = "partial_departure"
                entry["departure_time"] = leave_time
            else:
                entry["day_type"] = "travel_return"
        else:
            entry["day_type"] = "travel_return"
        classified.append(entry)
    return classified


def _compute_route_overview(day_outline: list[dict]) -> list[dict]:
    """Group consecutive same-city days; return [] if only one city is covered."""
    if not day_outline:
        return []
    overview: list[dict] = []
    current_city: str | None = None
    nights = 0
    for entry in day_outline:
        city = (entry.get("city") or "").strip()
        if not city:
            continue
        if city != current_city:
            if current_city:
                overview.append({"city": current_city, "nights": nights})
            current_city = city
            nights = 1
        else:
            nights += 1
    if current_city:
        overview.append({"city": current_city, "nights": nights})
    unique_cities = {o["city"] for o in overview}
    return overview if len(unique_cities) > 1 else []


def _clean_json(text: str) -> str:
    """
    Strip markdown fences and find the outermost JSON object.
    If the response was truncated (no closing brace), attempt to close open
    braces/brackets so json.loads has a chance of succeeding.
    """
    t = text.strip()
    if "```" in t:
        t = "\n".join(l for l in t.splitlines() if not l.strip().startswith("```")).strip()
    start = t.find("{")
    if start == -1:
        return t
    t = t[start:]
    end = t.rfind("}")
    if end != -1:
        return t[: end + 1]
    # Truncated — count unclosed braces/brackets and close them
    depth_brace = 0
    depth_bracket = 0
    in_string = False
    escape = False
    for ch in t:
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth_brace += 1
        elif ch == "}":
            depth_brace -= 1
        elif ch == "[":
            depth_bracket += 1
        elif ch == "]":
            depth_bracket -= 1
    closing = "]" * max(depth_bracket, 0) + "}" * max(depth_brace, 0)
    return t + closing


# ── GET itinerary ─────────────────────────────────────────────────────────────

@router.get("/{public_id}")
async def get_itinerary(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    if not trip.itinerary or trip.itinerary.status != "done":
        raise HTTPException(status_code=404, detail="Itinerary not ready")
    return _content_response(trip.id, trip.itinerary)


# ── WebSocket generation ──────────────────────────────────────────────────────

@router.websocket("/generate/{public_id}")
async def generate_itinerary(
    public_id: str,
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()

    # Authenticate
    try:
        user_id = decode_token(token)
        user = await db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
    except Exception:
        await websocket.send_json({"type": "error", "message": "Unauthorized"})
        await websocket.close()
        return

    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        await websocket.send_json({"type": "error", "message": "Trip not found"})
        await websocket.close()
        return

    # Generation cap check — reset counter at the start of each new calendar month
    GEN_LIMIT = settings.free_tier_gen_limit
    now = datetime.now(timezone.utc)
    if (
        user.gen_reset_at is None
        or user.gen_reset_at.month != now.month
        or user.gen_reset_at.year != now.year
    ):
        user.gen_count = 0
        user.gen_reset_at = now
        await db.commit()

    if (user.gen_count or 0) >= GEN_LIMIT:
        await websocket.send_json({
            "type": "cap_reached",
            "message": f"You have used all {GEN_LIMIT} free generations this month. Upgrade to Premium for unlimited itineraries.",
        })
        await websocket.close()
        return

    # Create or reset itinerary record
    if trip.itinerary:
        itinerary = trip.itinerary
        itinerary.status = "generating"
        itinerary.content = None
        itinerary.error_message = None
    else:
        itinerary = Itinerary(trip_id=trip.id, status="generating")
        db.add(itinerary)
    await db.commit()

    # Classify all days (destination vs travel for road trips)
    classified = _classify_days(trip)
    total_days = len(classified)
    day_type_map = {c["day"]: c["day_type"] for c in classified}

    # Send "started" immediately with classified day list so UI can render skeletons
    await websocket.send_json({"type": "started", "days": classified})

    # Pre-planning: assign areas only for destination/partial days
    ai_days_for_outline = [
        {"day": c["day"], "date": c["date"]}
        for c in classified
        if c["day_type"] not in ("travel_outbound", "travel_return")
    ]
    day_outline: list[dict] = []
    try:
        if ai_days_for_outline:
            day_outline = await asyncio.wait_for(
                generate_day_outline(trip, ai_days_for_outline),
                timeout=20.0,
            )
    except Exception:
        pass  # degrade gracefully — days still generate without the outline

    # Fetch weather — uses forecast for near-future trips, historical proxy otherwise
    weather_per_day: dict[str, str] = {}
    weather_structured: dict[str, dict] = {}
    weather_summary: dict = {}
    if trip.destination_lat and trip.destination_lng:
        try:
            full_wx = await asyncio.wait_for(
                get_full_weather(
                    trip.destination_lat, trip.destination_lng,
                    trip.start_date, trip.end_date,
                ),
                timeout=10.0,
            )
            weather_per_day = full_wx.get("per_day", {})
            weather_summary = full_wx.get("summary", {})
            weather_structured = {d["date"]: d for d in weather_summary.get("days", [])}
        except Exception:
            pass

    # ── Parallel day streaming ────────────────────────────────────────────────

    queue: asyncio.Queue[dict] = asyncio.Queue()
    day_texts: dict[int, str] = {}
    day_errors: set[int] = set()

    async def stream_one_day(c: dict):
        day_num = c["day"]
        day_date = c["date"]
        dt = c["day_type"]

        if dt in ("travel_outbound", "travel_return"):
            stub = {
                "day": day_num,
                "date": day_date,
                "day_type": dt,
                "theme": "Travel Day",
                "area": "",
                "activities": [],
            }
            day_texts[day_num] = json.dumps(stub)
            await queue.put({"type": "day_done", "day": day_num})
            return

        weather_for_day = weather_per_day.get(day_date, "Weather data not available")
        text = ""
        try:
            async for chunk in generate_single_day_stream(
                trip, weather_for_day, day_num, day_date, total_days,
                day_outline=day_outline,
                day_type=dt,
                arrival_time=c.get("arrival_time"),
                departure_time=c.get("departure_time"),
            ):
                text += chunk
                await queue.put({"type": "day_chunk", "day": day_num, "content": chunk})
            day_texts[day_num] = text
            await queue.put({"type": "day_done", "day": day_num})
        except Exception as e:
            day_errors.add(day_num)
            await queue.put({"type": "day_error", "day": day_num, "error": str(e)})

    # Launch all day tasks + meta + local services + optional route stops in parallel
    day_tasks = [
        asyncio.create_task(stream_one_day(c))
        for c in classified
    ]
    meta_task = asyncio.create_task(generate_meta(trip, day_outline))
    local_services_task = asyncio.create_task(generate_local_services(trip, day_outline))
    route_stops_task = (
        asyncio.create_task(generate_route_stops(trip))
        if (trip.include_route_stops or getattr(trip, "include_return_stops", False)) and trip.origin
        else None
    )

    # Forward queue messages to the WebSocket until all days finish
    completed = 0
    try:
        while completed < total_days:
            msg = await queue.get()
            if msg["type"] in ("day_done", "day_error"):
                completed += 1
            await websocket.send_json(msg)
    except WebSocketDisconnect:
        for t in day_tasks:
            t.cancel()
        meta_task.cancel()
        local_services_task.cancel()
        return

    # Wait for all tasks + meta + local services
    await asyncio.gather(*day_tasks, return_exceptions=True)
    try:
        meta = await asyncio.wait_for(meta_task, timeout=25.0)
    except Exception:
        meta = {}

    local_services_data: dict = {}
    try:
        local_services_data = await asyncio.wait_for(local_services_task, timeout=30.0)
    except Exception:
        pass

    route_stops: dict = {}
    if route_stops_task:
        try:
            route_stops = await asyncio.wait_for(route_stops_task, timeout=20.0)
        except Exception:
            pass

    # If every day failed, mark as failed
    if len(day_errors) == total_days:
        itinerary.status = "failed"
        itinerary.error_message = "All day generations failed"
        await db.commit()
        try:
            await websocket.send_json({"type": "error", "message": "Generation failed. Please try again."})
        except Exception:
            pass
        return

    # ── Combine + geocode + save ──────────────────────────────────────────────

    classified_map = {c["day"]: c for c in classified}
    all_days = []
    for day_num in sorted(day_texts.keys()):
        try:
            cleaned = _clean_json(day_texts[day_num])
            day_data = json.loads(cleaned)
            day_data.setdefault("day_type", day_type_map.get(day_num, "destination"))
            c = classified_map.get(day_num, {})
            if "arrival_time" in c:
                day_data["arrival_time"] = c["arrival_time"]
            if "departure_time" in c:
                day_data["departure_time"] = c["departure_time"]
            all_days.append(day_data)
        except Exception:
            # Skip malformed days
            pass

    # Geocode all activities via Mapbox — skip travel day stubs (no activities)
    activities_to_geocode: list[tuple[dict, str]] = []
    for day in all_days:
        if day.get("day_type") in ("travel_outbound", "travel_return"):
            continue
        for activity in day.get("activities", []):
            query = f"{activity.get('name', '')}, {trip.destination}"
            activities_to_geocode.append((activity, query))

    if activities_to_geocode:
        geo_results = await asyncio.gather(
            *[geocode(q) for _, q in activities_to_geocode],
            return_exceptions=True,
        )
        for (activity, _), result in zip(activities_to_geocode, geo_results):
            if isinstance(result, tuple):
                activity["lat"], activity["lng"] = result

    # Remove any activity that already appeared on an earlier day (skip travel stubs)
    seen_names: set[str] = set()
    for day in all_days:
        if day.get("day_type") in ("travel_outbound", "travel_return"):
            continue
        unique: list[dict] = []
        for act in day.get("activities", []):
            key = act.get("name", "").lower().strip()
            if key and key not in seen_names:
                seen_names.add(key)
                unique.append(act)
        day["activities"] = unique

    # Inject city and city_transition metadata from day outline
    outline_map = {e["day"]: e for e in day_outline}
    prev_city: str | None = None
    for day_data in all_days:
        day_num = day_data.get("day")
        entry = outline_map.get(day_num)
        if entry:
            city = (entry.get("city") or "").strip()
            if city:
                day_data["city"] = city
            drive_hours = entry.get("drive_from_prev_hours")
            if drive_hours and prev_city and city and city != prev_city:
                day_data["city_transition"] = {
                    "from_city": prev_city,
                    "to_city": city,
                    "drive_hours": drive_hours,
                }
            if city:
                prev_city = city

    # NN-reorder by proximity, redistribute times, then sort chronologically
    for day in all_days:
        if day.get("day_type") in ("travel_outbound", "travel_return"):
            continue
        day["activities"] = _reorder_and_retime(day["activities"])

    # Fetch Wikipedia images + Foursquare restaurant ratings in parallel
    all_activities: list[dict] = [
        activity
        for day in all_days
        if day.get("day_type") not in ("travel_outbound", "travel_return")
        for activity in day.get("activities", [])
    ]
    foursquare_task = asyncio.create_task(
        asyncio.wait_for(enrich_restaurants(all_days, trip.destination), timeout=15.0)
    )
    try:
        img_results = await asyncio.wait_for(
            asyncio.gather(
                *[
                    fetch_activity_image(
                        a.get("name", ""),
                        a.get("category", ""),
                        trip.destination,
                    )
                    for a in all_activities
                ],
                return_exceptions=True,
            ),
            timeout=12.0,
        )
        for activity, img in zip(all_activities, img_results):
            if isinstance(img, str) and img:
                activity["image_url"] = img
    except Exception:
        pass
    try:
        await foursquare_task
    except Exception:
        pass

    # Stamp structured weather onto each day object
    for day_data in all_days:
        day_date = day_data.get("date")
        if day_date and day_date in weather_structured:
            wx = weather_structured[day_date]
            day_data["weather"] = {
                "condition": wx["condition"],
                "high_c":    wx["high_c"],
                "low_c":     wx["low_c"],
                "precip_mm": wx["precip_mm"],
            }
            if "sunrise" in wx:
                day_data["sunrise"] = wx["sunrise"]
            if "sunset" in wx:
                day_data["sunset"] = wx["sunset"]

    # Prefer day-outline-derived overview; fall back to meta's route_overview
    route_overview = _compute_route_overview(day_outline)
    if not route_overview:
        meta_overview = meta.get("route_overview") or []
        if isinstance(meta_overview, list) and len(meta_overview) > 1:
            route_overview = [
                {"city": o.get("city", ""), "nights": o.get("nights", 1)}
                for o in meta_overview
                if o.get("city")
            ]

    full_itinerary = {
        "destination": meta.get("destination", trip.destination),
        "country": meta.get("country", ""),
        "summary": meta.get("summary", ""),
        "days": all_days,
        "practical_info": meta.get("practical_info", {}),
        "accommodations": meta.get("accommodations", []),
        "weather": weather_summary,
        "route_stops": route_stops if route_stops else None,
        "route_overview": route_overview if route_overview else None,
    }

    itinerary.content = json.dumps(full_itinerary)
    itinerary.status = "done"
    itinerary.model_used = "gemini-2.5-flash"
    itinerary.generated_at = datetime.now(timezone.utc)
    if local_services_data:
        itinerary.local_services = json.dumps(local_services_data)

    user.gen_count = (user.gen_count or 0) + 1
    await db.commit()

    try:
        await websocket.send_json({"type": "complete"})
        await websocket.close()
    except Exception:
        pass


# ── Activity CRUD ─────────────────────────────────────────────────────────────

@router.delete("/{public_id}/days/{day}/activities/{index}")
async def delete_activity(
    public_id: str,
    day: int,
    index: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json.loads(trip.itinerary.content)
    content["days"][day - 1]["activities"].pop(index)
    trip.itinerary.content = json.dumps(content)
    await db.commit()
    return _content_response(trip.id, trip.itinerary)


@router.post("/{public_id}/days/{day}/activities")
async def add_activity(
    public_id: str,
    day: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json.loads(trip.itinerary.content)
    activities = content["days"][day - 1]["activities"]
    activity = body.get("activity", {})
    position = body.get("position")
    if position is None or position == -1:
        activities.append(activity)
    else:
        activities.insert(position, activity)
    trip.itinerary.content = json.dumps(content)
    await db.commit()
    return _content_response(trip.id, trip.itinerary)


@router.put("/{public_id}/days/{day}/activities/reorder")
async def reorder_activities(
    public_id: str,
    day: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json.loads(trip.itinerary.content)
    activities = content["days"][day - 1]["activities"]
    new_order = body.get("new_order", [])
    content["days"][day - 1]["activities"] = [activities[i] for i in new_order]
    trip.itinerary.content = json.dumps(content)
    await db.commit()
    return _content_response(trip.id, trip.itinerary)


# ── Packing List ──────────────────────────────────────────────────────────────

@router.get("/{public_id}/packing-list")
async def get_packing_list(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    if not trip.itinerary or trip.itinerary.status != "done":
        raise HTTPException(status_code=400, detail="Itinerary not yet generated")

    # Return cached result if available
    if trip.itinerary.packing_list:
        return json.loads(trip.itinerary.packing_list)

    # Extract activities and full weather context from itinerary content
    content = json.loads(trip.itinerary.content)
    activities = [
        a["name"]
        for day in content.get("days", [])
        for a in day.get("activities", [])
        if a.get("name")
    ]
    packing_suggestions = content.get("practical_info", {}).get("packing_suggestions", [])

    # Build a rich weather summary for the packing prompt
    wx = content.get("weather", {})
    day_wx_parts = [
        f"{d['date']}: {d['weather']['condition']} {d['weather']['high_c']}°C/{d['weather']['low_c']}°C"
        f"{(', ' + str(d['weather']['precip_mm']) + 'mm rain') if d['weather'].get('precip_mm', 0) > 2 else ''}"
        for d in content.get("days", [])
        if d.get("weather")
    ]
    if wx:
        weather_summary = (
            f"Overall: {wx.get('dominant_condition')}, avg {wx.get('avg_high_c')}°C/{wx.get('avg_low_c')}°C, "
            f"{wx.get('rain_days', 0)} rain day(s) out of {wx.get('total_days')}. "
            f"{'Forecast data.' if wx.get('is_forecast') else 'Based on historical averages for this time of year.'}"
            + (f" Day-by-day: {'; '.join(day_wx_parts)}" if day_wx_parts else "")
        )
    else:
        weather_summary = "; ".join(day_wx_parts) if day_wx_parts else ""

    packing = await generate_packing_list(
        trip, weather_summary, activities + packing_suggestions
    )

    # Cache to avoid redundant Claude calls
    trip.itinerary.packing_list = json.dumps(packing)
    await db.commit()
    return packing


# ── Local Services ────────────────────────────────────────────────────────────

@router.get("/{public_id}/local-services")
async def get_local_services(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    if not trip.itinerary:
        raise HTTPException(status_code=400, detail="Itinerary not yet generated")

    # Return cached data regardless of current itinerary status
    if trip.itinerary.local_services:
        return json.loads(trip.itinerary.local_services)

    if trip.itinerary.status != "done":
        raise HTTPException(status_code=400, detail="Itinerary not yet generated")

    # Generate on-demand: extract city info from stored itinerary content
    content = json.loads(trip.itinerary.content) if trip.itinerary.content else {}
    day_outline = [
        {"city": day.get("city", ""), "day": day.get("day")}
        for day in content.get("days", [])
        if day.get("city")
    ]

    try:
        local_services = await generate_local_services(trip, day_outline or None)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Local services generation failed ({type(exc).__name__}): {exc}") from exc
    trip.itinerary.local_services = json.dumps(local_services)
    await db.commit()
    return local_services


# ── AI Chat (SSE) ─────────────────────────────────────────────────────────────

@router.post("/{public_id}/chat")
async def chat(
    public_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)

    return StreamingResponse(
        stream_chat_response(trip, trip.itinerary, body.phase, body.history, body.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Single Day Regeneration (WebSocket) ───────────────────────────────────────

@router.websocket("/generate/{public_id}/day/{day_num}")
async def regenerate_day(
    websocket: WebSocket,
    public_id: str,
    day_num: int,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()
    try:
        user_id = decode_token(token)
        user = await db.get(User, user_id)
        if not user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            return

        trip = await _get_trip_by_public_id(public_id, db)
        if not trip or trip.user_id != user.id or not trip.itinerary:
            await websocket.send_json({"type": "error", "message": "Trip not found"})
            return

        content = json.loads(trip.itinerary.content)
        days = content.get("days", [])
        if day_num < 1 or day_num > len(days):
            await websocket.send_json({"type": "error", "message": "Day not found"})
            return

        day_entry = days[day_num - 1]
        day_date = day_entry.get("date", "")

        await websocket.send_json({"type": "started", "day": day_num})

        # Fetch weather for this specific day
        weather: dict[str, str] = {}
        if trip.destination_lat and trip.destination_lng:
            try:
                weather = await asyncio.wait_for(
                    get_weather_context(
                        trip.destination_lat, trip.destination_lng,
                        trip.start_date, trip.end_date,
                    ),
                    timeout=3.0,
                )
            except Exception:
                pass
        weather_for_day = weather.get(day_date, "Weather data not available")

        full_text = ""
        async for chunk in generate_single_day_stream(
            trip, weather_for_day, day_num, day_date, len(days), day_outline=[]
        ):
            await websocket.send_json({"type": "day_chunk", "day": day_num, "content": chunk})
            full_text += chunk

        # Parse and persist the regenerated day
        cleaned = _clean_json(full_text)
        new_day = json.loads(cleaned)
        content["days"][day_num - 1] = new_day
        trip.itinerary.content = json.dumps(content)
        trip.itinerary.packing_list = None  # Invalidate packing cache
        await db.commit()

        await websocket.send_json({"type": "complete", "day": day_num})
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
