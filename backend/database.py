"""SQLAlchemy database engine and session dependency for CampusFix Pro."""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import os
from pathlib import Path

from config import POSTGRES_URL

logger = logging.getLogger("campusfix.database")

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "campusfix_local.db"
SQLITE_FALLBACK_URL = f"sqlite:///{DB_FILE.as_posix()}"

Base = declarative_base()

# Attempt connection with PostgreSQL; if unavailable, use SQLite fallback for local test
engine = None
ACTIVE_DB_TYPE = "postgres"

try:
    # Test PostgreSQL connection with a short 3-second timeout
    test_engine = create_engine(
        POSTGRES_URL,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3} if "psycopg" in POSTGRES_URL else {},
    )
    with test_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = test_engine
    ACTIVE_DB_TYPE = "postgres"
    print(f"[CampusFix Pro] Successfully connected to PostgreSQL at {POSTGRES_URL.split('@')[-1]}")
except Exception as e:
    logger.warning(
        f"[CampusFix Pro] PostgreSQL connection not immediately available ({e}). "
        f"Falling back to local SQLite ({SQLITE_FALLBACK_URL}) for active runtime reliability."
    )
    engine = create_engine(
        SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
    ACTIVE_DB_TYPE = "sqlite"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a clean DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
