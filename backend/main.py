"""CampusFix Pro — FastAPI Backend Application."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import ALLOWED_ORIGINS, PORT, HOST, DEBUG
from database import get_db, ACTIVE_DB_TYPE
from init_db import init_db
from routes.auth import router as auth_router
from routes.tickets import router as tickets_router
from routes.admin import router as admin_router
from routes.technician import router as technician_router
from routes.fixbot import router as fixbot_router
from routes.notifications import router as notifications_router
from routes.common import router as common_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to initialize database and baseline data on startup."""
    print("[CampusFix Pro] Starting up FastAPI service...")
    try:
        init_db()
    except Exception as e:
        print(f"[CampusFix Pro] Error during startup DB init: {e}")
    yield
    print("[CampusFix Pro] Shutting down FastAPI service...")


app = FastAPI(
    title="CampusFix Pro API",
    description="Campus maintenance & repair ticket system backend powered by FastAPI & PostgreSQL.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# -------------------------------------------------------------
# CORS CONFIGURATION
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# REGISTER ROUTERS
# -------------------------------------------------------------
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(admin_router)
app.include_router(technician_router)
app.include_router(fixbot_router)
app.include_router(notifications_router)
app.include_router(common_router)


# -------------------------------------------------------------
# SYSTEM & HEALTH ENDPOINTS
# -------------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "CampusFix Pro FastAPI Backend is running!",
        "version": "2.0.0",
        "database_engine": ACTIVE_DB_TYPE,
        "docs": "/docs",
    }


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1;"))
        return {
            "status": "success",
            "message": "CampusFix Pro API and database are connected!",
            "database_initialized": True,
            "database_type": ACTIVE_DB_TYPE,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "Database connection error.",
            "error": str(e),
        }, 500


@app.get("/api/init-db")
@app.post("/api/init-db")
def manual_init_db():
    """Manual trigger to verify/seed all 12 database tables."""
    success = init_db()
    if success:
        return {
            "status": "success",
            "message": "All 12 tables and baseline data verified/initialized successfully!",
        }
    return {
        "status": "error",
        "message": "Failed to initialize database. Check server logs.",
    }, 500


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG)
