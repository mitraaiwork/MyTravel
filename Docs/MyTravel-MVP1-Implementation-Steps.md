# MyTravel — MVP1 Step-by-Step Implementation Guide

**Version**: 1.0
**Date**: 2026-03-25
**Status**: Ready to Follow
**Audience**: Developer(s) building the MVP1 review build
**Purpose**: Ordered, actionable steps to go from zero to a working MVP1 ready to share with review users — with no wasted effort on out-of-scope features.

> **The MVP1 question**: *"Is the AI-generated itinerary quality good enough that a real person would use it to plan a real trip?"*
>
> Every step in this guide serves that question.

---

## How to Use This Guide

This guide is broken into **7 sprints** of roughly 3–4 days each (~4 weeks total). Complete each sprint in order — each one builds on the last.

Work to the **Definition of Done** at the end of each sprint before moving on. Skipping ahead creates technical debt that is expensive to fix mid-build.

**Architecture in use for MVP1** (intentionally simplified):
- Backend: **FastAPI** + direct WebSocket streaming (no ARQ job queue)
- Database: **Supabase** (PostgreSQL) — used as generation counter too (no Redis)
- Weather: **Open-Meteo** (free, no API key required)
- Maps: **Mapbox** — basic pins only (no routing API)
- Frontend: **Next.js 15** web app only (no Expo mobile)
- Email: **Resend** free tier
- Errors: **Sentry** free tier

See `MyTravel-MVP1-Review-Scope.md` Section 4 for the full rationale behind these simplifications.

---

## Sprint Overview

| Sprint | Focus | Duration |
|---|---|---|
| **Sprint 1** | Project setup — repo, services, local dev | Days 1–3 |
| **Sprint 2** | Database + backend skeleton | Days 4–7 |
| **Sprint 3** | Authentication | Days 8–10 |
| **Sprint 4** | Trip creation + AI itinerary generation | Days 11–16 |
| **Sprint 5** | Itinerary view + map + editing | Days 17–21 |
| **Sprint 6** | Dashboard + share link + generation cap | Days 22–25 |
| **Sprint 7** | Polish, email, error monitoring, deploy | Days 26–28 |

---

## Sprint 1 — Project Setup

**Goal**: Working local development environment. Code can be pushed to GitHub. All services signed up.

---

### Step 1.1 — Create the GitHub repository

1. Go to github.com → New repository
2. Name it `MyTravel` (or keep the existing one at `amitra1976/MyTravel`)
3. Set visibility to **Private** until launch
4. Clone to your local machine:
   ```bash
   git clone https://github.com/amitra1976/MyTravel.git
   cd MyTravel
   ```

---

### Step 1.2 — Sign up for all MVP1 services

Sign up for each service in the list below **now**, before writing any code. You'll need the API keys during Sprint 2. Takes ~30 minutes total.

| Service | URL | Plan | Purpose | What to collect |
|---|---|---|---|---|
| **Supabase** | supabase.com | Free | PostgreSQL database | Project URL, anon key, service role key, DB connection string |
| **Anthropic** | console.anthropic.com | Pay-as-you-go | AI itinerary generation | API key (`sk-ant-...`) |
| **Mapbox** | account.mapbox.com | Free | Maps + geocoding | Public token (`pk.eyJ1...`) |
| **Resend** | resend.com | Free | Transactional email | API key, verify your sending domain |
| **Sentry** | sentry.io | Free | Error monitoring | DSN URL for Python project, DSN URL for JS project |
| **Railway** | railway.app | Starter ($5 credit) | FastAPI hosting | (configure during Sprint 7) |
| **Vercel** | vercel.com | Hobby (Free) | Next.js hosting | (configure during Sprint 7) |

> Open-Meteo requires no signup. No API key needed.

Create a local `.env` file now with all collected keys — you'll fill in values as you go:

```bash
# apps/api/.env (create this file — never commit it)
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host]/postgres
SECRET_KEY=         # generate: python3 -c "import secrets; print(secrets.token_hex(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ANTHROPIC_API_KEY=
MAPBOX_TOKEN=
RESEND_API_KEY=
SENTRY_DSN=
CORS_ORIGINS=["http://localhost:3000"]
```

```bash
# apps/web/.env.local (create this file — never commit it)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

### Step 1.3 — Scaffold the monorepo

```bash
# From the repo root
mkdir -p apps/api apps/web

# Create pnpm workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/web"
EOF

# Install Node.js tools
pnpm init
```

**Initialize the FastAPI project:**
```bash
cd apps/api
pip install uv
uv init --python 3.12

# Add all MVP1 dependencies at once
uv add fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic \
       pydantic pydantic-settings pydantic[email] \
       python-jose[cryptography] passlib[bcrypt] \
       anthropic httpx resend sentry-sdk[fastapi] \
       authlib itsdangerous python-multipart email-validator
uv add --dev ruff mypy pytest pytest-asyncio httpx
```

**Initialize the Next.js project:**
```bash
cd ../web
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
pnpm add axios @tanstack/react-query zustand mapbox-gl date-fns
pnpm add -D @types/mapbox-gl
pnpm dlx shadcn@latest init
# When prompted: Default style, Slate colour, CSS variables yes
```

---

### Step 1.4 — Local infrastructure

Create `docker-compose.yml` at the repo root for local development:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mytravel
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
# Start local Postgres
docker compose up -d

# Verify it's running
docker compose ps
```

> You can use either the local Docker Postgres or Supabase's connection string during development. Use Supabase for staging/production.

---

### Step 1.5 — Set up the directory structure

Create all the directories and placeholder files so the structure is clear from day one:

