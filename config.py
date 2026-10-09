from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment variables or .env.

    Nothing here has a default that would work in production. A missing value
    raises at import time, which is deliberate: an app that silently falls back
    to a hardcoded signing key is worse than one that refuses to start.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM
    groq_api_key: str
    # Groq retires models periodically; keep this configurable so a retirement
    # is an .env change rather than a code change.
    groq_model: str = "openai/gpt-oss-120b"

    # Auth — generate with: python -c "import secrets; print(secrets.token_hex(32))"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # Database
    database_url: str

    # Celery / Redis
    redis_url: str = "redis://localhost:6379/0"

    # How /research executes the work.
    #   "queue"  — hand off to a Celery worker over Redis (local development)
    #   "inline" — run it inside the request, for serverless hosts such as
    #              Vercel where no always-on worker process exists
    research_mode: str = "queue"

    # CORS — comma-separated list of allowed frontend origins
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
