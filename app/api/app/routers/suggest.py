from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.ai.suggest import suggest_destinations

router = APIRouter()


class SuggestRequest(BaseModel):
    from_location: str = ""
    radius_miles: int | None = None
    terrain: list[str] = []
    activities: list[str] = []


class SuggestionResult(BaseModel):
    destination: str
    distance: str
    tagline: str
    highlights: list[str]
    emoji: str


@router.post("/destinations", response_model=list[SuggestionResult])
async def suggest(
    body: SuggestRequest,
    _user: User = Depends(get_current_user),
):
    try:
        results = await suggest_destinations(
            from_location=body.from_location,
            radius_miles=body.radius_miles,
            terrain=body.terrain,
            activities=body.activities,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion failed: {str(e)}")
