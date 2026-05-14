from pydantic import BaseModel, EmailStr, ConfigDict, computed_field
from app.config import settings


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
    is_premium: bool = False

    model_config = {"from_attributes": True}

    @computed_field  # type: ignore[misc]
    @property
    def gen_limit(self) -> int:
        return settings.free_tier_gen_limit


class UserProfileOut(BaseModel):
    home_city: str | None = None
    passport_nationality: str | None = None
    food_preference: str | None = None
    seat_preference: str | None = None
    preferred_pace: str | None = None
    preferred_styles: str | None = None
    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    home_city: str | None = None
    passport_nationality: str | None = None
    food_preference: str | None = None
    seat_preference: str | None = None
    preferred_pace: str | None = None
    preferred_styles: str | None = None