```bash
# Backend structure
mkdir -p apps/api/app/{routers,services/ai,models,schemas,dependencies}
touch apps/api/app/__init__.py
touch apps/api/app/routers/{__init__,auth,trips,itinerary,share}.py
touch apps/api/app/services/ai/{__init__,itinerary,weather}.py
touch apps/api/app/models/{__init__,user,trip}.py
touch apps/api/app/schemas/{__init__,auth,trip,itinerary}.py
touch apps/api/app/dependencies/{__init__,auth}.py
touch apps/api/app/{config,db,auth}.py
touch apps/api/main.py
mkdir -p apps/api/tests
touch apps/api/tests/__init__.py

# Frontend structure
mkdir -p apps/web/src/{components/{ui,map,itinerary,auth,layout},lib,hooks,context,types}
```

---

### Sprint 1 Definition of Done

- [ ] GitHub repo exists, local clone works
- [ ] All 7 services signed up, API keys collected in `.env` files
- [ ] `docker compose up -d` starts Postgres without errors
- [ ] `cd apps/api && uv run uvicorn main:app --reload` starts (even if main.py is minimal)
- [ ] `cd apps/web && pnpm dev` starts Next.js at localhost:3000
- [ ] `.env` files are in `.gitignore` and NOT committed

---

## Sprint 2 — Database + Backend Skeleton

**Goal**: Database schema created and migrated. FastAPI app wired up with all routers registered (endpoints can return placeholder data). Health check endpoint works.

---

### Step 2.1 — Configure the async database engine (`app/db.py`)

```python
# apps/api/app/db.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.database_url, pool_size=5, max_overflow=10)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

---

### Step 2.2 — App settings (`app/config.py`)

```python
# apps/api/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    anthropic_api_key: str
    mapbox_token: str
    resend_api_key: str
    sentry_dsn: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]

settings = Settings()
```

---

### Step 2.3 — Define the MVP1 database models

**User model** (`app/models/user.py`):
```python
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    # Generation cap (3 free per month — tracked in DB for MVP1, no Redis needed)
    gen_count: Mapped[int] = mapped_column(Integer, default=0)
    gen_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

**Trip and Itinerary models** (`app/models/trip.py`):
```python
from datetime import date, datetime
from sqlalchemy import String, Integer, Date, ForeignKey, Text, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    destination: Mapped[str] = mapped_column(String(255))
    destination_lat: Mapped[float | None]
    destination_lng: Mapped[float | None]
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    travel_style: Mapped[str] = mapped_column(String(255))   # comma-separated: "Nature,Food"
    mobility_level: Mapped[str] = mapped_column(String(50), default="full")
    budget_amount: Mapped[float | None]
    budget_currency: Mapped[str] = mapped_column(String(3), default="CAD")
    group_size: Mapped[int] = mapped_column(Integer, default=1)
    group_type: Mapped[str] = mapped_column(String(50), default="solo")
    pace: Mapped[str] = mapped_column(String(20), default="moderate")
    interests: Mapped[str | None] = mapped_column(Text)
    share_token: Mapped[str | None] = mapped_column(String(64), unique=True)
    share_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    itinerary: Mapped["Itinerary | None"] = relationship(back_populates="trip", uselist=False)

class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), unique=True)
    content: Mapped[str | None] = mapped_column(Text)    # Full JSON string from Claude
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|generating|done|failed
    model_used: Mapped[str | None] = mapped_column(String(50))
    error_message: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    trip: Mapped["Trip"] = relationship(back_populates="itinerary")
```

---

### Step 2.4 — Set up Alembic migrations

```bash
cd apps/api

# Initialize Alembic
uv run alembic init alembic
```

Edit `alembic/env.py` — add these lines in the `run_migrations_online` section:
```python
# At the top of env.py, add:
import asyncio
from sqlalchemy.ext.asyncio import async_engine_from_config
from app.db import Base
from app.models import user, trip   # import all models so Alembic sees them

target_metadata = Base.metadata
```

Then edit `alembic.ini` to point to your database:
```ini
sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost/mytravel
```

Create and apply the initial migration:
```bash
uv run alembic revision --autogenerate -m "initial schema"
uv run alembic upgrade head
```

Verify tables were created:
```bash
docker exec -it $(docker compose ps -q postgres) psql -U postgres -d mytravel -c "\dt"
```
You should see `users`, `trips`, `itineraries`.

---

### Step 2.5 — Wire up FastAPI (`main.py`)

```python
# apps/api/main.py
import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine

# Import routers (they can return placeholder data for now)
from app.routers import auth, trips, itinerary, share

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()

app = FastAPI(title="MyTravel API", version="1.0.0", lifespan=lifespan)

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
app.include_router(share.router, prefix="/share", tags=["share"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

Each router file (`app/routers/auth.py` etc.) should have at minimum:
```python
from fastapi import APIRouter
router = APIRouter()
```

Verify the API starts and the docs load:
```bash
cd apps/api && uv run uvicorn main:app --reload
# Open: http://localhost:8000/docs
```

---

### Sprint 2 Definition of Done

- [ ] `alembic upgrade head` creates `users`, `trips`, `itineraries` tables
- [ ] FastAPI starts without errors
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /docs` shows the Swagger UI with all 4 routers listed
- [ ] `.env` values load correctly (settings object initializes without errors)

---

## Sprint 3 — Authentication

**Goal**: Users can register, log in with email/password, and log in with Google. JWT tokens are issued and validated. Protected routes return 401 when no token is provided.

---

### Step 3.1 — JWT utilities (`app/auth.py`)

```python
# apps/api/app/auth.py
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.secret_key, algorithm=settings.algorithm)

def decode_token(token: str) -> int:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    return int(payload["sub"])
```

---

### Step 3.2 — Auth dependency (`app/dependencies/auth.py`)

```python
# apps/api/app/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.user import User
from app.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                          detail="Could not validate credentials")
    try:
        user_id = decode_token(token)
    except JWTError:
        raise credentials_exception

    user = await db.get(User, user_id)
    if not user:
        raise credentials_exception
    return user
```

---

### Step 3.3 — Auth Pydantic schemas (`app/schemas/auth.py`)

