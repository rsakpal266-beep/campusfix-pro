"""FastAPI entry point for CampusFix Pro (alias for main.py)."""

import os
import uvicorn
from main import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    print(f"[CampusFix Pro] Starting FastAPI server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=debug)
