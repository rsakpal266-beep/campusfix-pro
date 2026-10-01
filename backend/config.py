import os


def _get_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


# Full connection string (e.g. from Railway/Render/Supabase).
# Takes precedence over the individual POSTGRES_* settings.
DATABASE_URL = os.getenv("DATABASE_URL", "")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_DB = os.getenv("POSTGRES_DB", "campusfix_pro")
POSTGRES_PORT = _get_int("POSTGRES_PORT", 5432)

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "campusfix-pro-secret-key-change-later",
)
