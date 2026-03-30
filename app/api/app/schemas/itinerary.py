from pydantic import BaseModel


class ItineraryOut(BaseModel):
    trip_id: int
    status: str
    content: dict | None  # Parsed JSON from Claude

    model_config = {"from_attributes": True}