```python
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    gen_count: int
    model_config = {"from_attributes": True}
```

---

### Step 3.4 — Email/password auth endpoints (`app/routers/auth.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.auth import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=body.email, hashed_password=hash_password(body.password), full_name=body.full_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
```

---

### Step 3.5 — Forgot password + reset

1. Add a `password_reset_tokens` table — or use a short-lived JWT for the reset link (simpler for MVP1):

```python
# In app/auth.py — add these two functions:
import secrets

def create_reset_token(user_id: int) -> str:
    """Short-lived (1 hour) JWT for password reset."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode({"sub": str(user_id), "type": "reset", "exp": expire},
                      settings.secret_key, algorithm=settings.algorithm)

def verify_reset_token(token: str) -> int:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if payload.get("type") != "reset":
        raise ValueError("Invalid token type")
    return int(payload["sub"])
```

2. Add endpoints to `app/routers/auth.py`:

```python
@router.post("/forgot-password")
async def forgot_password(email: str, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == email))
    if user:
        token = create_reset_token(user.id)
        await send_password_reset_email(user.email, user.full_name, token)
    # Always return 200 — don't reveal whether the email exists
    return {"message": "If that email is registered, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(token: str, new_password: str, db: AsyncSession = Depends(get_db)):
    try:
        user_id = verify_reset_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user = await db.get(User, user_id)
    user.hashed_password = hash_password(new_password)
    await db.commit()
    return {"message": "Password updated"}
```

---

### Step 3.6 — Google OAuth

```bash
uv add authlib
```

```python
# In app/routers/auth.py — add:
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

@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token["userinfo"]

    user = await db.scalar(select(User).where(User.google_id == user_info["sub"]))
    if not user:
        # Check if email already registered without Google
        user = await db.scalar(select(User).where(User.email == user_info["email"]))
        if user:
            user.google_id = user_info["sub"]   # Link accounts
        else:
            user = User(email=user_info["email"], full_name=user_info["name"],
                        google_id=user_info["sub"])
            db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(user.id)
    # Redirect to frontend with token in query param (frontend stores it)
    return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?token={access_token}")
```

> Add `google_client_id`, `google_client_secret`, and `frontend_url` to `config.py` and `.env`.
> In Google Cloud Console: create OAuth 2.0 credentials, add `http://localhost:8000/auth/google/callback` as an Authorized redirect URI.

---

### Step 3.7 — Frontend auth context

Create `apps/web/src/context/auth.tsx`:
```typescript
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = { id: number; email: string; full_name: string; gen_count: number };
type AuthContext = { user: User | null; token: string | null; login: (token: string) => void; logout: () => void };

const AuthCtx = createContext<AuthContext>({} as AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("token");
        if (stored) setToken(stored);
    }, []);

    useEffect(() => {
        if (!token) return;
        api.get<User>("/auth/me").then(r => setUser(r.data)).catch(() => logout());
    }, [token]);

    const login = (t: string) => { localStorage.setItem("token", t); setToken(t); };
    const logout = () => { localStorage.removeItem("token"); setToken(null); setUser(null); };

    return <AuthCtx.Provider value={{ user, token, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
```

Create the OAuth callback handler at `apps/web/src/app/auth/callback/page.tsx`:
```typescript
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth";

export default function AuthCallbackPage() {
    const { login } = useAuth();
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const token = params.get("token");
        if (token) { login(token); router.push("/dashboard"); }
        else router.push("/login?error=oauth_failed");
    }, []);

    return <p>Signing you in…</p>;
}
```

---

### Sprint 3 Definition of Done

- [ ] `POST /auth/register` creates a user and returns a JWT
- [ ] `POST /auth/login` returns a JWT for valid credentials, 401 for invalid
- [ ] `GET /auth/me` returns user data when authenticated, 401 when not
- [ ] `POST /auth/forgot-password` doesn't crash (email send can be stubbed for now)
- [ ] `POST /auth/reset-password` updates the password
- [ ] Google OAuth redirects to Google and back (test with real browser)
- [ ] Frontend login form calls the API, stores the token, redirects to `/dashboard`
- [ ] Frontend Google sign-in button works end-to-end

---

## Sprint 4 — Trip Creation + AI Itinerary Generation

**Goal**: Users can create a trip, trigger AI generation, and watch the itinerary stream in live — days appearing one by one. Weather context is included. The "why chosen" note appears on every activity.

This is the most important sprint. The rest of the app is in service of this.

---

### Step 4.1 — Trip Pydantic schemas (`app/schemas/trip.py`)

```python
from datetime import date
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

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v

class TripOut(TripCreate):
    id: int
    user_id: int
    title: str | None
    share_token: str | None
    share_enabled: bool
    model_config = {"from_attributes": True}
```

---

### Step 4.2 — Trips router (`app/routers/trips.py`)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip
from app.models.user import User
from app.schemas.trip import TripCreate, TripOut
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TripOut)
async def create_trip(body: TripCreate, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    trip = Trip(**body.model_dump(), user_id=user.id)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip

@router.get("/", response_model=list[TripOut])
async def list_trips(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.scalars(select(Trip).where(Trip.user_id == user.id).order_by(Trip.created_at.desc()))
    return result.all()

@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(trip_id: int, db: AsyncSession = Depends(get_db),
                   user: User = Depends(get_current_user)):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    return trip

@router.delete("/{trip_id}", status_code=204)
async def delete_trip(trip_id: int, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    await db.delete(trip)
    await db.commit()
```

---

### Step 4.3 — Weather service (`app/services/ai/weather.py`)

Open-Meteo is free and needs no API key.

```python
import httpx
from datetime import date

async def get_weather_context(lat: float, lng: float, start: date, end: date) -> dict[str, str]:
    """
    Returns a dict mapping date string to weather summary.
    e.g. {"2026-04-10": "Sunny, 18°C", "2026-04-11": "Rain, 12°C"}
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lng,
        "daily": "weathercode,temperature_2m_max,precipitation_sum",
        "timezone": "auto",
        "start_date": str(start), "end_date": str(end),
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()["daily"]

    WMO_CODES = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 51: "Light drizzle", 61: "Light rain", 63: "Rain",
        65: "Heavy rain", 71: "Light snow", 80: "Rain showers", 95: "Thunderstorm",
    }
    result = {}
    for i, d in enumerate(data["time"]):
        code = data["weathercode"][i]
        temp = data["temperature_2m_max"][i]
        precip = data["precipitation_sum"][i]
        desc = WMO_CODES.get(code, "Variable")
        rain_note = f", {precip}mm rain" if precip and precip > 2 else ""
        result[d] = f"{desc}, {temp:.0f}°C{rain_note}"
    return result
