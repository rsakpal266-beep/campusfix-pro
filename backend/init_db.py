"""Database initialization and seeding helper for CampusFix Pro."""

import os
import time
import psycopg2
from werkzeug.security import generate_password_hash

from db import get_db_connection

CATEGORIES = [
    (1, "Electrical", "Electrical fixtures, wiring, lights, fans, and appliances"),
    (2, "Plumbing", "Water supply, leakages, taps, drainage, and sanitation"),
    (3, "Furniture", "Desks, chairs, tables, benches, and classroom furniture"),
    (4, "Cleaning", "Campus cleanliness, waste disposal, washrooms, and hygiene"),
    (5, "Internet / Network", "Wi-Fi, Ethernet, routers, and campus network connectivity"),
    (6, "Classroom Equipment", "Projectors, smartboards, audio systems, and lab tools"),
    (7, "Other", "General campus maintenance and miscellaneous issues"),
]

DEFAULT_USERS = [
    (
        "CampusFix Administrator",
        "admin@campusfix.com",
        "Admin@123",
        "admin",
        "Administration",
        "System Administrator",
        "+91 98765 43210",
    ),
    (
        "Rahul Patil",
        "rahul@campusfix.com",
        "Tech@123",
        "technician",
        "Facilities & Maintenance",
        "Senior Electrical & Plumbing Technician",
        "+91 98765 43211",
    ),
    (
        "Demo Student",
        "student@campusfix.com",
        "Student@123",
        "student",
        "Computer Engineering",
        "Undergraduate Student",
        "+91 98765 43212",
    ),
]

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users (id),
    category_id INTEGER NOT NULL REFERENCES categories (id),
    technician_id INTEGER REFERENCES users (id),
    location VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    image_path TEXT,
    resolution_details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id),
    ticket_id INTEGER REFERENCES tickets (id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_updated_at ON tickets;
CREATE TRIGGER tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
"""


def wait_for_database(max_retries: int = 15, delay_seconds: int = 2):
    """Wait until PostgreSQL is accepting connections."""
    for attempt in range(1, max_retries + 1):
        try:
            conn = get_db_connection()
            conn.close()
            print(f"[CampusFix Pro] Database connection established (attempt {attempt}).")
            return True
        except psycopg2.OperationalError as e:
            print(f"[CampusFix Pro] Waiting for database ({attempt}/{max_retries})... {e}")
            time.sleep(delay_seconds)
    raise RuntimeError("Could not connect to PostgreSQL after multiple retries.")


def init_db():
    """Ensure database tables, categories, and initial users exist."""
    print("[CampusFix Pro] Starting database initialization and verification...")

    try:
        wait_for_database()
    except Exception as e:
        print(f"[CampusFix Pro] Warning: Database wait failed: {e}")
        return False

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Execute schema creation
        cur.execute(SCHEMA_SQL)
        conn.commit()
        print("[CampusFix Pro] Core schema tables verified/created.")

        # 2. Seed default categories (with exact IDs 1-7 expected by frontend)
        for cat_id, name, desc in CATEGORIES:
            cur.execute(
                """
                INSERT INTO categories (id, name, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO UPDATE
                SET name = EXCLUDED.name, description = EXCLUDED.description
                """,
                (cat_id, name, desc),
            )
        # Advance the sequence to prevent ID conflicts on future category creation
        cur.execute(
            "SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));"
        )
        conn.commit()
        print("[CampusFix Pro] Categories verified/seeded.")

        # 3. Seed default users
        user_ids = {}
        for full_name, email, password, role, dept, spec, phone in DEFAULT_USERS:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            if existing is None:
                cur.execute(
                    """
                    INSERT INTO users
                    (full_name, email, password_hash, role, department, specialization, phone)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        full_name,
                        email,
                        generate_password_hash(password),
                        role,
                        dept,
                        spec,
                        phone,
                    ),
                )
                new_id = cur.fetchone()[0]
                user_ids[role] = new_id
                print(f"[CampusFix Pro] Created {role} user: {email}")
            else:
                user_ids[role] = existing[0]
                # Update password hash to guarantee default seeded credentials work
                cur.execute(
                    """
                    UPDATE users
                    SET password_hash = %s, full_name = %s, role = %s
                    WHERE id = %s
                    """,
                    (
                        generate_password_hash(password),
                        full_name,
                        role,
                        existing[0],
                    ),
                )
        conn.commit()
        print("[CampusFix Pro] Users verified/seeded.")

        # 4. Seed sample tickets if none exist
        cur.execute("SELECT COUNT(*) FROM tickets")
        ticket_count = cur.fetchone()[0]
        if ticket_count == 0 and "student" in user_ids and "technician" in user_ids:
            student_id = user_ids["student"]
            tech_id = user_ids["technician"]

            sample_tickets = [
                (
                    "CF-1001",
                    student_id,
                    2,  # Plumbing
                    tech_id,
                    "Block A - Ground Floor Restroom",
                    "High",
                    "Continuous water leakage from pipe joint under the sink.",
                    "In Progress",
                ),
                (
                    "CF-1002",
                    student_id,
                    1,  # Electrical
                    tech_id,
                    "Room 204 - 2nd Floor",
                    "Medium",
                    "Ceiling fan making loud grinding noise and running at low speed.",
                    "In Progress",
                ),
                (
                    "CF-1003",
                    student_id,
                    3,  # Furniture
                    tech_id,
                    "Central Library - Reading Hall",
                    "Low",
                    "Broken wooden armrest on study chair near rack 4.",
                    "Resolved",
                ),
                (
                    "CF-1004",
                    student_id,
                    6,  # Classroom Equipment
                    None,
                    "Seminar Hall 1",
                    "High",
                    "Overhead projector flickering and losing HDMI signal intermittently.",
                    "Submitted",
                ),
            ]

            for t_id, u_id, cat_id, t_tech_id, loc, prio, desc, status in sample_tickets:
                cur.execute(
                    """
                    INSERT INTO tickets
                    (ticket_id, user_id, category_id, technician_id, location, priority, description, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (t_id, u_id, cat_id, t_tech_id, loc, prio, desc, status),
                )
                db_ticket_id = cur.fetchone()[0]

                # Create sample notification for student
                cur.execute(
                    """
                    INSERT INTO notifications
                    (user_id, ticket_id, title, message)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        u_id,
                        db_ticket_id,
                        f"Ticket #{t_id} {status}",
                        f"Your ticket #{t_id} ({loc}) status is currently: {status}.",
                    ),
                )

            conn.commit()
            print("[CampusFix Pro] Sample tickets and notifications seeded.")

        print("[CampusFix Pro] Database initialization completed successfully!")
        return True

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[CampusFix Pro] Error during database initialization: {e}")
        return False

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    init_db()
