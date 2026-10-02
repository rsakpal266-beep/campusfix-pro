"""SQLAlchemy ORM models for CampusFix Pro (12 tables)."""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
)
from sqlalchemy.orm import relationship
from database import Base


# 1. USERS TABLE (Roles: student, faculty, technician, admin)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(50), nullable=False, index=True)  # student, faculty, technician, admin
    phone = Column(String(50), nullable=True)
    department = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    student_or_emp_id = Column(String(100), nullable=True)
    college_name = Column(String(255), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tickets = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.user_id")
    assigned_tickets = relationship("Ticket", back_populates="technician", foreign_keys="Ticket.technician_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("TicketComment", back_populates="author", cascade="all, delete-orphan")
    chat_logs = relationship("FixBotChatLog", back_populates="user")


# 2. CATEGORIES TABLE
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="wrench", nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    tickets = relationship("Ticket", back_populates="category")
    inventory = relationship("InventoryItem", back_populates="category")


# 3. LOCATIONS TABLE (Campus blocks, buildings, floors, rooms)
class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    building_name = Column(String(255), nullable=False)
    block_code = Column(String(50), nullable=True)
    floor = Column(String(50), nullable=True)
    room_number = Column(String(100), nullable=True)
    landmark = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# 4. TICKETS TABLE
class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    location = Column(String(255), nullable=False)
    priority = Column(String(20), default="Medium", nullable=False)  # Low, Medium, High, Critical
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Submitted", nullable=False, index=True)  # Submitted, Pending, Assigned, In Progress, Resolved, Closed
    image_path = Column(Text, nullable=True)
    resolution_details = Column(Text, nullable=True)
    estimated_cost = Column(Numeric(10, 2), default=0.00, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[user_id], back_populates="tickets")
    technician = relationship("User", foreign_keys=[technician_id], back_populates="assigned_tickets")
    category = relationship("Category", back_populates="tickets")
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")
    feedback = relationship("TicketFeedback", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="ticket")
    assignments = relationship("TechnicianAssignment", back_populates="ticket", cascade="all, delete-orphan")


# 5. TICKET_HISTORY TABLE (Audit trail)
class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="history")
    changed_by = relationship("User")


# 6. TICKET_COMMENTS TABLE
class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")


# 7. TICKET_ATTACHMENTS TABLE
class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="attachments")


# 8. TICKET_FEEDBACK TABLE
class TicketFeedback(Base):
    __tablename__ = "ticket_feedback"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="feedback")
    user = relationship("User")


# 9. NOTIFICATIONS TABLE
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    type = Column(String(50), default="ticket", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")
    ticket = relationship("Ticket", back_populates="notifications")


# 10. INVENTORY_ITEMS TABLE (Maintenance supplies)
class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(255), nullable=False)
    item_code = Column(String(100), unique=True, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    unit = Column(String(50), default="pieces", nullable=False)
    min_threshold = Column(Integer, default=5, nullable=False)
    unit_cost = Column(Numeric(10, 2), default=0.00, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    category = relationship("Category", back_populates="inventory")


# 11. TECHNICIAN_ASSIGNMENTS TABLE
class TechnicianAssignment(Base):
    __tablename__ = "technician_assignments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assignment_notes = Column(Text, nullable=True)
    status = Column(String(50), default="Assigned", nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    ticket = relationship("Ticket", back_populates="assignments")
    technician = relationship("User", foreign_keys=[technician_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])


# 12. FIXBOT_CHAT_LOGS TABLE (Real AI assistant logs)
class FixBotChatLog(Base):
    __tablename__ = "fixbot_chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(100), nullable=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    provider = Column(String(50), default="gemini", nullable=True)
    intent = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="chat_logs")
