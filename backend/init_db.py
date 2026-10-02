"""Database initialization and seeding helper for CampusFix Pro (12 tables)."""

from datetime import datetime
from sqlalchemy import text
from database import engine, SessionLocal, Base
from models import (
    User,
    Category,
    Location,
    Ticket,
    TicketHistory,
    TicketComment,
    TicketFeedback,
    Notification,
    InventoryItem,
    TechnicianAssignment,
    FixBotChatLog,
)
from security import hash_password

CATEGORIES = [
    (1, "Electrical", "Electrical fixtures, wiring, lights, fans, and appliances", "zap"),
    (2, "Plumbing", "Water supply, leakages, taps, drainage, and sanitation", "droplet"),
    (3, "Furniture", "Desks, chairs, tables, benches, and classroom furniture", "chair"),
    (4, "Cleaning", "Campus cleanliness, waste disposal, washrooms, and hygiene", "sparkles"),
    (5, "Internet / Network", "Wi-Fi, Ethernet, routers, and campus network connectivity", "wifi"),
    (6, "Classroom Equipment", "Projectors, smartboards, audio systems, and lab tools", "monitor"),
    (7, "Other", "General campus maintenance and miscellaneous issues", "wrench"),
]

DEFAULT_LOCATIONS = [
    ("Block A - Academic Wing", "BLK-A", "Ground Floor", "Room 004 Restroom", "Near East Stairs"),
    ("Block A - Academic Wing", "BLK-A", "2nd Floor", "Room 204 Lecture Hall", "Opposite Faculty Lounge"),
    ("Central Library", "LIB", "1st Floor", "Main Reading Hall", "Near Rack 4"),
    ("Seminar Complex", "SEM", "Ground Floor", "Seminar Hall 1", "Main Entrance lobby"),
    ("Science & Innovation Lab", "LAB-S", "3rd Floor", "IoT & Robotics Lab", "Wing B"),
    ("Hostel Block 1", "HST-1", "2nd Floor", "Room 218", "Boys Hostel Wing"),
]

DEFAULT_INVENTORY = [
    ("LED Tube Light 20W", "ELEC-LED-20", 1, 45, "pieces", 10, 150.00),
    ("Ceiling Fan Regulator Switch", "ELEC-REG-01", 1, 30, "pieces", 5, 80.00),
    ("Brass Water Tap 0.5 inch", "PLUMB-TAP-05", 2, 25, "pieces", 6, 280.00),
    ("PVC Pipe Joint Elbow", "PLUMB-ELB-02", 2, 60, "pieces", 15, 45.00),
    ("Ergonomic Desk Chair Wheel", "FURN-WHL-01", 3, 40, "pieces", 8, 120.00),
    ("Cat6 Ethernet Cable (305m roll)", "NET-CAT6-300", 5, 4, "rolls", 2, 4500.00),
    ("HDMI to USB-C 4K Cable 5m", "AV-HDMI-5M", 6, 18, "pieces", 4, 650.00),
]


def run_migrations():
    """Ensure database schema is up-to-date with non-breaking column additions."""
    try:
        with engine.begin() as conn:
            dialect = engine.dialect.name
            if dialect == "postgresql":
                # categories
                conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'wrench';"))
                conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                # users
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS student_or_emp_id VARCHAR(100);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
                # tickets
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(10,2) DEFAULT 0.00;"))
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_details TEXT;"))
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;"))
                # notifications
                conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'ticket';"))
            elif dialect == "sqlite":
                # categories
                try:
                    res = conn.execute(text("PRAGMA table_info(categories);")).fetchall()
                    cols = [r[1] for r in res]
                    if cols:
                        if "icon" not in cols:
                            conn.execute(text("ALTER TABLE categories ADD COLUMN icon VARCHAR(50) DEFAULT 'wrench';"))
                        if "is_active" not in cols:
                            conn.execute(text("ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT 1;"))
                        if "created_at" not in cols:
                            conn.execute(text("ALTER TABLE categories ADD COLUMN created_at TIMESTAMP;"))
                except Exception:
                    pass

                # users
                try:
                    res = conn.execute(text("PRAGMA table_info(users);")).fetchall()
                    cols = [r[1] for r in res]
                    if cols:
                        if "college_name" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN college_name VARCHAR(255);"))
                        if "created_by_id" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN created_by_id INTEGER;"))
                        if "specialization" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN specialization VARCHAR(255);"))
                        if "student_or_emp_id" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN student_or_emp_id VARCHAR(100);"))
                        if "phone" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50);"))
                        if "department" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(255);"))
                        if "is_active" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;"))
                except Exception:
                    pass
    except Exception as e:
        print(f"[CampusFix Pro] Schema migration note: {e}")


