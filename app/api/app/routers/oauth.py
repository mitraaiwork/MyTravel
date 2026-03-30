from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.models.user import User
from app.auth import create_access_token
from app.config import settings

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "prompt": "select_account",
    },
)


@router.get("/google")
async def google_login(request: Request):
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(f"{settings.frontend_url}/login?error=oauth_failed")

    user_info = token.get("userinfo")
    if not user_info or not user_info.get("email"):
        return RedirectResponse(f"{settings.frontend_url}/login?error=no_email")

    email: str = user_info["email"]
    google_id: str = user_info["sub"]
    full_name: str = user_info.get("name") or email.split("@")[0]

    # Find by google_id first, then by email (handles accounts that registered by email first)
    user = await db.scalar(select(User).where(User.google_id == google_id))
    if not user:
        user = await db.scalar(select(User).where(User.email == email))

    if user:
        if not user.google_id:
            user.google_id = google_id
            await db.commit()
    else:
        user = User(email=email, google_id=google_id, full_name=full_name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(user.id)
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?token={access_token}")
