from datetime import datetime, timedelta, timezone
import bcrypt
from jose import JWTError, jwt
from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_token(token: str) -> int:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    return int(payload["sub"])


def create_reset_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode(
        {"sub": str(user_id), "type": "reset", "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def verify_reset_token(token: str) -> int:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if payload.get("type") != "reset":
        raise ValueError("Invalid token type")
    return int(payload["sub"])