```

---

### Step 4.4 — The itinerary generation prompt (`app/services/ai/itinerary.py`)

This is the most important piece of code in the entire project. Invest time in the prompt.

```python
import json
import anthropic
from datetime import date
from app.config import settings
from app.models.trip import Trip

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """
You are MyTravel's AI trip planner. Your job is to generate a detailed, realistic, personalised day-by-day travel itinerary in valid JSON.

Rules:
- Use REAL place names, restaurant names, and addresses. Never make up generic placeholder names.
- Sequence activities to minimize backtracking — group activities by neighbourhood or geographic area within each day.
- Time slots must be realistic: factor in travel time between locations, meal durations, and reasonable activity lengths.
- For every single activity, include a "why_chosen" field: one sentence explaining why this specific place was chosen for THIS traveller's style, pace, and interests. This is the most important field — it builds trust.
- Include weather context in each day's planning note when weather is unusual (rain, extreme heat, etc.) and suggest indoor alternatives.
- Cost estimates should use the local currency of the destination and reflect realistic 2026 prices.
- If the group is large (4+), note when bookings are essential.

Output ONLY valid JSON in exactly this format — no markdown, no commentary before or after:

{
  "title": "Destination · Month Year",
  "destination": "string",
  "summary": "2-3 sentence overview of the trip flavour",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "One-line theme for the day, e.g. 'Old Town & Street Food'",
      "weather_note": "string | null — only include if weather is notable",
      "activities": [
        {
          "time": "09:00",
          "title": "Full place name",
          "why_chosen": "One sentence tailored to this traveller",
          "description": "2-3 sentences about what to do/see/eat here",
          "address": "Street address or neighbourhood",
          "lat": 0.0,
          "lng": 0.0,
          "duration_minutes": 90,
          "category": "food | nature | culture | adventure | shopping | transport | accommodation",
          "estimated_cost": "string e.g. '$25–$35 per person' or 'Free'",
          "tips": "One practical insider tip"
        }
      ],
      "day_summary": "Brief summary of the day's experience"
    }
  ],
  "practical_notes": "Visa, currency, transport, safety — whatever is most relevant",
  "packing_highlights": ["3–5 destination-specific packing items"]
}
"""

async def generate_itinerary_stream(trip: Trip, weather: dict[str, str]):
    """
    Async generator — yields raw text chunks from Claude.
    Connect to a WebSocket endpoint.
    """
    num_days = (trip.end_date - trip.start_date).days + 1
    budget_line = f"Budget: {trip.budget_currency} {trip.budget_amount:,.0f} total" if trip.budget_amount else "Budget: not specified"
    weather_summary = "\n".join(f"  {d}: {w}" for d, w in weather.items()) if weather else "Weather data not available"

    prompt = f"""Create a complete {num_days}-day itinerary for the following trip:

Destination: {trip.destination}
Dates: {trip.start_date} to {trip.end_date} ({num_days} days)
Travel style: {trip.travel_style}
Mobility: {trip.mobility_level}
{budget_line}
Group: {trip.group_size} {trip.group_type}
Pace preference: {trip.pace}
Special interests: {trip.interests or 'None specified'}

Weather forecast:
{weather_summary}

Generate the full itinerary JSON now. Include every day — do not truncate.
"""

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

---

### Step 4.5 — Generation cap check

Add a helper function that checks and increments the monthly generation counter:

```python
# apps/api/app/services/generation_cap.py
from datetime import datetime, timezone, date
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.user import User

FREE_TIER_MONTHLY_LIMIT = 3

async def check_and_increment_gen_count(user: User, db: AsyncSession):
    """
    Raises HTTP 429 if user is at monthly limit.
    Resets count if it's a new calendar month.
    Increments count otherwise.
    """
    now = datetime.now(timezone.utc)

    # Reset if it's a new month
    if user.gen_reset_at is None or user.gen_reset_at.month != now.month or user.gen_reset_at.year != now.year:
        user.gen_count = 0
        user.gen_reset_at = now

    if user.gen_count >= FREE_TIER_MONTHLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "You've used all 3 free generations this month.",
                "gen_count": user.gen_count,
                "limit": FREE_TIER_MONTHLY_LIMIT,
            }
        )

    user.gen_count += 1
    await db.commit()
```

---

### Step 4.6 — Itinerary generation WebSocket endpoint (`app/routers/itinerary.py`)

