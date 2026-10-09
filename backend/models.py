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

    role = Column(
        String(50),
        nullable=False,
        index=True
    )  # student, faculty, technician, admin

    phone = Column(String(50), nullable=True)
    department = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    student_or_emp_id = Column(String(100), nullable=True)
    college_name = Column(String(255), nullable=True)

    created_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Account activation
    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # College Admin approval status
    approval_status = Column(
        String(20),
        default="approved",
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    tickets = relationship(
        "Ticket",
        back_populates="creator",
        foreign_keys="Ticket.user_id"
    )

    assigned_tickets = relationship(
        "Ticket",
        back_populates="technician",
        foreign_keys="Ticket.technician_id"
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    comments = relationship(
        "TicketComment",
        back_populates="author",
        cascade="all, delete-orphan"
    )

    chat_logs = relationship(
        "FixBotChatLog",
        back_populates="user"
    )