def init_db() -> bool:
    """Create all 12 tables and seed default baseline data."""
    print("[CampusFix Pro] Initializing 12 database tables...")

    try:
        # Create all tables defined in Base metadata
        Base.metadata.create_all(bind=engine)
        print("[CampusFix Pro] All 12 tables verified / created.")

        # Run safe migrations for existing tables
        run_migrations()

        db = SessionLocal()

        # 1. Seed Categories
        for cat_id, name, desc, icon in CATEGORIES:
            cat = db.query(Category).filter(Category.id == cat_id).first()
            if not cat:
                cat = Category(id=cat_id, name=name, description=desc, icon=icon, is_active=True)
                db.add(cat)
            else:
                cat.name = name
                cat.description = desc
                cat.icon = icon
        db.commit()
        print("[CampusFix Pro] Categories seeded.")

        # 2. Seed Locations
        if db.query(Location).count() == 0:
            for b_name, b_code, floor, room, landmark in DEFAULT_LOCATIONS:
                loc = Location(
                    building_name=b_name,
                    block_code=b_code,
                    floor=floor,
                    room_number=room,
                    landmark=landmark,
                    is_active=True,
                )
                db.add(loc)
            db.commit()
            print("[CampusFix Pro] Locations seeded.")

        # 3. Seed Inventory Items
        for name, code, cat_id, qty, unit, min_t, cost in DEFAULT_INVENTORY:
            inv = db.query(InventoryItem).filter(InventoryItem.item_code == code).first()
            if not inv:
                inv = InventoryItem(
                    item_name=name,
                    item_code=code,
                    category_id=cat_id,
                    quantity=qty,
                    unit=unit,
                    min_threshold=min_t,
                    unit_cost=cost,
                )
                db.add(inv)
        db.commit()
        print("[CampusFix Pro] Inventory items seeded.")

        # 4. Remove any legacy demo seed accounts and seed tickets so system starts completely clean
        legacy_emails = [
            "admin@campusfix.com",
            "faculty@campusfix.com",
            "rahul@campusfix.com",
            "student@campusfix.com",
            "tech@campusfix.com",
            "test@gmailcom",
        ]
        legacy_users = db.query(User).filter(User.email.in_(legacy_emails)).all()
        legacy_user_ids = [u.id for u in legacy_users]
        if legacy_user_ids:
            # Delete notifications
            db.query(Notification).filter(Notification.user_id.in_(legacy_user_ids)).delete(synchronize_session=False)
            # Find tickets by or assigned to these users
            tickets_to_clean = db.query(Ticket).filter(
                (Ticket.user_id.in_(legacy_user_ids)) | (Ticket.technician_id.in_(legacy_user_ids))
            ).all()
            ticket_ids = [t.id for t in tickets_to_clean]
            if ticket_ids:
                db.query(Notification).filter(Notification.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
                db.query(TicketComment).filter(TicketComment.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
                db.query(TicketHistory).filter(TicketHistory.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
                db.query(TicketFeedback).filter(TicketFeedback.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
                db.query(TechnicianAssignment).filter(TechnicianAssignment.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
                db.query(Ticket).filter(Ticket.id.in_(ticket_ids)).delete(synchronize_session=False)
            
            # Reset created_by_id if any remaining users reference legacy admin
            db.query(User).filter(User.created_by_id.in_(legacy_user_ids)).update({User.created_by_id: None}, synchronize_session=False)
            # Delete legacy users
            db.query(User).filter(User.id.in_(legacy_user_ids)).delete(synchronize_session=False)
            db.commit()
            print(f"[CampusFix Pro] Purged {len(legacy_user_ids)} legacy seed users and all demo tickets.")
        else:
            print("[CampusFix Pro] Database ready without seed users. Colleges register via /register.")

        db.close()
        print("[CampusFix Pro] Database initialization completed successfully!")
        return True

    except Exception as e:
        print(f"[CampusFix Pro] Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    init_db()
