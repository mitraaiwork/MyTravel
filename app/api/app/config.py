from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # Anthropic
    anthropic_api_key: str = ""

    # Mapbox
    mapbox_token: str = ""

    # Resend
    resend_api_key: str = ""

    # Sentry
    sentry_dsn: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Generation cap — override with FREE_TIER_GEN_LIMIT env var
    free_tier_gen_limit: int = 5

    # App
    frontend_url: str = "http://localhost:3000"
    cors_origins: list[str] = ["http://localhost:3000"]
    debug: bool = False


settings = Settings()
