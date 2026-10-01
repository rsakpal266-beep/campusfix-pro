from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

from config import JWT_SECRET_KEY
from db import get_db_connection

tickets_bp = Blueprint("tickets", __name__)


def generate_ticket_id(cursor):
    cursor.execute(
        "SELECT ticket_id FROM tickets ORDER BY id DESC LIMIT 1"
    )

    last_ticket = cursor.fetchone()

    if not last_ticket:
        return "CF-1001"

    last_id = last_ticket[0]

    try:
        number = int(last_id.split("-")[1])
        return f"CF-{number + 1}"
    except (ValueError, IndexError):
        return "CF-1001"


# ============================================================
# CREATE TICKET
# ============================================================

@tickets_bp.route("/api/tickets", methods=["POST"])
def create_ticket():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No complaint data received."
        }), 400

    user_id = data.get("user_id")
    category_id = data.get("category_id")
    location = data.get("location", "").strip()
    priority = data.get("priority", "").strip()
    description = data.get("description", "").strip()

    if (
        not user_id
        or not category_id
        or not location
        or not priority
        or not description
    ):
        return jsonify({
            "status": "error",
            "message": "All required complaint fields must be filled."
        }), 400

    if priority not in ["Low", "Medium", "High"]:
        return jsonify({
            "status": "error",
            "message": "Invalid priority."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check user
        cursor.execute(
            "SELECT id FROM users WHERE id = %s",
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "User not found."
            }), 404

        # Check category
        cursor.execute(
            "SELECT id FROM categories WHERE id = %s",
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 404

        # Generate ticket ID
        ticket_id = generate_ticket_id(cursor)

        cursor.execute(
            """
            INSERT INTO tickets
            (
                ticket_id,
                user_id,
                category_id,
                location,
                priority,
                description,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                ticket_id,
                user_id,
                category_id,
                location,
                priority,
                description,
                "Submitted"
            )
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Complaint submitted successfully!",
            "ticket_id": ticket_id
        }), 201

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

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


# ============================================================
# GET LOGGED-IN USER'S TICKETS
# ============================================================

@tickets_bp.route("/api/tickets/my", methods=["GET"])
def get_my_tickets():

    # Get Authorization header
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    # Extract token
    token = auth_header.split(" ")[1]

    try:

        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Invalid token."
            }), 401

    except jwt.ExpiredSignatureError:

        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT
                t.id,
                t.ticket_id,
                t.location,
                t.priority,
                t.description,
                t.status,
                t.created_at,
                t.updated_at,
                c.name AS category,
                technician.full_name AS technician_name

            FROM tickets t

            INNER JOIN categories c
                ON t.category_id = c.id

            LEFT JOIN users technician
                ON t.technician_id = technician.id

            WHERE t.user_id = %s

            ORDER BY t.created_at DESC
            """,
            (user_id,)
        )

        tickets = cursor.fetchall()

        return jsonify({
            "status": "success",
            "tickets": tickets
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

# ============================================================
# GET SINGLE TICKET DETAILS
# ============================================================

@tickets_bp.route("/api/tickets/<ticket_id>", methods=["GET"])
def get_ticket_details(ticket_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Invalid token."
            }), 401

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            """
            SELECT
                t.id,
                t.ticket_id,
                t.location,
                t.priority,
                t.description,
                t.status,
                t.image_path,
                t.resolution_details,
                t.created_at,
                t.updated_at,

                c.name AS category,

                technician.full_name AS technician_name,
                technician.email AS technician_email

            FROM tickets t

            INNER JOIN categories c
                ON t.category_id = c.id

            LEFT JOIN users technician
                ON t.technician_id = technician.id

            WHERE t.ticket_id = %s
              AND t.user_id = %s
            """,
            (ticket_id, user_id)
        )

        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({
                "status": "error",
                "message": "Ticket not found."
            }), 404

        return jsonify({
            "status": "success",
            "ticket": ticket
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

# ============================================================
# ADMIN - GET ALL TICKETS
# ============================================================

@tickets_bp.route("/api/admin/tickets", methods=["GET"])
def get_all_tickets_admin():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                t.id,
                t.ticket_id,
                t.location,
                t.priority,
                t.description,
                t.status,
                t.image_path,
                t.resolution_details,
                t.created_at,
                t.updated_at,

                u.full_name AS user_name,
                u.email AS user_email,

                c.name AS category,

                technician.id AS technician_id,
                technician.full_name AS technician_name

            FROM tickets t

            INNER JOIN users u
                ON t.user_id = u.id

            INNER JOIN categories c
                ON t.category_id = c.id

            LEFT JOIN users technician
                ON t.technician_id = technician.id

            ORDER BY t.created_at DESC
        """)

        tickets = cursor.fetchall()

        return jsonify({
            "status": "success",
            "tickets": tickets
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


# ============================================================
# ADMIN - GET ALL TECHNICIANS
# ============================================================

@tickets_bp.route("/api/admin/technicians", methods=["GET"])
def get_technicians_admin():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                id,
                full_name,
                email,
                specialization,
                department
            FROM users
            WHERE role = 'technician'
            ORDER BY full_name
        """)

        technicians = cursor.fetchall()

        return jsonify({
            "status": "success",
            "technicians": technicians
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


# ============================================================
# ADMIN - ASSIGN TECHNICIAN TO TICKET
# ============================================================

@tickets_bp.route(
    "/api/admin/tickets/<ticket_id>/assign",
    methods=["PUT"]
)
def assign_technician(ticket_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    data = request.get_json() or {}

    technician_id = data.get("technician_id")

    if not technician_id:
        return jsonify({
            "status": "error",
            "message": "Technician ID is required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # ========================================================
        # CHECK TECHNICIAN
        # ========================================================

        cursor.execute("""
            SELECT id, full_name
            FROM users
            WHERE id = %s
              AND role = 'technician'
        """, (technician_id,))

        technician = cursor.fetchone()

        if not technician:
            return jsonify({
                "status": "error",
                "message": "Technician not found."
            }), 404

        # ========================================================
        # CHECK TICKET
        # ========================================================

        cursor.execute("""
            SELECT id, ticket_id, user_id
            FROM tickets
            WHERE ticket_id = %s
            LIMIT 1
        """, (ticket_id,))

        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({
                "status": "error",
                "message": "Ticket not found."
            }), 404

        # ========================================================
        # ASSIGN TECHNICIAN
        # ========================================================

        cursor.execute("""
            UPDATE tickets
            SET technician_id = %s,
                status = 'Assigned'
            WHERE ticket_id = %s
        """, (technician_id, ticket_id))

        # ========================================================
        # NOTIFICATION FOR TECHNICIAN
        # ========================================================

        cursor.execute("""
            INSERT INTO notifications
            (
                user_id,
                ticket_id,
                title,
                message
            )
            VALUES (%s, %s, %s, %s)
        """, (
            technician_id,
            ticket["id"],
            "New Ticket Assigned",
            f"Ticket #{ticket_id} has been assigned to you."
        ))

        # ========================================================
        # NOTIFICATION FOR STUDENT / FACULTY
        # ========================================================

        cursor.execute("""
            INSERT INTO notifications
            (
                user_id,
                ticket_id,
                title,
                message
            )
            VALUES (%s, %s, %s, %s)
        """, (
            ticket["user_id"],
            ticket["id"],
            "Technician Assigned",
            f"Technician {technician['full_name']} has been assigned to your ticket #{ticket_id}."
        ))

        # ========================================================
        # SAVE EVERYTHING
        # ========================================================

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Technician assigned successfully.",
            "ticket_id": ticket_id,
            "technician_id": technician_id,
            "technician_name": technician["full_name"]
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        print("Assignment Error:", error)

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
# ============================================================
# TECHNICIAN - GET ASSIGNED TICKETS
# ============================================================

@tickets_bp.route("/api/technician/tickets", methods=["GET"])
def get_technician_tickets():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "technician":
            return jsonify({
                "status": "error",
                "message": "Technician access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                t.id,
                t.ticket_id,
                t.location,
                t.priority,
                t.description,
                t.status,
                t.image_path,
                t.resolution_details,
                t.created_at,
                t.updated_at,

                c.name AS category,

                u.full_name AS user_name,
                u.email AS user_email

            FROM tickets t

            INNER JOIN categories c
                ON t.category_id = c.id

            INNER JOIN users u
                ON t.user_id = u.id

            WHERE t.technician_id = %s

            ORDER BY t.created_at DESC
        """, (user_id,))

        tickets = cursor.fetchall()

        return jsonify({
            "status": "success",
            "tickets": tickets
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
# ============================================================
# TECHNICIAN - GET TICKET DETAILS
# ============================================================

@tickets_bp.route("/api/technician/tickets/<ticket_id>", methods=["GET"])
def get_technician_ticket_details(ticket_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "technician":
            return jsonify({
                "status": "error",
                "message": "Technician access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                t.id,
                t.ticket_id,
                t.location,
                t.priority,
                t.description,
                t.image_path,
                t.status,
                t.resolution_details,
                t.created_at,
                t.updated_at,

                c.name AS category,

                u.full_name AS user_name,
                u.email AS user_email,

                tech.full_name AS technician_name

            FROM tickets t

            INNER JOIN categories c
                ON t.category_id = c.id

            INNER JOIN users u
                ON t.user_id = u.id

            LEFT JOIN users tech
                ON t.technician_id = tech.id

            WHERE t.ticket_id = %s
              AND t.technician_id = %s

            LIMIT 1
        """, (ticket_id, user_id))

        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({
                "status": "error",
                "message": "Ticket not found or not assigned to you."
            }), 404

        return jsonify({
            "status": "success",
            "ticket": ticket
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
# ============================================================
# UPDATE TECHNICIAN TICKET
# ============================================================

@tickets_bp.route("/api/technician/tickets/<ticket_id>", methods=["PUT"])
def update_technician_ticket(ticket_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "technician":
            return jsonify({
                "status": "error",
                "message": "Technician access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    data = request.get_json() or {}

    new_status = data.get("status")
    resolution_details = data.get("resolution_details", "")

    allowed_statuses = [
        "Assigned",
        "In Progress",
        "Resolved"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "status": "error",
            "message": "Invalid ticket status."
        }), 400

    if new_status == "Resolved" and not resolution_details.strip():
        return jsonify({
            "status": "error",
            "message": "Resolution details are required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # Check ticket and get current status + ticket owner
        cursor.execute(
            """
            SELECT id, user_id, status
            FROM tickets
            WHERE ticket_id = %s
              AND technician_id = %s
            LIMIT 1
            """,
            (ticket_id, user_id)
        )

        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({
                "status": "error",
                "message": "Ticket not found or not assigned to you."
            }), 404

        old_status = ticket["status"]
        ticket_owner_id = ticket["user_id"]

        # Update ticket
        cursor.execute(
            """
            UPDATE tickets
            SET
                status = %s,
                resolution_details = %s
            WHERE ticket_id = %s
              AND technician_id = %s
            """,
            (
                new_status,
                resolution_details.strip(),
                ticket_id,
                user_id
            )
        )

        # Create notification only when status changes
        if old_status != new_status:

            if new_status == "In Progress":
                notification_title = "Ticket Status Updated"
                notification_message = (
                    f"Ticket #{ticket_id} is now In Progress."
                )

            elif new_status == "Resolved":
                notification_title = "Ticket Resolved"
                notification_message = (
                    f"Ticket #{ticket_id} has been resolved."
                )

            else:
                notification_title = "Ticket Status Updated"
                notification_message = (
                    f"Ticket #{ticket_id} status has been updated to {new_status}."
                )

            cursor.execute(
                """
                INSERT INTO notifications
                (
                    user_id,
                    ticket_id,
                    title,
                    message
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    ticket_owner_id,
                    ticket["id"],
                    notification_title,
                    notification_message
                )
            )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Ticket updated successfully."
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

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
# ============================================================
# ADMIN - GET ALL USERS
# ============================================================

@tickets_bp.route("/api/admin/users", methods=["GET"])
def get_all_users():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                id,
                full_name,
                email,
                role,
                phone,
                department,
                specialization,
                created_at
            FROM users
            ORDER BY created_at DESC
        """)

        users = cursor.fetchall()

        return jsonify({
            "status": "success",
            "users": users
        }), 200

    except psycopg2.Error as error:

        print("Get Users Error:", error)

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
# ============================================================
# ADMIN - GET ALL CATEGORIES
# ============================================================

@tickets_bp.route("/api/admin/categories", methods=["GET"])
def get_all_categories():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                c.id,
                c.name,
                c.description,
                c.created_at,
                COUNT(t.id) AS tickets
            FROM categories c
            LEFT JOIN tickets t
                ON c.id = t.category_id
            GROUP BY
                c.id,
                c.name,
                c.description,
                c.created_at
            ORDER BY c.id
        """)

        categories = cursor.fetchall()

        return jsonify({
            "status": "success",
            "categories": categories
        }), 200

    except psycopg2.Error as error:

        print("Get Categories Error:", error)

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
# ============================================================
# ADMIN - ADD CATEGORY
# ============================================================

@tickets_bp.route("/api/admin/categories", methods=["POST"])
def add_category():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request data is required."
        }), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({
            "status": "error",
            "message": "Category name is required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # Check duplicate category
        cursor.execute(
            "SELECT id FROM categories WHERE name = %s",
            (name,)
        )

        existing = cursor.fetchone()

        if existing:
            return jsonify({
                "status": "error",
                "message": "Category already exists."
            }), 409

        cursor.execute(
            """
            INSERT INTO categories
            (name, description)
            VALUES (%s, %s)
            RETURNING id
            """,
            (name, description)
        )

        category_id = cursor.fetchone()["id"]

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Category added successfully.",
            "category": {
                "id": category_id,
                "name": name,
                "description": description,
                "tickets": 0
            }
        }), 201

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        print("Add Category Error:", error)

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


# ============================================================
# ADMIN - UPDATE CATEGORY
# ============================================================

@tickets_bp.route("/api/admin/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request data is required."
        }), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({
            "status": "error",
            "message": "Category name is required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # Check category exists
        cursor.execute(
            "SELECT id FROM categories WHERE id = %s",
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 404

        # Check duplicate name
        cursor.execute(
            """
            SELECT id
            FROM categories
            WHERE name = %s AND id != %s
            """,
            (name, category_id)
        )

        duplicate = cursor.fetchone()

        if duplicate:
            return jsonify({
                "status": "error",
                "message": "Another category with this name already exists."
            }), 409

        cursor.execute(
            """
            UPDATE categories
            SET name = %s,
                description = %s
            WHERE id = %s
            """,
            (name, description, category_id)
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Category updated successfully."
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        print("Update Category Error:", error)

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


# ============================================================
# ADMIN - DELETE CATEGORY
# ============================================================

@tickets_bp.route("/api/admin/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # Check category exists
        cursor.execute(
            "SELECT id, name FROM categories WHERE id = %s",
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 404

        # Check whether tickets use this category
        cursor.execute(
            """
            SELECT COUNT(*) AS ticket_count
            FROM tickets
            WHERE category_id = %s
            """,
            (category_id,)
        )

        result = cursor.fetchone()

        if result["ticket_count"] > 0:
            return jsonify({
                "status": "error",
                "message": (
                    f"Cannot delete '{category['name']}' because "
                    f"{result['ticket_count']} ticket(s) are using this category."
                )
            }), 409

        cursor.execute(
            "DELETE FROM categories WHERE id = %s",
            (category_id,)
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Category deleted successfully."
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        print("Delete Category Error:", error)

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
# ============================================================
# NOTIFICATIONS
# ============================================================

@tickets_bp.route("/api/notifications", methods=["GET"])
def get_notifications():

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Invalid token."
            }), 401

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                n.id,
                n.ticket_id,
                n.title,
                n.message,
                n.is_read,
                n.created_at,
                t.ticket_id AS ticket_number
            FROM notifications n
            LEFT JOIN tickets t
                ON n.ticket_id = t.id
            WHERE n.user_id = %s
            ORDER BY n.created_at DESC
        """, (user_id,))

        notifications = cursor.fetchall()

        return jsonify({
            "status": "success",
            "notifications": notifications
        }), 200

    except psycopg2.Error as error:

        print("Notification Database Error:", error)

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


# ============================================================
# MARK NOTIFICATION AS READ
# ============================================================

@tickets_bp.route(
    "/api/notifications/<int:notification_id>/read",
    methods=["PUT"]
)
def mark_notification_read(notification_id):

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Invalid token."
            }), 401

    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = %s
              AND user_id = %s
        """, (notification_id, user_id))

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "status": "error",
                "message": "Notification not found."
            }), 404

        return jsonify({
            "status": "success",
            "message": "Notification marked as read."
        }), 200

    except psycopg2.Error as error:

        if connection:
            connection.rollback()

        print("Mark Notification Database Error:", error)

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
            # ============================================================
# ADMIN - DASHBOARD SUMMARY
# ============================================================

@tickets_bp.route("/api/admin/dashboard", methods=["GET"])
def get_admin_dashboard():

    # --------------------------------------------------------
    # CHECK ADMIN AUTHENTICATION
    # --------------------------------------------------------

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({
            "status": "error",
            "message": "Authorization token is required."
        }), 401

    token = auth_header.split(" ")[1]

    try:

        decoded = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = decoded.get("user_id")
        role = decoded.get("role")

        if not user_id or role != "admin":
            return jsonify({
                "status": "error",
                "message": "Admin access required."
            }), 403

    except jwt.ExpiredSignatureError:

        return jsonify({
            "status": "error",
            "message": "Token has expired. Please login again."
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "status": "error",
            "message": "Invalid token."
        }), 401


    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)


        # ----------------------------------------------------
        # TOTAL TICKETS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM tickets
        """)

        total_tickets = cursor.fetchone()["total"]


        # ----------------------------------------------------
        # PENDING TICKETS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status IN ('Submitted', 'Pending')
        """)

        pending_tickets = cursor.fetchone()["total"]


        # ----------------------------------------------------
        # IN PROGRESS TICKETS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'In Progress'
        """)

        in_progress_tickets = cursor.fetchone()["total"]


        # ----------------------------------------------------
        # RESOLVED TICKETS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'Resolved'
        """)

        resolved_tickets = cursor.fetchone()["total"]


        # ----------------------------------------------------
        # RECENT TICKETS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                t.ticket_id,
                t.location,
                t.priority,
                t.status,
                t.created_at,

                c.name AS category,

                u.full_name AS user_name,

                technician.full_name AS technician_name

            FROM tickets t

            INNER JOIN categories c
                ON t.category_id = c.id

            INNER JOIN users u
                ON t.user_id = u.id

            LEFT JOIN users technician
                ON t.technician_id = technician.id

            ORDER BY t.created_at DESC

            LIMIT 5
        """)

        recent_tickets = cursor.fetchall()


        # ----------------------------------------------------
        # TOTAL USERS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM users
        """)

        total_users = cursor.fetchone()["total"]


        # ----------------------------------------------------
        # TOTAL TECHNICIANS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'technician'
        """)

        total_technicians = cursor.fetchone()["total"]


        # ----------------------------------------------------
        # RETURN DASHBOARD DATA
        # ----------------------------------------------------

        return jsonify({

            "status": "success",

            "statistics": {

                "total_tickets": total_tickets,

                "pending": pending_tickets,

                "in_progress": in_progress_tickets,

                "resolved": resolved_tickets,

                "total_users": total_users,

                "total_technicians": total_technicians

            },

            "recent_tickets": recent_tickets

        }), 200


    except psycopg2.Error as error:

        print("Admin Dashboard Error:", error)

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