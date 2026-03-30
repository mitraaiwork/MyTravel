import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip
from app.models.user import User
from app.schemas.trip import TripCreate, TripOut
from app.dependencies.auth import get_current_user
from app.services.maps.mapbox import geocode

router = APIRouter()


async def _get_trip_by_public_id(public_id: str, db: AsyncSession) -> Trip | None:
    result = await db.scalars(
        select(Trip).where(Trip.public_id == public_id).options(selectinload(Trip.itinerary))
    )
    return result.first()


@router.post("/", response_model=TripOut)
async def create_trip(
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = Trip(**body.model_dump(), user_id=user.id)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    # Geocode destination for map pins and weather
    coords = await geocode(trip.destination)
    if coords:
        trip.destination_lat, trip.destination_lng = coords
        month_year = trip.start_date.strftime("%b %Y")
        trip.title = f"{trip.destination} · {month_year}"
        await db.commit()

    result = await db.scalars(
        select(Trip).where(Trip.id == trip.id).options(selectinload(Trip.itinerary))
    )
    return result.first()


@router.get("/", response_model=list[TripOut])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.scalars(
        select(Trip)
        .where(Trip.user_id == user.id)
        .options(selectinload(Trip.itinerary))
        .order_by(Trip.created_at.desc())
    )
    return result.all()


@router.get("/{public_id}", response_model=TripOut)
async def get_trip(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.delete("/{public_id}", status_code=204)
async def delete_trip(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404, detail="Trip not found")
    await db.delete(trip)
    await db.commit()


@router.post("/{public_id}/share", response_model=TripOut)
async def enable_share(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    if not trip.share_token:
        trip.share_token = secrets.token_urlsafe(12)
    trip.share_enabled = True
    await db.commit()
    return await _get_trip_by_public_id(public_id, db)


@router.post("/{public_id}/unshare", response_model=TripOut)
async def disable_share(
    public_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = await _get_trip_by_public_id(public_id, db)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    trip.share_enabled = False
    await db.commit()
    return await _get_trip_by_public_id(public_id, db)
