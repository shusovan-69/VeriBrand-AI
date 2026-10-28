import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "VeriBrand AI"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "veribrand_ai"
    ALLOW_MOCK_DB: bool = False

    # Security
    # Security: Default to clearly-marked development placeholder
    JWT_SECRET: str = "dev_insecure_jwt_secret_for_local_development_only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:4173"

    # Optional AI Engine
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"

    # Enterprise operating limits
    MAX_PDF_SIZE_MB: int = 10
    MAX_PDF_PAGES: int = 20
    MAX_EXTRACTED_CHARS: int = 10000

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


    @model_validator(mode="after")
    def validate_security_in_production(self) -> "Settings":
        env_lower = (self.ENVIRONMENT or "development").strip().lower()
        if env_lower == "production":
            jwt_sec = (self.JWT_SECRET or "").strip()
            if "dev_" in jwt_sec.lower() or "insecure" in jwt_sec.lower() or len(jwt_sec) < 32:
                raise ValueError(
                    "CRITICAL PRODUCTION SECURITY ERROR: A secure, high-entropy JWT_SECRET (at least 32 characters) "
                    "must be configured via environment variable when ENVIRONMENT is 'production'. "
                    "Insecure development defaults are strictly blocked in production."
                )
        return self

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
