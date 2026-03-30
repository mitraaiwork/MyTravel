import secrets
from datetime import date, datetime
from sqlalchemy import String, Integer, Date, ForeignKey, Text, DateTime, Boolean, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(
        String(32), unique=True, index=True,
        default=lambda: secrets.token_urlsafe(12),
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    destination: Mapped[str] = mapped_column(String(255))
    destination_lat: Mapped[float | None] = mapped_column(Float)
    destination_lng: Mapped[float | None] = mapped_column(Float)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    travel_style: Mapped[str] = mapped_column(String(255))  # e.g. "Nature,Food,Culture"
    mobility_level: Mapped[str] = mapped_column(String(50), default="full")
    budget_amount: Mapped[float | None] = mapped_column(Float)
    budget_currency: Mapped[str] = mapped_column(String(3), default="CAD")
    group_size: Mapped[int] = mapped_column(Integer, default=1)
    group_type: Mapped[str] = mapped_column(String(50), default="solo")
    pace: Mapped[str] = mapped_column(String(20), default="moderate")
    interests: Mapped[str | None] = mapped_column(Text)
    accommodation_type: Mapped[str | None] = mapped_column(String(255))  # e.g. "cabin,glamping"
    share_token: Mapped[str | None] = mapped_column(String(64), unique=True)
    share_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    itinerary: Mapped["Itinerary | None"] = relationship(
        back_populates="trip", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def itinerary_generated(self) -> bool:
        return self.itinerary is not None and self.itinerary.status == "done"


class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), unique=True)
    content: Mapped[str | None] = mapped_column(Text)       # Full JSON string from Claude
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|generating|done|failed
    model_used: Mapped[str | None] = mapped_column(String(50))
    error_message: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    trip: Mapped["Trip"] = relationship(back_populates="itinerary")