```python
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip, Itinerary
from app.models.user import User
from app.services.ai.itinerary import generate_itinerary_stream
from app.services.ai.weather import get_weather_context
from app.services.generation_cap import check_and_increment_gen_count
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.websocket("/generate/{trip_id}")
async def generate_itinerary(
    trip_id: int,
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await websocket.accept()

    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        await websocket.send_json({"event": "error", "message": "Trip not found"})
        await websocket.close()
        return

    # Check generation cap
    try:
        await check_and_increment_gen_count(user, db)
    except Exception as e:
        await websocket.send_json({"event": "cap_reached", "detail": str(e)})
        await websocket.close()
        return

    # Create or reset itinerary record
    if trip.itinerary:
        itinerary = trip.itinerary
        itinerary.status = "generating"
        itinerary.content = None
        itinerary.error_message = None
    else:
        itinerary = Itinerary(trip_id=trip_id, status="generating")
        db.add(itinerary)
    await db.commit()

    # Fetch weather context
    weather = {}
    if trip.destination_lat and trip.destination_lng:
        try:
            weather = await get_weather_context(trip.destination_lat, trip.destination_lng,
                                                 trip.start_date, trip.end_date)
        except Exception:
            pass  # Weather is nice-to-have — don't fail the generation over it

    await websocket.send_json({"event": "started"})

    full_text = ""
    try:
        async for chunk in generate_itinerary_stream(trip, weather):
            full_text += chunk
            await websocket.send_text(chunk)
    except WebSocketDisconnect:
        return
    except Exception as e:
        itinerary.status = "failed"
        itinerary.error_message = str(e)
        await db.commit()
        try:
            await websocket.send_json({"event": "error", "message": "Generation failed. Please try again."})
        except Exception:
            pass
        return

    # Validate JSON before saving
    try:
        json.loads(full_text)
        itinerary.status = "done"
    except json.JSONDecodeError:
        itinerary.status = "failed"
        itinerary.error_message = "AI returned invalid JSON"

    itinerary.content = full_text
    itinerary.model_used = "claude-sonnet-4-6"
    from datetime import datetime, timezone
    itinerary.generated_at = datetime.now(timezone.utc)
    await db.commit()

    await websocket.send_json({"event": "complete", "status": itinerary.status})
    await websocket.close()
```

---

### Step 4.7 — Geocode destination on trip creation

When a trip is created, geocode the destination so weather and map pins work:

```python
# apps/api/app/services/maps/mapbox.py
import httpx
from app.config import settings

async def geocode(location: str) -> tuple[float, float] | None:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json",
            params={"access_token": settings.mapbox_token, "limit": 1},
        )
        features = r.json().get("features", [])
        if not features:
            return None
        lng, lat = features[0]["center"]
        return lat, lng
```

Update the `create_trip` endpoint in `app/routers/trips.py` to call geocode after saving:

```python
# Add to create_trip, after db.commit():
from app.services.maps.mapbox import geocode
coords = await geocode(trip.destination)
if coords:
    trip.destination_lat, trip.destination_lng = coords
    await db.commit()
await db.refresh(trip)
```

---

### Step 4.8 — Frontend: Trip creation form

Create `apps/web/src/app/(app)/trips/new/page.tsx`:

The form should have these fields — all on one page, clean layout:
1. **Destination** — text input with autocomplete suggestions (use Mapbox Geocoding API client-side)
2. **Start date + End date** — date pickers side by side
3. **Travel style** — multi-select checkbox group: Nature / Food / Culture / Adventure / Relaxation / Nightlife
4. **Mobility** — radio group: Full / Some limitations / Wheelchair accessible
5. **Budget** — amount input + currency dropdown (CAD, USD, EUR, GBP, AUD)
6. **Group** — number stepper for group size + radio for group type (Solo / Couple / Family / Friends)
7. **Pace** — three-option toggle: Relaxed / Moderate / Packed
8. **Interests** — optional textarea: "Anything specific? (e.g. vegan food, jazz bars, street art)"

On submit: `POST /trips` → redirect to `/trips/{id}/generate`

---

### Step 4.9 — Frontend: Streaming generation page

Create `apps/web/src/app/(app)/trips/[id]/generate/page.tsx`:

```typescript
"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";

export default function GeneratePage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const router = useRouter();
    const [chunks, setChunks] = useState<string[]>([]);
    const [status, setStatus] = useState<"connecting" | "generating" | "done" | "error">("connecting");
    const [errorMsg, setErrorMsg] = useState("");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/itinerary/generate/${id}?token=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            if (e.data.startsWith("{")) {
                const msg = JSON.parse(e.data);
                if (msg.event === "started") setStatus("generating");
                if (msg.event === "complete") {
                    setStatus("done");
                    setTimeout(() => router.push(`/trips/${id}`), 1000);
                }
                if (msg.event === "error") { setStatus("error"); setErrorMsg(msg.message); }
                if (msg.event === "cap_reached") {
                    setStatus("error");
                    setErrorMsg("You've used all 3 free generations this month.");
                }
            } else {
                setChunks(prev => [...prev, e.data]);
            }
        };
        ws.onerror = () => { setStatus("error"); setErrorMsg("Connection failed. Please try again."); };

        return () => ws.close();
    }, [id, token]);

    const preview = chunks.join("");

    return (
        <div className="max-w-2xl mx-auto p-8">
            {status === "connecting" && <p className="text-muted-foreground">Connecting…</p>}
            {status === "generating" && (
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-sm text-muted-foreground">MyTravel AI is building your itinerary…</span>
                    </div>
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-96 font-mono whitespace-pre-wrap">{preview}</pre>
                </div>
            )}
            {status === "done" && <p className="text-green-600">✓ Itinerary ready! Taking you there…</p>}
            {status === "error" && (
                <div>
                    <p className="text-destructive mb-4">{errorMsg}</p>
                    <button onClick={() => router.back()} className="btn-primary">Go back</button>
                </div>
            )}
        </div>
    );
}
```

> **Note**: Pass the JWT token as a query parameter (`?token=...`) since WebSocket connections cannot include an Authorization header. Validate this token in the FastAPI WebSocket endpoint.

---

### Sprint 4 Definition of Done

- [ ] `POST /trips` creates a trip and geocodes the destination
- [ ] WebSocket at `/itinerary/generate/{trip_id}` connects and streams Claude output
- [ ] Streamed text arrives at the frontend and displays in real-time
- [ ] Generation saves to the `itineraries` table with `status=done`
- [ ] Weather context is fetched from Open-Meteo and included in the prompt
- [ ] Generation cap is enforced — 4th generation attempt in same month returns a cap event
- [ ] Every activity in the generated JSON has a `why_chosen` field
- [ ] Bad JSON from Claude is caught gracefully — `status=failed`, error message shown

