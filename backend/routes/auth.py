from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

from datetime import datetime, timedelta, timezone

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from config import JWT_SECRET_KEY
from db import get_db_connection

auth_bp = Blueprint("auth", __name__)


# =========================================================
# REGISTER
# =========================================================

@auth_bp.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No registration data received."
        }), 400

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "").strip().lower()

    # Validate required fields
    if not full_name or not email or not password or not role:
        return jsonify({
            "status": "error",
            "message": "All required fields must be filled."
        }), 400

    # Public registration is only for Student and Faculty
    if role not in ["student", "faculty"]:
        return jsonify({
            "status": "error",
            "message": "Only Student and Faculty registration is allowed."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether email already exists
        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "status": "error",
                "message": "An account with this email already exists."
            }), 409

        # Securely hash password
        password_hash = generate_password_hash(password)

        # Insert new user
        cursor.execute(
            """
            INSERT INTO users
            (full_name, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
            """,
            (
                full_name,
                email,
                password_hash,
                role
            )
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Registration successful!"
        }), 201

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        import traceback
        print("REGISTER ERROR:", str(error), flush=True)
        traceback.print_exc()
    
        return jsonify({
            "status": "error",
            "message": "Registration failed.",
            "error": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection is not None:
            connection.close()


# =========================================================
# LOGIN
# =========================================================

@auth_bp.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No login data received."
        }), 400

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT id, full_name, email, password_hash, role
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401

        # Verify password
        if not check_password_hash(
            user["password_hash"],
            password
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401

        # Create JWT token
        token = jwt.encode(
            {
                "user_id": user["id"],
                "email": user["email"],
                "role": user["role"],
                "exp": datetime.now(timezone.utc)
                + timedelta(hours=24)
            },
            JWT_SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "status": "success",
            "message": "Login successful!",
            "token": token,
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except psycopg2.Error as error:

        return jsonify({
            "status": "error",
            "message": "Database error occurred.",
            "error": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection is not None:
            connection.close()


# =========================================================
# UPDATE PROFILE
# =========================================================

@auth_bp.route("/api/profile", methods=["PUT"])
def update_profile():

    # Get Authorization header
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    # Verify JWT token
    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = payload.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Invalid user information."
            }), 401

    except jwt.ExpiredSignatureError:

        return jsonify({
            "status": "error",
            "message": "Login session has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "status": "error",
            "message": "Invalid authorization token."
        }), 401

    # Get request data
    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No profile data received."
        }), 400

    full_name = data.get("full_name", "").strip()

    if not full_name:
        return jsonify({
            "status": "error",
            "message": "Full name is required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # Update user's full name
        cursor.execute(
            """
            UPDATE users
            SET full_name = %s
            WHERE id = %s
            """,
            (
                full_name,
                user_id
            )
        )

        if cursor.rowcount == 0:
            return jsonify({
                "status": "error",
                "message": "User account not found."
            }), 404

        connection.commit()

        # Get updated user information
        cursor.execute(
            """
            SELECT id, full_name, email, role
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully.",
            "user": user
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Database error occurred."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection is not None:
            connection.close()


# =========================================================
# FORGOT PASSWORD
# =========================================================

@auth_bp.route("/api/forgot-password", methods=["POST"])
def forgot_password():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received."
        }), 400

    email = data.get("email", "").strip()

    if not email:
        return jsonify({
            "status": "error",
            "message": "Email is required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT id, email
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "No account found with this email."
            }), 404

        # Create password reset token
        reset_token = jwt.encode(
            {
                "user_id": user["id"],
                "email": user["email"],
                "purpose": "password_reset",
                "exp": datetime.now(timezone.utc)
                + timedelta(minutes=15)
            },
            JWT_SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "status": "success",
            "message": "Password reset request created successfully.",
            "reset_token": reset_token
        }), 200

    except psycopg2.Error as error:

        return jsonify({
            "status": "error",
            "message": "Database error occurred.",
            "error": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection is not None:
            connection.close()


# =========================================================
# RESET PASSWORD
# =========================================================

@auth_bp.route("/api/reset-password", methods=["POST"])
def reset_password():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received."
        }), 400

    reset_token = data.get("reset_token", "")
    new_password = data.get("new_password", "")

    if not reset_token or not new_password:
        return jsonify({
            "status": "error",
            "message": "Reset token and new password are required."
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "status": "error",
            "message": "Password must contain at least 6 characters."
        }), 400

    try:

        payload = jwt.decode(
            reset_token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        if payload.get("purpose") != "password_reset":
            return jsonify({
                "status": "error",
                "message": "Invalid password reset token."
            }), 400

        user_id = payload.get("user_id")

    except jwt.ExpiredSignatureError:

        return jsonify({
            "status": "error",
            "message": "Password reset token has expired."
        }), 400

    except jwt.InvalidTokenError:

        return jsonify({
            "status": "error",
            "message": "Invalid password reset token."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        # Hash new password
        password_hash = generate_password_hash(new_password)

        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s
            WHERE id = %s
            """,
            (
                password_hash,
                user_id
            )
        )

        if cursor.rowcount == 0:
            return jsonify({
                "status": "error",
                "message": "User account not found."
            }), 404

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Password reset successfully. You can now login."
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Database error occurred."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection is not None:
            connection.close()


# =========================================================
# CHANGE PASSWORD
# =========================================================

@auth_bp.route("/api/change-password", methods=["POST"])
def change_password():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received."
        }), 400

    # -----------------------------------------------------
    # Get Authorization Token
    # -----------------------------------------------------

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    # -----------------------------------------------------
    # Verify JWT Token
    # -----------------------------------------------------

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = payload.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Invalid user information."
            }), 401

    except jwt.ExpiredSignatureError:

        return jsonify({
            "status": "error",
            "message": "Login session has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "status": "error",
            "message": "Invalid authorization token."
        }), 401

    # -----------------------------------------------------
    # Get Password Data
    # -----------------------------------------------------

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({
            "status": "error",
            "message": "Current password and new password are required."
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "status": "error",
            "message": "New password must contain at least 6 characters."
        }), 400

    if current_password == new_password:
        return jsonify({
            "status": "error",
            "message": "New password must be different from current password."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # -------------------------------------------------
        # Get Current Password Hash
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT password_hash
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "User account not found."
            }), 404

        # -------------------------------------------------
        # Verify Current Password
        # -------------------------------------------------

        if not check_password_hash(
            user["password_hash"],
            current_password
        ):
            return jsonify({
                "status": "error",
                "message": "Current password is incorrect."
            }), 401

        # -------------------------------------------------
        # Hash New Password
        # -------------------------------------------------

        new_password_hash = generate_password_hash(
            new_password
        )

        # -------------------------------------------------
        # Update Password in PostgreSQL
        # -------------------------------------------------

        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s
            WHERE id = %s
            """,
            (
                new_password_hash,
                user_id
            )
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Password changed successfully."
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Database error occurred."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection is not None:
            connection.close()
