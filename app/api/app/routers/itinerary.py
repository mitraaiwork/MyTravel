import asyncio
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip, Itinerary
from app.models.user import User
from app.services.ai.itinerary import generate_single_day_stream, generate_meta, generate_day_outline
from app.services.ai.weather import get_weather_context
from app.services.maps.mapbox import geocode
from app.dependencies.auth import get_current_user
from app.auth import decode_token
from app.config import settings
from app.services.images import fetch_activity_image

router = APIRouter()


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

    # Generation cap check
    GEN_LIMIT = settings.free_tier_gen_limit
    if (user.gen_count or 0) >= GEN_LIMIT:
        await websocket.send_json({
            "type": "cap_reached",
            "message": f"You have used all {GEN_LIMIT} free generations. Upgrade to Premium for unlimited itineraries.",
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

    # Build date list
    dates = list(_iter_dates(trip.start_date, trip.end_date))
    total_days = len(dates)
    day_list = [{"day": i + 1, "date": str(d)} for i, d in enumerate(dates)]

    # Send "started" immediately with day list so UI can render all skeletons
    await websocket.send_json({"type": "started", "days": day_list})

    # Pre-planning: assign each day a distinct area (fast Haiku call, non-blocking)
    day_outline: list[dict] = []
    try:
        day_outline = await asyncio.wait_for(
            generate_day_outline(trip, day_list),
            timeout=10.0,
        )
    except Exception:
        pass  # degrade gracefully — days still generate without the outline

    # Fetch weather (non-blocking, 3s cap)
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

    # ── Parallel day streaming ────────────────────────────────────────────────

    queue: asyncio.Queue[dict] = asyncio.Queue()
    day_texts: dict[int, str] = {}
    day_errors: set[int] = set()

    async def stream_one_day(day_num: int, day_date: str):
        weather_for_day = weather.get(day_date, "Weather data not available")
        text = ""
        try:
            async for chunk in generate_single_day_stream(
                trip, weather_for_day, day_num, day_date, total_days,
                day_outline=day_outline,
            ):
                text += chunk
                await queue.put({"type": "day_chunk", "day": day_num, "content": chunk})
            day_texts[day_num] = text
            await queue.put({"type": "day_done", "day": day_num})
        except Exception as e:
            day_errors.add(day_num)
            await queue.put({"type": "day_error", "day": day_num, "error": str(e)})

    # Launch all day tasks + meta task in parallel
    day_tasks = [
        asyncio.create_task(stream_one_day(i + 1, str(d)))
        for i, d in enumerate(dates)
    ]
    meta_task = asyncio.create_task(generate_meta(trip, day_outline))

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
        return

    # Wait for all tasks + meta
    await asyncio.gather(*day_tasks, return_exceptions=True)
    try:
        meta = await asyncio.wait_for(meta_task, timeout=25.0)
    except Exception:
        meta = {}

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

    all_days = []
    for day_num in sorted(day_texts.keys()):
        try:
            cleaned = _clean_json(day_texts[day_num])
            day_data = json.loads(cleaned)
            all_days.append(day_data)
        except Exception:
            # Skip malformed days
            pass

    # Geocode activities with missing/zero coordinates
    activities_to_geocode: list[tuple[dict, str]] = []
    for day in all_days:
        for activity in day.get("activities", []):
            lat = activity.get("lat") or 0
            lng = activity.get("lng") or 0
            if not lat or not lng or abs(lat) < 0.001 or abs(lng) < 0.001:
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

    # Fetch one Wikipedia image per activity (parallel, 12s cap)
    all_activities: list[dict] = [
        activity
        for day in all_days
        for activity in day.get("activities", [])
    ]
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

    full_itinerary = {
        "destination": meta.get("destination", trip.destination),
        "country": meta.get("country", ""),
        "summary": meta.get("summary", ""),
        "days": all_days,
        "practical_info": meta.get("practical_info", {}),
        "accommodations": meta.get("accommodations", []),
    }

    itinerary.content = json.dumps(full_itinerary)
    itinerary.status = "done"
    itinerary.model_used = "claude-sonnet-4-6"
    itinerary.generated_at = datetime.now(timezone.utc)

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
