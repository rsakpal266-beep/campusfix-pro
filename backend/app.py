import os
import threading
from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

from db import get_db_connection
from init_db import init_db
from routes.auth import auth_bp
from routes.tickets import tickets_bp

app = Flask(__name__)

# Configure CORS to allow frontend requests from any port/host (local dev, docker, production)
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins and frontend_url != "*":
    allowed_origins.append(frontend_url)

CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

# Register routes
app.register_blueprint(auth_bp)
app.register_blueprint(tickets_bp)


# Run database initialization
def run_db_init_background():
    try:
        init_db()
    except Exception as e:
        print(f"[CampusFix Pro] Background DB init error: {e}")


# Run in background on app startup so server begins listening immediately
init_thread = threading.Thread(target=run_db_init_background, daemon=True)
init_thread.start()


@app.route("/")
def home():
    return jsonify({
        "status": "success",
        "message": "CampusFix Pro Backend API is running!",
        "version": "1.0.0"
    })


@app.route("/api/health")
def health():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1;")
        cursor.fetchone()

        # Check if users table exists
        cursor.execute(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');"
        )
        users_table_exists = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "message": "CampusFix Pro API and PostgreSQL are connected!",
            "database_initialized": bool(users_table_exists)
        })

    except psycopg2.Error as error:
        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "error": str(error)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()


@app.route("/api/init-db", methods=["GET", "POST"])
def manual_init_db():
    """Manual trigger to initialize schema and seed users/categories."""
    success = init_db()
    if success:
        return jsonify({
            "status": "success",
            "message": "Database tables and seed data initialized successfully!"
        }), 200
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to initialize database. Check backend logs."
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
