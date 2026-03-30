# MyTravel — Technical Solution Document

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Living Document
**Audience**: Developers implementing the MyTravel platform
**Purpose**: Concrete, step-by-step technical guide for building the MyTravel full-stack application — dev environment setup, backend implementation, AI integration, frontend structure, payments, deployment, and CI/CD.

---

## Table of Contents

1. [Dev Environment Setup](#1-dev-environment-setup)
2. [Monorepo Scaffold](#2-monorepo-scaffold)
3. [Database — Models and Migrations](#3-database--models-and-migrations)
4. [FastAPI Backend — Core Setup](#4-fastapi-backend--core-setup)
5. [Authentication](#5-authentication)
6. [AI Integration — Claude API](#6-ai-integration--claude-api)
7. [Key API Routers](#7-key-api-routers)
8. [Background Jobs — ARQ](#8-background-jobs--arq)
9. [Cottage & Cabin Affiliate Search](#9-cottage--cabin-affiliate-search)
10. [Next.js Web Frontend](#10-nextjs-web-frontend)
11. [Mapbox Integration](#11-mapbox-integration)
12. [Payments — Stripe and RevenueCat](#12-payments--stripe-and-revenuecat)
13. [Deployment](#13-deployment)
14. [CI/CD — GitHub Actions](#14-cicd--github-actions)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Development Workflow](#16-development-workflow)

---

## 1. Dev Environment Setup

### 1.1 Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.12+ | `pyenv install 3.12` |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node.js | 22 LTS | `nvm install 22` |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker Desktop | latest | docker.com/desktop |
| Git | 2.40+ | git-scm.com |

### 1.2 Clone and bootstrap

```bash
git clone https://github.com/amitra1976/MyTravel.git
cd MyTravel

# Backend dependencies
cd apps/api
uv sync

# All Node.js workspaces
cd ../..
pnpm install

# Local infrastructure (Postgres + Redis)
docker compose up -d
```

### 1.3 Local `docker-compose.yml`

Place this at the repository root:

```yaml
version: "3.9"
services:
  postgres:
    image: supabase/postgres:16.1.0.117
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mytravel
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### 1.4 Run everything locally

```bash
# Terminal 1 — FastAPI dev server (auto-reload)
cd apps/api && uv run uvicorn main:app --reload --port 8000

# Terminal 2 — ARQ worker
cd apps/api && uv run arq app.worker.WorkerSettings

# Terminal 3 — Next.js dev server
cd apps/web && pnpm dev
```

---

## 2. Monorepo Structure

```
MyTravel/
├── apps/
│   ├── api/                        # FastAPI backend (Python 3.12)
│   │   ├── pyproject.toml
│   │   ├── main.py                 # FastAPI app factory
│   │   ├── app/
│   │   │   ├── routers/
│   │   │   │   ├── auth.py
│   │   │   │   ├── trips.py
│   │   │   │   ├── itinerary.py
│   │   │   │   ├── compare.py
│   │   │   │   ├── concierge.py
│   │   │   │   ├── packing.py
│   │   │   │   ├── cottages.py
│   │   │   │   └── payments.py
│   │   │   ├── services/
│   │   │   │   ├── ai/
│   │   │   │   │   ├── itinerary.py
│   │   │   │   │   ├── concierge.py
│   │   │   │   │   ├── compare.py
│   │   │   │   │   ├── packing.py
│   │   │   │   │   └── cottage_match.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── stripe.py
│   │   │   │   └── cottages.py
│   │   │   ├── models/
│   │   │   │   ├── base.py
│   │   │   │   ├── user.py
│   │   │   │   ├── trip.py
│   │   │   │   ├── itinerary.py
│   │   │   │   └── cottage.py
│   │   │   ├── schemas/            # Pydantic v2 schemas
│   │   │   │   ├── auth.py
│   │   │   │   ├── trip.py
│   │   │   │   ├── itinerary.py
│   │   │   │   └── cottage.py
│   │   │   ├── db.py               # SQLAlchemy async engine + session
│   │   │   ├── redis.py            # Upstash Redis client
│   │   │   ├── worker.py           # ARQ worker settings
│   │   │   ├── tasks.py            # Background job functions
│   │   │   ├── auth.py             # JWT utilities
│   │   │   └── config.py           # Settings (Pydantic BaseSettings)
│   │   └── alembic/
│   │       ├── env.py
│   │       └── versions/
│   │
│   ├── web/                        # Next.js 15 web frontend
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Marketing / landing
│   │   │   ├── dashboard/
│   │   │   ├── trips/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   │       └── itinerary/
│   │   │   ├── cottages/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   ├── concierge/
│   │   │   └── compare/
│   │   └── components/
│   │       ├── ui/                 # shadcn/ui components
│   │       ├── map/
│   │       ├── itinerary/
│   │       └── cottages/
│   │
│   └── mobile/                     # React Native + Expo SDK 52
│       ├── package.json
│       ├── app/                    # Expo Router file-based routing
│       │   ├── (tabs)/
│       │   │   ├── index.tsx       # Dashboard
│       │   │   ├── trips.tsx
│       │   │   ├── cottages.tsx
│       │   │   └── profile.tsx
│       │   └── trip/[id]/
│       └── components/
│
├── packages/
│   ├── generated-types/            # Auto-generated from FastAPI OpenAPI spec
│   │   └── index.ts
│   └── eslint-config/
│
├── demo/                           # Static HTML demo (current)
├── Docs/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── .github/
    └── workflows/
```

### 2.1 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/web"
  - "apps/mobile"
  - "packages/*"
```

### 2.2 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

---

## 3. Database — Models and Migrations

### 3.1 Async SQLAlchemy engine (`app/db.py`)

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.database_url,  # postgresql+asyncpg://...
    pool_size=10,
    max_overflow=20,
    echo=settings.debug,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

### 3.2 User model (`app/models/user.py`)

```python
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255))
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    apple_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
```

### 3.3 Trip model (`app/models/trip.py`)

```python
from datetime import date, datetime
from sqlalchemy import String, Integer, Date, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    destination: Mapped[str] = mapped_column(String(255))
    destination_lat: Mapped[float | None]
    destination_lng: Mapped[float | None]
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    travel_style: Mapped[str] = mapped_column(String(50))  # adventure, cultural, relaxed
    budget_level: Mapped[str] = mapped_column(String(20))  # budget, mid, luxury
    group_size: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="planning")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    itinerary: Mapped["Itinerary | None"] = relationship(back_populates="trip")
    accommodations: Mapped[list["TripAccommodation"]] = relationship(back_populates="trip")

class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), unique=True)
    content: Mapped[str] = mapped_column(Text)   # JSON string of day-by-day plan
    model_used: Mapped[str] = mapped_column(String(50))
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    trip: Mapped["Trip"] = relationship(back_populates="itinerary")
```

### 3.4 Cottage models (`app/models/cottage.py`)

```python
from sqlalchemy import String, Integer, Float, ForeignKey, Text, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class CottageProperty(Base):
    __tablename__ = "cottage_properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(255), index=True)
    source: Mapped[str] = mapped_column(String(50))   # vrbo | airbnb | booking
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255))
    lat: Mapped[float | None]
    lng: Mapped[float | None]
    price_per_night: Mapped[float]
    currency: Mapped[str] = mapped_column(String(3), default="CAD")
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    rating: Mapped[float | None]
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    amenities: Mapped[str | None] = mapped_column(Text)  # JSON array
    property_type: Mapped[str] = mapped_column(String(50))
    image_urls: Mapped[str | None] = mapped_column(Text)  # JSON array
    booking_url: Mapped[str] = mapped_column(String(512))
    affiliate_tag: Mapped[str | None] = mapped_column(String(100))
    last_refreshed: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class TripAccommodation(Base):
    __tablename__ = "trip_accommodations"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("cottage_properties.id"))
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    trip: Mapped["Trip"] = relationship(back_populates="accommodations")
    property: Mapped["CottageProperty"] = relationship()

class SavedProperty(Base):
    __tablename__ = "saved_properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("cottage_properties.id"))
    saved_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

### 3.5 Alembic setup

```bash
# Initialize (run once)
cd apps/api
uv run alembic init alembic

# Generate a migration after model changes
uv run alembic revision --autogenerate -m "add cottage tables"

# Apply migrations
uv run alembic upgrade head

# Rollback one step
uv run alembic downgrade -1
```

**`alembic/env.py`** — key lines to configure async support:

```python
from app.db import Base
from app.models import user, trip, cottage  # import all models so Alembic sees them

target_metadata = Base.metadata

# Use run_sync for async engines
def run_migrations_online():
    connectable = engine_from_config(...)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

---

## 4. FastAPI Backend — Core Setup

### 4.1 `app/config.py` — Settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str  # postgresql+asyncpg://user:pass@host/db

    # Redis
    redis_url: str     # redis://...

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Anthropic
    anthropic_api_key: str

    # Mapbox
    mapbox_token: str

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_premium_price_id: str

    # OAuth
    google_client_id: str
    google_client_secret: str

    # App
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

settings = Settings()
```

### 4.2 `main.py` — App factory

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine
from app.routers import auth, trips, itinerary, compare, concierge, packing, cottages, payments

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="MyTravel API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(trips.router, prefix="/trips", tags=["trips"])
app.include_router(itinerary.router, prefix="/itinerary", tags=["itinerary"])
app.include_router(compare.router, prefix="/compare", tags=["compare"])
app.include_router(concierge.router, prefix="/concierge", tags=["concierge"])
app.include_router(packing.router, prefix="/packing", tags=["packing"])
app.include_router(cottages.router, prefix="/cottages", tags=["cottages"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### 4.3 Dependency injection pattern

```python
# app/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.user import User
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

async def require_premium(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_premium:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Premium required")
    return current_user
```

---

## 5. Authentication

### 5.1 Email/password auth router (`app/routers/auth.py`)

```python
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.user import User
from app.config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.secret_key, algorithm=settings.algorithm)

@router.post("/register")
async def register(email: str, password: str, full_name: str, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        hashed_password=pwd_context.hash(password),
        full_name=full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}

@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == form.username))
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}
```

### 5.2 Google OAuth

```python
# Use authlib for OAuth code flow
# pip install authlib httpx

from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.get("/google")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token["userinfo"]

    user = await db.scalar(select(User).where(User.google_id == user_info["sub"]))
    if not user:
        user = User(
            email=user_info["email"],
            full_name=user_info["name"],
            avatar_url=user_info.get("picture"),
            google_id=user_info["sub"],
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {"access_token": create_access_token(user.id), "token_type": "bearer"}
```

---

## 6. AI Integration — Claude API

### 6.1 Install the SDK

```bash
cd apps/api
uv add anthropic
```

### 6.2 Streaming itinerary generation (`app/services/ai/itinerary.py`)

This is the core AI feature. It streams the response token-by-token through a WebSocket so the user sees the itinerary being written in real time.

```python
import json
import anthropic
from app.config import settings
from app.models.trip import Trip

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

ITINERARY_SYSTEM_PROMPT = """
You are MyTravel's AI trip planner. Generate a detailed day-by-day itinerary in valid JSON.

Output format:
{
  "destination": "string",
  "summary": "string",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "activities": [
        {
          "time": "09:00",
          "title": "string",
          "description": "string",
          "location": "string",
          "duration_minutes": 90,
          "category": "food|nature|culture|adventure|shopping|transport",
          "tips": "string",
          "cost_estimate": "string"
        }
      ],
      "accommodation_note": "string",
      "meals": { "breakfast": "string", "lunch": "string", "dinner": "string" }
    }
  ],
  "packing_highlights": ["string"],
  "practical_notes": "string"
}

Be specific — name real restaurants, landmarks, neighbourhoods. Sequence activities logically by location to minimize travel time.
"""

async def generate_itinerary_stream(trip: Trip):
    """
    Async generator — yields text chunks as they arrive from Claude.
    Connect this to a WebSocket or SSE endpoint.
    """
    prompt = f"""
    Destination: {trip.destination}
    Travel dates: {trip.start_date} to {trip.end_date} ({(trip.end_date - trip.start_date).days + 1} days)
    Travel style: {trip.travel_style}
    Budget level: {trip.budget_level}
    Group size: {trip.group_size}
    Additional notes: {trip.notes or 'None'}

    Generate the complete itinerary JSON now.
    """

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=ITINERARY_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

### 6.3 WebSocket endpoint for streaming (`app/routers/itinerary.py`)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip
from app.services.ai.itinerary import generate_itinerary_stream
from app.auth import get_current_user

router = APIRouter()

@router.websocket("/generate/{trip_id}")
async def generate_itinerary_ws(
    trip_id: int,
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()

    trip = await db.get(Trip, trip_id)
    if not trip:
        await websocket.send_json({"error": "Trip not found"})
        await websocket.close()
        return

    full_text = ""
    try:
        async for chunk in generate_itinerary_stream(trip):
            full_text += chunk
            await websocket.send_text(chunk)
    except WebSocketDisconnect:
        return  # Client disconnected mid-stream — fine

    # Save completed itinerary
    from app.models.trip import Itinerary
    import json
    itinerary = Itinerary(
        trip_id=trip_id,
        content=full_text,
        model_used="claude-sonnet-4-6",
    )
    db.add(itinerary)
    await db.commit()

    await websocket.send_json({"event": "complete"})
    await websocket.close()
```

### 6.4 AI Concierge — chat (`app/services/ai/concierge.py`)

Uses `claude-haiku-4-5` (faster and cheaper) for back-and-forth chat.

```python
import anthropic
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

CONCIERGE_SYSTEM = """
You are MyTravel's AI Concierge — a knowledgeable local guide for the user's current trip destination.
Answer questions about restaurants, transport, customs, safety, weather, and practical tips.
Be conversational, specific, and concise. Always acknowledge the trip context provided.
"""

async def chat(destination: str, messages: list[dict]) -> str:
    """
    messages: list of {"role": "user"|"assistant", "content": "..."}
    Returns the assistant's reply as a string.
    """
    system = f"{CONCIERGE_SYSTEM}\n\nCurrent trip destination: {destination}"

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    return response.content[0].text
```

### 6.5 Destination Matchmaker (`app/services/ai/compare.py`)

```python
import json
import anthropic
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

COMPARE_SYSTEM = """
You are MyTravel's Destination Matchmaker. Compare 2–3 travel destinations and return a structured comparison.

Output valid JSON in this format:
{
  "destinations": [
    {
      "name": "string",
      "overall_score": 85,
      "summary": "string",
      "best_for": ["string"],
      "categories": {
        "weather": { "score": 80, "note": "string" },
        "cost": { "score": 70, "note": "string" },
        "activities": { "score": 90, "note": "string" },
        "food": { "score": 85, "note": "string" },
        "safety": { "score": 88, "note": "string" },
        "accessibility": { "score": 75, "note": "string" }
      },
      "recommended_duration": "5-7 days",
      "best_travel_months": ["June", "July", "August"]
    }
  ],
  "recommendation": "string",
  "verdict": "string"
}
"""

async def compare_destinations(destinations: list[str], travel_style: str, travel_dates: str) -> dict:
    prompt = f"""
    Compare these destinations: {', '.join(destinations)}
    Travel style: {travel_style}
    Planned travel period: {travel_dates}

    Return the comparison JSON now.
    """
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=COMPARE_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.content[0].text)
```

### 6.6 Cottage AI Match Scoring (`app/services/ai/cottage_match.py`)

Premium feature — scores up to 20 properties against a trip profile.

```python
import json
import anthropic
from app.config import settings
from app.models.trip import Trip

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

MATCH_SYSTEM = """
You are MyTravel's Property Matcher. Score cottage/cabin properties for how well they fit the user's trip profile.

For each property, return a JSON object with:
- "property_id": the external_id provided
- "score": integer 0–100 (100 = perfect match)
- "reason": one concise sentence explaining the score

Return a JSON array of these objects, one per property. Nothing else.
"""

async def score_properties(trip: Trip, properties: list[dict]) -> list[dict]:
    """
    properties: list of {"external_id": str, "title": str, "description": str,
                          "bedrooms": int, "amenities": list, "price_per_night": float}
    Returns list of {"property_id": str, "score": int, "reason": str}
    """
    trip_profile = f"""
    Destination: {trip.destination}
    Dates: {trip.start_date} to {trip.end_date}
    Travel style: {trip.travel_style}
    Budget: {trip.budget_level}
    Group size: {trip.group_size}
    Notes: {trip.notes or 'None'}
    """
    properties_text = json.dumps(properties[:20], indent=2)  # Cap at 20

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=MATCH_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"Trip profile:\n{trip_profile}\n\nProperties to score:\n{properties_text}"
        }],
    )
    return json.loads(response.content[0].text)
```

---

## 7. Key API Routers

### 7.1 Trips router (`app/routers/trips.py`)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip
from app.models.user import User
from app.auth import get_current_user
from app.schemas.trip import TripCreate, TripOut

router = APIRouter()

@router.post("/", response_model=TripOut)
async def create_trip(
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = Trip(**body.model_dump(), user_id=current_user.id)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip

@router.get("/", response_model=list[TripOut])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.scalars(select(Trip).where(Trip.user_id == current_user.id))
    return result.all()

@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != current_user.id:
        raise HTTPException(status_code=404)
    return trip
```

### 7.2 Pydantic schemas (`app/schemas/trip.py`)

```python
from datetime import date
from pydantic import BaseModel, field_validator

class TripCreate(BaseModel):
    destination: str
    start_date: date
    end_date: date
    travel_style: str
    budget_level: str
    group_size: int = 1
    notes: str | None = None

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v

class TripOut(TripCreate):
    id: int
    user_id: int
    status: str

    model_config = {"from_attributes": True}
```

---

## 8. Background Jobs — ARQ

ARQ is FastAPI's natural companion for background tasks — it uses the same async Python model.

### 8.1 Worker settings (`app/worker.py`)

```python
from arq import cron
from arq.connections import RedisSettings
from app.config import settings
from app.tasks import refresh_cottage_listings, export_trip_pdf

class WorkerSettings:
    functions = [refresh_cottage_listings, export_trip_pdf]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    on_startup = None
    on_shutdown = None
    cron_jobs = [
        cron(refresh_cottage_listings, hour=3, minute=0)  # refresh nightly at 3am
    ]
```

### 8.2 Task functions (`app/tasks.py`)

```python
async def refresh_cottage_listings(ctx):
    """
    Nightly job — fetches fresh property data from affiliate APIs
    and upserts into cottage_properties table.
    """
    from app.services.cottages import fetch_and_upsert_properties
    await fetch_and_upsert_properties()

async def export_trip_pdf(ctx, trip_id: int, user_id: int):
    """
    Generates a PDF of the trip itinerary using Playwright.
    Uploads to Cloudflare R2 and stores the URL.
    """
    from app.services.pdf import render_trip_pdf
    pdf_url = await render_trip_pdf(trip_id)
    # Store pdf_url in DB against the trip
    ...
```

### 8.3 Enqueue a job from a router

```python
from arq import create_pool
from arq.connections import RedisSettings
from app.config import settings

@router.post("/{trip_id}/export-pdf")
async def export_pdf(trip_id: int, current_user: User = Depends(get_current_user)):
    pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await pool.enqueue_job("export_trip_pdf", trip_id=trip_id, user_id=current_user.id)
    return {"message": "PDF export queued"}
```

---

## 9. Cottage & Cabin Affiliate Search

### 9.1 Architecture

Cottage search does **not** call affiliate APIs in real time (they are slow and rate-limited). Instead:
1. A nightly ARQ job fetches and caches property data in `cottage_properties`
2. Search queries run against the local Postgres table (fast)
3. Booking links redirect via affiliate URLs to the partner platform

### 9.2 Vrbo Partner API integration (`app/services/cottages.py`)

```python
import httpx
import json
from sqlalchemy.dialects.postgresql import insert
from app.db import AsyncSessionLocal
from app.models.cottage import CottageProperty
from app.config import settings

VRBO_API_BASE = "https://api.vrbo.com/v1"  # Confirm current endpoint in Vrbo Partner docs

async def fetch_vrbo_properties(location: str, limit: int = 50) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{VRBO_API_BASE}/properties/search",
            headers={"Authorization": f"Bearer {settings.vrbo_api_key}"},
            params={"location": location, "limit": limit},
        )
        response.raise_for_status()
        return response.json().get("properties", [])

async def upsert_vrbo_properties(raw_properties: list[dict]):
    async with AsyncSessionLocal() as db:
        for prop in raw_properties:
            stmt = insert(CottageProperty).values(
                external_id=prop["id"],
                source="vrbo",
                title=prop["headline"],
                description=prop.get("description"),
                location=prop["location"]["address"],
                lat=prop["location"].get("lat"),
                lng=prop["location"].get("lng"),
                price_per_night=prop["pricing"]["nightly_rate"],
                bedrooms=prop.get("bedrooms", 1),
                max_guests=prop.get("sleeps", 2),
                rating=prop.get("averageRating"),
                review_count=prop.get("reviewCount", 0),
                amenities=json.dumps(prop.get("amenities", [])),
                property_type=prop.get("propertyType", "Cottage"),
                image_urls=json.dumps([img["url"] for img in prop.get("images", [])[:5]]),
                booking_url=f"https://www.vrbo.com/{prop['id']}?affiliate={settings.vrbo_affiliate_id}",
                affiliate_tag=settings.vrbo_affiliate_id,
            ).on_conflict_do_update(
                index_elements=["external_id"],
                set_={"price_per_night": prop["pricing"]["nightly_rate"], "last_refreshed": func.now()}
            )
            await db.execute(stmt)
        await db.commit()
```

### 9.3 Cottages router (`app/routers/cottages.py`)

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.cottage import CottageProperty, SavedProperty, TripAccommodation
from app.models.user import User
from app.auth import get_current_user, require_premium
from app.services.ai.cottage_match import score_properties

router = APIRouter()

@router.get("/search")
async def search_cottages(
    location: str = Query(...),
    min_bedrooms: int = Query(1),
    max_price: float | None = Query(None),
    property_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    filters = [CottageProperty.location.ilike(f"%{location}%")]
    if min_bedrooms:
        filters.append(CottageProperty.bedrooms >= min_bedrooms)
    if max_price:
        filters.append(CottageProperty.price_per_night <= max_price)
    if property_type:
        filters.append(CottageProperty.property_type == property_type)

    result = await db.scalars(
        select(CottageProperty).where(and_(*filters)).limit(50)
    )
    return result.all()

@router.get("/{property_id}")
async def get_cottage(property_id: int, db: AsyncSession = Depends(get_db)):
    prop = await db.get(CottageProperty, property_id)
    if not prop:
        raise HTTPException(status_code=404)
    return prop

@router.post("/{property_id}/save")
async def save_cottage(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    saved = SavedProperty(user_id=current_user.id, property_id=property_id)
    db.add(saved)
    await db.commit()
    return {"saved": True}

@router.post("/ai-match/{trip_id}")
async def ai_match_cottages(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_premium),  # Premium only
):
    from app.models.trip import Trip
    trip = await db.get(Trip, trip_id)
    properties = await db.scalars(
        select(CottageProperty)
        .where(CottageProperty.location.ilike(f"%{trip.destination}%"))
        .limit(20)
    )
    props_list = [
        {"external_id": p.external_id, "title": p.title, "description": p.description or "",
         "bedrooms": p.bedrooms, "amenities": json.loads(p.amenities or "[]"),
         "price_per_night": p.price_per_night}
        for p in properties
    ]
    scores = await score_properties(trip, props_list)
    return scores
```

---

## 10. Next.js Web Frontend

### 10.1 Setup

```bash
cd apps/web
pnpm add axios @tanstack/react-query zustand
pnpm dlx shadcn@latest init
```

### 10.2 API client with type safety

```typescript
// apps/web/lib/api.ts
import axios from "axios";
import type { Trip, TripCreate, ItineraryDay } from "@mytravel/generated-types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const tripsApi = {
  list: () => api.get<Trip[]>("/trips").then((r) => r.data),
  create: (data: TripCreate) => api.post<Trip>("/trips", data).then((r) => r.data),
  get: (id: number) => api.get<Trip>(`/trips/${id}`).then((r) => r.data),
};

export const cottagesApi = {
  search: (params: Record<string, string | number>) =>
    api.get("/cottages/search", { params }).then((r) => r.data),
  get: (id: number) => api.get(`/cottages/${id}`).then((r) => r.data),
};
```

### 10.3 Streaming itinerary with WebSocket

```typescript
// apps/web/hooks/useItineraryStream.ts
import { useState, useCallback } from "react";

export function useItineraryStream(tripId: number) {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startStream = useCallback(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/itinerary/generate/${tripId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setIsStreaming(true);

    ws.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith("{")) {
        const msg = JSON.parse(data);
        if (msg.event === "complete") {
          setIsStreaming(false);
          setIsComplete(true);
          ws.close();
        }
      } else {
        setText((prev) => prev + data);
      }
    };

    ws.onerror = () => setIsStreaming(false);
  }, [tripId]);

  return { text, isStreaming, isComplete, startStream };
}
```

### 10.4 App layout (`app/layout.tsx`)

```typescript
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```typescript
// app/providers.tsx — wraps React Query and auth context
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## 11. Mapbox Integration

### 11.1 Install

```bash
pnpm add mapbox-gl
pnpm add -D @types/mapbox-gl
```

### 11.2 Itinerary map component

```typescript
// apps/web/components/map/ItineraryMap.tsx
"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Activity {
  title: string;
  location: string;
  lat: number;
  lng: number;
  category: string;
}

export function ItineraryMap({ activities }: { activities: Activity[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [activities[0]?.lng ?? 0, activities[0]?.lat ?? 0],
      zoom: 12,
    });

    activities.forEach((activity, index) => {
      new mapboxgl.Marker({ color: "#2d6a4f" })
        .setLngLat([activity.lng, activity.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${index + 1}. ${activity.title}</strong><br>${activity.location}`
          )
        )
        .addTo(map.current!);
    });

    return () => map.current?.remove();
  }, [activities]);

  return <div ref={mapContainer} className="w-full h-96 rounded-xl" />;
}
```

### 11.3 Geocoding a destination

```python
# apps/api/app/services/mapbox.py
import httpx
from app.config import settings

async def geocode(location: str) -> tuple[float, float] | None:
    """Returns (lat, lng) or None if not found."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json",
            params={"access_token": settings.mapbox_token, "limit": 1},
        )
        data = response.json()
        features = data.get("features", [])
        if not features:
            return None
        lng, lat = features[0]["center"]
        return lat, lng
```

---

## 12. Payments — Stripe and RevenueCat

### 12.1 Stripe — web subscription (`app/routers/payments.py`)

```python
import stripe
from fastapi import APIRouter, Depends, Request, HTTPException
from app.config import settings
from app.models.user import User
from app.auth import get_current_user
from app.db import get_db

stripe.api_key = settings.stripe_secret_key
router = APIRouter()

@router.post("/create-checkout-session")
async def create_checkout(current_user: User = Depends(get_current_user)):
    session = stripe.checkout.Session.create(
        customer_email=current_user.email,
        line_items=[{"price": settings.stripe_premium_price_id, "quantity": 1}],
        mode="subscription",
        success_url="https://mytravel.app/dashboard?upgraded=1",
        cancel_url="https://mytravel.app/pricing",
        metadata={"user_id": str(current_user.id)},
    )
    return {"checkout_url": session.url}

@router.post("/stripe-webhook")
async def stripe_webhook(
    request: Request,
    db = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "customer.subscription.created":
        user_id = int(event["data"]["object"]["metadata"]["user_id"])
        user = await db.get(User, user_id)
        user.is_premium = True
        await db.commit()

    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.paused"):
        user_id = int(event["data"]["object"]["metadata"]["user_id"])
        user = await db.get(User, user_id)
        user.is_premium = False
        await db.commit()

    return {"received": True}
```

### 12.2 RevenueCat — mobile IAP

RevenueCat handles Apple App Store and Google Play subscriptions. The mobile app communicates with RevenueCat's SDK; the backend validates purchase receipts via webhook.

```typescript
// apps/mobile/lib/purchases.ts
import Purchases, { LOG_LEVEL } from "react-native-purchases";

const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY!;

export function initPurchases() {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: REVENUECAT_KEY });
}

export async function purchasePremium() {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.monthly;
  if (!pkg) throw new Error("No offering available");
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active["premium"] !== undefined;
}
```

---

## 13. Deployment

### 13.1 FastAPI on Railway

1. Create a `Dockerfile` in `apps/api/`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. In Railway:
   - Create a new project → "Deploy from GitHub repo"
   - Select `apps/api` as the root directory (or set `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`)
   - Add all environment variables from Section 15
   - Railway auto-provisions a public HTTPS URL

3. Run migrations on deploy — add to the Railway deploy command:

```
uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 13.2 Next.js on Vercel

1. In Vercel dashboard → "Add New Project" → import the GitHub repo
2. Set **Root Directory** to `apps/web`
3. Add all `NEXT_PUBLIC_*` environment variables
4. Deploy — Vercel auto-detects Next.js and configures the build

### 13.3 Static demo on Vercel

The `demo/` folder deploys separately as a static site:
- Root Directory: `demo`
- Build Command: (blank)
- Output Directory: (blank)
- Config: `demo/vercel.json` (already committed — provides clean URLs)

See `Docs/MyTravel-Vercel-Deployment-Guide.md` for the full walkthrough.

---

## 14. CI/CD — GitHub Actions

### 14.1 Python backend checks (`.github/workflows/api.yml`)

```yaml
name: API CI

on:
  push:
    paths:
      - "apps/api/**"
  pull_request:
    paths:
      - "apps/api/**"

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mytravel_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Install dependencies
        working-directory: apps/api
        run: uv sync

      - name: Lint (ruff)
        working-directory: apps/api
        run: uv run ruff check .

      - name: Type check (mypy)
        working-directory: apps/api
        run: uv run mypy app/

      - name: Run tests
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost/mytravel_test
          REDIS_URL: redis://localhost:6379
          SECRET_KEY: ci-secret-key
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          MAPBOX_TOKEN: ${{ secrets.MAPBOX_TOKEN }}
        run: uv run pytest tests/ -v --cov=app --cov-report=xml

      - name: Generate OpenAPI types
        working-directory: apps/api
        run: |
          uv run python -c "import json; from main import app; print(json.dumps(app.openapi()))" > openapi.json
          npx openapi-typescript openapi.json -o ../../packages/generated-types/index.ts
```

### 14.2 Node.js checks (`.github/workflows/web.yml`)

```yaml
name: Web CI

on:
  push:
    paths:
      - "apps/web/**"
      - "packages/**"
  pull_request:
    paths:
      - "apps/web/**"
      - "packages/**"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - run: pnpm install

      - name: Lint
        run: pnpm --filter web lint

      - name: Type check
        run: pnpm --filter web tsc --noEmit

      - name: Build
        run: pnpm --filter web build
        env:
          NEXT_PUBLIC_API_URL: https://api.mytravel.app
          NEXT_PUBLIC_MAPBOX_TOKEN: ${{ secrets.MAPBOX_TOKEN }}
```

---

## 15. Environment Variables Reference

### Backend (`apps/api/.env`)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/mytravel

# Redis (Upstash — use rediss:// for TLS in production)
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-256-bit-secret-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080   # 7 days

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Mapbox
MAPBOX_TOKEN=pk.eyJ1...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# OAuth — Google
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Cottage affiliates
VRBO_API_KEY=...
VRBO_AFFILIATE_ID=...
BOOKING_AFFILIATE_ID=...
AIRBNB_AFFILIATE_TOKEN=...

# File storage — Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=mytravel-uploads

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# App
DEBUG=false
CORS_ORIGINS=["https://mytravel.app","https://www.mytravel.app"]
```

### Web frontend (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://api.mytravel.app
NEXT_PUBLIC_WS_URL=wss://api.mytravel.app
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Mobile (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_API_URL=https://api.mytravel.app
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
EXPO_PUBLIC_REVENUECAT_KEY=appl_...
EXPO_PUBLIC_POSTHOG_KEY=phc_...
```

---

## 16. Development Workflow

### 16.1 Day-to-day flow

```
1. Pull latest main
     git pull origin main

2. Create a feature branch
     git checkout -b feature/cottage-search-filters

3. Start local infra
     docker compose up -d

4. Run dev servers (3 terminals)
     cd apps/api && uv run uvicorn main:app --reload
     cd apps/api && uv run arq app.worker.WorkerSettings
     cd apps/web && pnpm dev

5. Make changes, write tests

6. Run checks locally before pushing
     cd apps/api && uv run ruff check . && uv run mypy app/ && uv run pytest tests/
     cd apps/web && pnpm lint && pnpm tsc --noEmit

7. Commit and push
     git add -p
     git commit -m "feat: add bedroom filter to cottage search"
     git push origin feature/cottage-search-filters

8. Open a pull request → CI runs automatically
```

### 16.2 Adding a new AI feature

1. Create `app/services/ai/<feature>.py` — define the system prompt and async function
2. Create `app/routers/<feature>.py` — wire the endpoint, handle auth
3. Register the router in `main.py`
4. Add the Pydantic schema in `app/schemas/<feature>.py`
5. Write at least one integration test in `tests/test_<feature>.py`
6. Update `Docs/MyTravel-AI-Role.md` with the new capability

### 16.3 Adding a new DB table

```bash
# 1. Define the SQLAlchemy model in app/models/
# 2. Import it in alembic/env.py
# 3. Generate the migration
cd apps/api
uv run alembic revision --autogenerate -m "add <table_name> table"

# 4. Review the generated file in alembic/versions/
# 5. Apply it
uv run alembic upgrade head
```

### 16.4 Generating updated TypeScript types

After any FastAPI schema changes:

```bash
cd apps/api

# Export the OpenAPI spec
uv run python -c "import json; from main import app; print(json.dumps(app.openapi()))" > openapi.json

# Generate TypeScript types
npx openapi-typescript openapi.json -o ../../packages/generated-types/index.ts
```

This runs automatically in CI (see Section 14.1) so the frontend types are always in sync with the backend.

---

## Related Documents

| Document | Purpose |
|---|---|
| `MyTravel-PRD.md` | Full product requirements, personas, functional requirements |
| `MyTravel-Implementation-Plan.md` | Phased roadmap, API design, testing strategy |
| `MyTravel-AI-Role.md` | All 8 AI capabilities — models, prompts, cost estimates |
| `MyTravel-Integrations-and-Hosting-Costs.md` | Full cost breakdown — all third-party services |
| `MyTravel-Vercel-Deployment-Guide.md` | Step-by-step guide to deploy the demo to Vercel |
| `MyTravel-MVP1-Review-Scope.md` | What is and isn't in scope for the MVP review build |

---

*Document version: 1.0 | Last updated: 2026-03-22*
