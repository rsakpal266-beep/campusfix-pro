"""Shared PostgreSQL connection helper."""

import psycopg2

from config import (
    DATABASE_URL,
    POSTGRES_HOST,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
    POSTGRES_PORT,
)


def _with_sslmode(url: str) -> str:
    """Render/Heroku-style Postgres requires SSL; add it if missing."""
    if "sslmode=" in url:
        return url
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}sslmode=require"


def get_db_connection():
    """Return a new psycopg2 connection to PostgreSQL."""
    if DATABASE_URL:
        return psycopg2.connect(_with_sslmode(DATABASE_URL))
    return psycopg2.connect(
        host=POSTGRES_HOST,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        dbname=POSTGRES_DB,
        port=POSTGRES_PORT,
    )
