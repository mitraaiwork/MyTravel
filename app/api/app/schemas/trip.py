from datetime import date, datetime
from pydantic import BaseModel, field_validator


class TripCreate(BaseModel):
    destination: str
    start_date: date
    end_date: date
    travel_style: str           # e.g. "Nature,Food,Culture"
    mobility_level: str = "full"
    budget_amount: float | None = None
    budget_currency: str = "CAD"
    group_size: int = 1
    group_type: str = "solo"
    pace: str = "moderate"
    interests: str | None = None
    accommodation_type: str | None = None  # comma-separated, e.g. "cabin,glamping"

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


class TripOut(TripCreate):
    id: int
    public_id: str
    user_id: int
    title: str | None
    destination_lat: float | None
    destination_lng: float | None
    share_token: str | None
    share_enabled: bool
    itinerary_generated: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
