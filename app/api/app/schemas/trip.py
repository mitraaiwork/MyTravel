from datetime import date, datetime
from pydantic import BaseModel, field_validator


class TripCreate(BaseModel):
    destination: str
    origin: str | None = None
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
    include_route_stops: bool = False
    trip_type: str = "destination"
    arrive_destination_date: date | None = None
    arrive_destination_time: str | None = None
    leave_destination_date: date | None = None
    leave_destination_time: str | None = None
    include_return_stops: bool = False

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v

    @field_validator("arrive_destination_date")
    @classmethod
    def arrive_date_in_range(cls, v, info):
        if v is None:
            return v
        start = info.data.get("start_date")
        end = info.data.get("end_date")
        if start and v < start:
            raise ValueError("arrive_destination_date must be on or after start_date")
        if end and v > end:
            raise ValueError("arrive_destination_date must be on or before end_date")
        return v

    @field_validator("leave_destination_date")
    @classmethod
    def leave_date_in_range(cls, v, info):
        if v is None:
            return v
        arrive = info.data.get("arrive_destination_date")
        end = info.data.get("end_date")
        if arrive and v < arrive:
            raise ValueError("leave_destination_date must be on or after arrive_destination_date")
        if end and v > end:
            raise ValueError("leave_destination_date must be on or before end_date")
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