---

## Sprint 5 — Itinerary View + Map + Editing

**Goal**: The generated itinerary is displayed as a beautiful, readable plan. All activities are pinned on a Mapbox map. Users can delete, reorder, add custom activities, and add notes.

---

### Step 5.1 — Itinerary fetch endpoint

Add to `app/routers/itinerary.py`:

```python
import json as json_lib
from app.models.trip import Trip, Itinerary
from app.schemas.itinerary import ItineraryOut

@router.get("/{trip_id}", response_model=ItineraryOut)
async def get_itinerary(trip_id: int, db: AsyncSession = Depends(get_db),
                        user: User = Depends(get_current_user)):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    if not trip.itinerary or trip.itinerary.status != "done":
        raise HTTPException(status_code=404, detail="Itinerary not ready")

    content = json_lib.loads(trip.itinerary.content)
    return {"trip_id": trip_id, "status": trip.itinerary.status, "content": content}
```

---

### Step 5.2 — Activity editing endpoints

Add these to `app/routers/itinerary.py`. For MVP1, edits are stored as a JSON patch on the itinerary content — simple and sufficient:

```python
@router.patch("/{trip_id}/activity")
async def update_activity(
    trip_id: int,
    day: int,              # 1-indexed day number
    activity_index: int,   # 0-indexed position within the day
    updates: dict,         # Partial activity fields to update
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update notes/title on an existing activity."""
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json_lib.loads(trip.itinerary.content)
    content["days"][day - 1]["activities"][activity_index].update(updates)
    trip.itinerary.content = json_lib.dumps(content)
    await db.commit()
    return {"updated": True}

@router.delete("/{trip_id}/activity")
async def delete_activity(trip_id: int, day: int, activity_index: int,
                           db: AsyncSession = Depends(get_db),
                           user: User = Depends(get_current_user)):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json_lib.loads(trip.itinerary.content)
    content["days"][day - 1]["activities"].pop(activity_index)
    trip.itinerary.content = json_lib.dumps(content)
    await db.commit()
    return {"deleted": True}

@router.post("/{trip_id}/activity")
async def add_activity(trip_id: int, day: int, activity: dict,
                        position: int = -1,
                        db: AsyncSession = Depends(get_db),
                        user: User = Depends(get_current_user)):
    """Add a custom activity. position=-1 means append to end of day."""
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json_lib.loads(trip.itinerary.content)
    activities = content["days"][day - 1]["activities"]
    if position == -1:
        activities.append(activity)
    else:
        activities.insert(position, activity)
    trip.itinerary.content = json_lib.dumps(content)
    await db.commit()
    return {"added": True}

@router.post("/{trip_id}/reorder")
async def reorder_activities(trip_id: int, day: int, new_order: list[int],
                              db: AsyncSession = Depends(get_db),
                              user: User = Depends(get_current_user)):
    """new_order: list of current indexes in the desired new order."""
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    content = json_lib.loads(trip.itinerary.content)
    activities = content["days"][day - 1]["activities"]
    content["days"][day - 1]["activities"] = [activities[i] for i in new_order]
    trip.itinerary.content = json_lib.dumps(content)
    await db.commit()
    return {"reordered": True}
```

---

### Step 5.3 — Frontend: Itinerary view page

Create `apps/web/src/app/(app)/trips/[id]/page.tsx`.

**Layout**: Two-column on desktop — itinerary days on the left (65%), map on the right (35%, sticky).

**Day card** for each day:
- Header: Day number, date, theme (collapsible)
- Weather note (if present) — shown as a small banner with appropriate icon
- Activity cards (see below)

**Activity card** for each activity:
- Time slot badge + category badge (coloured by category)
- Title (bold)
- `why_chosen` — italic, muted colour — this is the differentiating UI element
- Description
- Address + coordinates link (opens in Google Maps)
- Duration + estimated cost
- Tips (collapsible)
- Action buttons: Edit note | Delete | Drag handle (reorder)

**Locked Premium tease cards** — add at the bottom of each day:
```tsx
<div className="opacity-50 border border-dashed rounded-lg p-3 flex items-center gap-2">
    <span>↺ Regenerate this day</span>
    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">✦ Premium</span>
</div>
```

---

### Step 5.4 — Mapbox map component

Install:
```bash
pnpm add mapbox-gl
pnpm add -D @types/mapbox-gl
```

Create `apps/web/src/components/map/ItineraryMap.tsx`:

```typescript
"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Colour each day with a distinct colour
const DAY_COLOURS = ["#2d6a4f","#48cae4","#f4a261","#e76f51","#8338ec","#06d6a0","#fb5607"];

interface Activity {
    title: string;
    address: string;
    lat: number;
    lng: number;
    category: string;
    day: number;
}

export function ItineraryMap({ activities }: { activities: Activity[] }) {
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (!container.current || map.current) return;
        const validActivities = activities.filter(a => a.lat && a.lng);
        if (!validActivities.length) return;

        map.current = new mapboxgl.Map({
            container: container.current,
            style: "mapbox://styles/mapbox/outdoors-v12",
            center: [validActivities[0].lng, validActivities[0].lat],
            zoom: 12,
        });

        map.current.on("load", () => {
            validActivities.forEach((a, i) => {
                const colour = DAY_COLOURS[(a.day - 1) % DAY_COLOURS.length];
                const el = document.createElement("div");
                el.style.cssText = `width:28px;height:28px;background:${colour};border:2px solid white;
                    border-radius:50%;display:flex;align-items:center;justify-content:center;
                    color:white;font-size:11px;font-weight:bold;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.3)`;
                el.textContent = String(i + 1);

                new mapboxgl.Marker({ element: el })
                    .setLngLat([a.lng, a.lat])
                    .setPopup(new mapboxgl.Popup({ offset: 20 })
                        .setHTML(`<strong>Day ${a.day}: ${a.title}</strong><br><small>${a.address}</small>`))
                    .addTo(map.current!);
            });

            // Fit map to show all pins
            const bounds = new mapboxgl.LngLatBounds();
            validActivities.forEach(a => bounds.extend([a.lng, a.lat]));
            map.current!.fitBounds(bounds, { padding: 40 });
        });

        return () => { map.current?.remove(); map.current = null; };
    }, [activities]);

    return <div ref={container} className="w-full h-full min-h-[400px] rounded-xl" />;
}
```

