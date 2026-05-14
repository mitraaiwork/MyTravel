import json
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from typing import Any


class TripFeedbackIn(BaseModel):
    overall_rating: int | None = None
    itinerary_rating: int | None = None
    restaurant_rating: int | None = None
    flow_rating: int | None = None
    pace_rating: int | None = None
    keep_list: list[str] | None = None
    skip_list: list[str] | None = None
    notes: str | None = None


class TripFeedbackOut(BaseModel):
    id: int
    trip_id: int
    overall_rating: int | None = None
    itinerary_rating: int | None = None
    restaurant_rating: int | None = None
    flow_rating: int | None = None
    pace_rating: int | None = None
    keep_list: list[str] | None = None
    skip_list: list[str] | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def parse_json_lists(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            # ORM object — convert to dict
            obj = data.__dict__.copy()
            for field in ("keep_list", "skip_list"):
                val = obj.get(field)
                if isinstance(val, str):
                    try:
                        obj[field] = json.loads(val)
                    except Exception:
                        obj[field] = []
            return obj
        # Plain dict
        for field in ("keep_list", "skip_list"):
            val = data.get(field)
            if isinstance(val, str):
                try:
                    data[field] = json.loads(val)
                except Exception:
                    data[field] = []
        return data


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    phase: str = "pre-trip"
