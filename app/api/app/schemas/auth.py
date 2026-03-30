from pydantic import BaseModel, EmailStr, computed_field
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
