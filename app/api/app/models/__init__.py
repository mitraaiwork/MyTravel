# Import all models here so Alembic can discover them for autogenerate
from app.models.user import User
from app.models.trip import Trip, Itinerary

__all__ = ["User", "Trip", "Itinerary"]
