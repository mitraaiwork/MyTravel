from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.config import settings


async def check_and_increment_gen_count(user: User, db: AsyncSession) -> None:
    """
    Raises HTTP 429 if the user has hit their monthly limit.
    Resets the counter automatically at the start of a new calendar month.
    """
    limit = settings.free_tier_monthly_limit
    now = datetime.now(timezone.utc)

    # Reset if it's a new month
    if (
        user.gen_reset_at is None
        or user.gen_reset_at.month != now.month
        or user.gen_reset_at.year != now.year
    ):
        user.gen_count = 0
        user.gen_reset_at = now

    if user.gen_count >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"You've used all {limit} free itineraries this month.",
                "gen_count": user.gen_count,
                "limit": limit,
            },
        )

    user.gen_count += 1
    await db.commit()
