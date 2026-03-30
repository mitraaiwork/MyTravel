import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings
from app.db import engine
from app.routers import auth, trips, itinerary, share
from app.routers import oauth

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="MyTravel API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(oauth.router, prefix="/auth", tags=["auth"])
app.include_router(trips.router, prefix="/trips", tags=["trips"])
app.include_router(itinerary.router, prefix="/itinerary", tags=["itinerary"])
app.include_router(share.router, prefix="/share", tags=["share"])


@app.get("/health")
async def health():
    return {"status": "ok"}
