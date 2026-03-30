import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip

router = APIRouter()


@router.get("/{token}")
async def get_shared_trip(token: str, db: AsyncSession = Depends(get_db)):
    trip = await db.scalar(
        select(Trip)
        .where(Trip.share_token == token, Trip.share_enabled == True)
        .options(selectinload(Trip.itinerary))
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Share link not found or has been disabled")

    if not trip.itinerary or not trip.itinerary.content or trip.itinerary.status != "done":
        raise HTTPException(status_code=404, detail="Itinerary not available")

    content = json.loads(trip.itinerary.content)
    content["trip_id"] = trip.id
    content["generated_at"] = (
        trip.itinerary.generated_at.isoformat() if trip.itinerary.generated_at else None
    )
    return content
