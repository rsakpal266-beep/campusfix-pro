"""Seed the initial Admin and Technician accounts (idempotent)."""

from werkzeug.security import generate_password_hash

from db import get_db_connection

SEEDS = [
    (
        "CampusFix Administrator",
        "admin@campusfix.com",
        "Admin@123",
        "admin",
    ),
    (
        "Rahul Patil",
        "rahul@campusfix.com",
        "Tech@123",
        "technician",
    ),
    (
        "Demo Student",
        "student@campusfix.com",
        "Student@123",
        "student",
    ),
]

connection = get_db_connection()
cursor = connection.cursor()

for full_name, email, password, role in SEEDS:
    cursor.execute(
        "SELECT id FROM users WHERE email = %s",
        (email,),
    )
    if cursor.fetchone() is None:
        cursor.execute(
            """
            INSERT INTO users
            (full_name, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
            """,
            (full_name, email, generate_password_hash(password), role),
        )
        print("Created %s account: %s" % (role, email))
    else:
        print("%s account already exists: %s" % (role, email))

connection.commit()

cursor.close()
connection.close()

print("Seeding complete.")
print("Admin Email: admin@campusfix.com")
print("Technician Email: rahul@campusfix.com")
