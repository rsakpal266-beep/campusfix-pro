"""Application configuration settings for CampusFix Pro FastAPI backend."""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


def _get_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


# Database Settings
DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()

POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_DB: str = os.getenv("POSTGRES_DB", "campusfix_pro")
POSTGRES_PORT: int = _get_int("POSTGRES_PORT", 5432)

# Build default PostgreSQL connection URL if not directly supplied
if not DATABASE_URL:
    POSTGRES_URL = f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
else:
    # Ensure modern psycopg dialect is used
    if DATABASE_URL.startswith("postgres://"):
        POSTGRES_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        POSTGRES_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    else:
        POSTGRES_URL = DATABASE_URL

# Fallback local SQLite URL for development without active PostgreSQL service
SQLITE_FALLBACK_URL: str = "sqlite:///./campusfix_local.db"

# JWT Auth Settings
JWT_SECRET_KEY: str = os.getenv(
    "JWT_SECRET_KEY",
    "campusfix-pro-secret-key-change-later-lime-green-2026",
)
JWT_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS: int = _get_int("ACCESS_TOKEN_EXPIRE_HOURS", 24)

# Server Settings
PORT: int = _get_int("PORT", 5000)
HOST: str = os.getenv("HOST", "0.0.0.0")
DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

# CORS Origins
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL and FRONTEND_URL not in ALLOWED_ORIGINS and FRONTEND_URL != "*":
    ALLOWED_ORIGINS.append(FRONTEND_URL)

# AI / FixBot API Keys
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")).strip()
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