---

### Sprint 5 Definition of Done

- [ ] Itinerary view shows all days and activities from the saved JSON
- [ ] Each activity card shows: time, title, `why_chosen`, description, address, cost, tips
- [ ] Mapbox map shows all activities pinned, colour-coded by day
- [ ] Clicking a pin shows a popup with the activity name and address
- [ ] Delete activity removes it from the view and updates the backend
- [ ] Reorder works (either drag-and-drop or up/down arrows)
- [ ] Add custom activity form works and adds the activity to the correct day
- [ ] Edit notes on an activity works
- [ ] Locked "Regenerate day" tease is visible on each day card

---

## Sprint 6 — Dashboard + Share Link + Generation Cap UI

**Goal**: Users have a home base to manage their trips. Share links work and are publicly accessible. The generation counter is visible and accurate.

---

### Step 6.1 — Trip dashboard page

Create `apps/web/src/app/(app)/dashboard/page.tsx`:

- Heading: "My Trips"
- Each trip shown as a card: destination, dates, status badge, "Open" button, delete button
- Generation counter: `"2 of 3 free itineraries used this month"` — shown prominently
- Empty state: `"No trips yet. Start planning →"` button
- At 3/3: show upgrade prompt — `"You've used all 3 free itineraries this month. Get unlimited access → [Join the Premium waitlist]"` (no Stripe yet — a simple email capture form or Tally link)

---

### Step 6.2 — Public share link

Add a share token to trips when the user enables sharing:

```python
# In app/routers/trips.py — add:
import secrets

@router.post("/{trip_id}/share")
async def enable_share(trip_id: int, db: AsyncSession = Depends(get_db),
                       user: User = Depends(get_current_user)):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    if not trip.share_token:
        trip.share_token = secrets.token_urlsafe(12)
    trip.share_enabled = True
    await db.commit()
    return {"share_token": trip.share_token, "share_url": f"/share/{trip.share_token}"}

@router.post("/{trip_id}/unshare")
async def disable_share(trip_id: int, db: AsyncSession = Depends(get_db),
                        user: User = Depends(get_current_user)):
    trip = await db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(status_code=404)
    trip.share_enabled = False
    await db.commit()
    return {"message": "Sharing disabled"}
```

Add public share endpoint (no auth required):

```python
# In app/routers/share.py:
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models.trip import Trip
import json as json_lib

router = APIRouter()

@router.get("/{token}")
async def get_shared_trip(token: str, db: AsyncSession = Depends(get_db)):
    trip = await db.scalar(select(Trip).where(Trip.share_token == token, Trip.share_enabled == True))
    if not trip:
        raise HTTPException(status_code=404, detail="Share link not found or disabled")
    content = json_lib.loads(trip.itinerary.content) if trip.itinerary else None
    return {
        "trip": {
            "destination": trip.destination,
            "start_date": str(trip.start_date),
            "end_date": str(trip.end_date),
            "title": trip.title,
        },
        "itinerary": content,
    }
```

Create `apps/web/src/app/share/[token]/page.tsx`:
- Server component — fetch from `/share/{token}` at render time
- Same itinerary view layout, but read-only (no edit buttons)
- Header banner: `"Created with MyTravel · Plan your trip at mytravel.app"`
- No login required to view

---

### Step 6.3 — Generation counter display

Show the counter on the itinerary page and dashboard. Fetch from `GET /auth/me` which returns `gen_count`.

```typescript
// In the dashboard or itinerary header:
const genLimit = 3;
const genUsed = user?.gen_count ?? 0;

<div className="text-sm text-muted-foreground">
    {genUsed} of {genLimit} free itineraries used this month
    <div className="w-32 h-1.5 bg-muted rounded-full mt-1">
        <div className="h-full bg-primary rounded-full" style={{ width: `${(genUsed/genLimit)*100}%` }} />
    </div>
</div>
```

---

### Step 6.4 — Feedback button

Add a persistent `💬 Give feedback` button to the main app layout:

```typescript
// In apps/web/src/app/(app)/layout.tsx — add in the footer/sidebar:
<a
    href="https://your-tally-form-url"  // Replace with your Tally.so form
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-lg hover:opacity-90"
>
    💬 Give feedback
</a>
```

Create the Tally.so (or Typeform) survey using the 8 questions in `MyTravel-MVP1-Review-Scope.md` Section 7.

---

### Sprint 6 Definition of Done

- [ ] Dashboard shows all trips with correct status badges
- [ ] "Generate new trip" flows correctly from dashboard
- [ ] Delete trip works from the dashboard
- [ ] Generation counter shows `gen_count / 3` and updates after a generation
- [ ] Share button in the itinerary view generates a share token
- [ ] `GET /share/{token}` returns the trip data without authentication
- [ ] Public share page renders the full itinerary (read-only)
- [ ] Feedback button is visible and links to the Tally form

---

## Sprint 7 — Polish, Email, Error Monitoring, Deploy

**Goal**: Transactional emails work. Sentry is capturing errors. The app is deployed to Railway + Vercel. Review users can access it.

---

### Step 7.1 — Transactional email with Resend

```python
# apps/api/app/services/email.py
import resend
from app.config import settings

resend.api_key = settings.resend_api_key

async def send_welcome_email(to_email: str, name: str):
    resend.Emails.send({
        "from": "MyTravel <hello@yourdomain.com>",
        "to": to_email,
        "subject": "Welcome to MyTravel 👋",
        "html": f"""
        <h1>Hi {name},</h1>
        <p>Welcome to MyTravel! You're now ready to generate your first AI-powered itinerary.</p>
        <p><a href="{settings.frontend_url}/trips/new">Plan your first trip →</a></p>
        <p>If you have any questions, just reply to this email.</p>
        """
    })

async def send_password_reset_email(to_email: str, name: str, token: str):
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    resend.Emails.send({
        "from": "MyTravel <hello@yourdomain.com>",
        "to": to_email,
        "subject": "Reset your MyTravel password",
        "html": f"""
        <h1>Hi {name},</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="{reset_url}">Reset password →</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
        """
    })
```

Call `send_welcome_email` at the end of the `register` endpoint.
Call `send_password_reset_email` in the `forgot_password` endpoint.

> Make sure your sending domain is verified in Resend before going live.

---

### Step 7.2 — Sentry error monitoring

Backend is already configured in `main.py` (Step 2.5). Verify it's working:
```python
# Add a test route temporarily to trigger a Sentry capture:
@app.get("/sentry-test")
async def sentry_test():
    raise ValueError("Sentry test error")
# Visit /sentry-test in the browser, then check your Sentry dashboard
# Remove this route before launch
```

Frontend Sentry:
```bash
cd apps/web
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
Follow the wizard — it adds `sentry.client.config.ts`, `sentry.server.config.ts`, and wraps `next.config.ts` automatically.

---

### Step 7.3 — Pre-launch checklist

Before sharing with review users, verify:

**Backend**
- [ ] All `.env` values set in Railway environment variables
- [ ] `alembic upgrade head` runs as part of the Railway start command
- [ ] `GET /health` returns 200 on the Railway URL
- [ ] CORS is configured for the Vercel production URL (not just localhost)
- [ ] Sentry is capturing test errors from the live Railway URL

**Frontend**
- [ ] `.env.local` production values set in Vercel environment variables
- [ ] `NEXT_PUBLIC_API_URL` points to the Railway production URL
- [ ] `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`) for production
- [ ] Google OAuth redirect URI includes the Vercel production URL
- [ ] Resend domain is verified; test emails land in inbox (not spam)
- [ ] Sentry JS DSN configured in Vercel env vars

**Product**
- [ ] Generated 5 test itineraries across different destinations — quality is good
- [ ] Generation cap works: 4th generation returns the correct message
- [ ] Share link opens on a fresh incognito window with no account
- [ ] Mapbox pins appear for all activities with coordinates
- [ ] Feedback button links to the live Tally form
- [ ] Mobile-responsive: the app is usable on a phone browser

---

### Step 7.4 — Deploy the FastAPI backend to Railway

1. In Railway dashboard → New Project → Deploy from GitHub repo
2. Select the `MyTravel` repo
3. Set **Root Directory** to `apps/api`
4. Add environment variables (copy from your local `.env`)
5. Set the **Start Command**:
   ```
   uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Railway auto-builds and deploys. Copy the generated URL (e.g. `https://mytravel-api.up.railway.app`)

---

### Step 7.5 — Deploy the Next.js frontend to Vercel

1. In Vercel dashboard → Add New → Project → import `amitra1976/MyTravel`
2. Set **Root Directory** to `apps/web`
3. Leave Build Command as default (`pnpm build`)
4. Add all production environment variables
5. Click **Deploy**

---

### Step 7.6 — Share with review users

Once both deployments are live and verified:
1. Create a list of 20–50 review participants
2. Send each person the Vercel URL with a short personal note — tell them what you want to learn
3. Include the Tally feedback form link in the email
4. Monitor Sentry for errors in the first 24 hours
5. Check Railway logs for any generation failures

---

### Sprint 7 Definition of Done

- [ ] Welcome email sent on registration (verified in inbox, not spam)
- [ ] Password reset email sent and reset flow works end-to-end
- [ ] Sentry captures errors in both Railway and Vercel environments
- [ ] FastAPI app is live at the Railway URL
- [ ] Next.js app is live at the Vercel URL
- [ ] Full end-to-end flow works on production: register → create trip → generate itinerary → view → share

---

## MVP1 Complete

At this point MVP1 is ready to share with review users.

**Next steps after the review period:**
1. Read `MyTravel-MVP1-Review-Scope.md` Section 7–9 for how to interpret feedback
2. Fix the most common complaint from Question 5 before building anything new
3. Use feedback from Question 6 to prioritise the first Phase 2 feature

---

## Quick Reference — MVP1 Services

| Service | URL | Purpose |
|---|---|---|
| Railway | railway.app | FastAPI backend hosting |
| Vercel | vercel.com | Next.js frontend hosting |
| Supabase | supabase.com | PostgreSQL database |
| Anthropic | console.anthropic.com | AI usage and billing |
| Mapbox | account.mapbox.com | Maps and geocoding |
| Resend | resend.com | Transactional email |
| Sentry | sentry.io | Error monitoring |
| Open-Meteo | open-meteo.com | Weather (no account needed) |
| Tally.so | tally.so | Feedback survey |

---

## Related Documents

| Document | Purpose |
|---|---|
| `MyTravel-MVP1-Review-Scope.md` | Full definition of what's in/out of MVP1 and feedback plan |
| `MyTravel-Technical-Solution-Document.md` | Deep implementation reference — code patterns, full architecture |
| `MyTravel-PRD.md` | Full product requirements for reference |
| `MyTravel-Implementation-Plan.md` | Phase 2+ roadmap, full tech stack details |
| `MyTravel-Vercel-Deployment-Guide.md` | Vercel deployment details for the static demo |

---

*Document version: 1.0 | Last updated: 2026-03-25*
