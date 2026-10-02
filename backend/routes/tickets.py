"""Ticket management routes for CampusFix Pro (FastAPI)."""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models import (
    User,
    Category,
    Ticket,
    TicketHistory,
    TicketComment,
    TicketFeedback,
    Notification,
)
from schemas import (
    TicketCreate,
    TicketCommentCreate,
    TicketFeedbackCreate,
)
from security import get_current_user

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def generate_ticket_id(db: Session) -> str:
    """Generate next sequential human-readable Ticket ID (e.g. CF-1005)."""
    last_ticket = db.query(Ticket).order_by(desc(Ticket.id)).first()
    if not last_ticket or not last_ticket.ticket_id:
        return "CF-1001"
    try:
        num = int(last_ticket.ticket_id.split("-")[1])
        return f"CF-{num + 1}"
    except Exception:
        return f"CF-{last_ticket.id + 1000}"


# -------------------------------------------------------------
# CREATE TICKET
# -------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified maintenance category not found.",
        )

    location = payload.location.strip()
    description = payload.description.strip()
    if not location or not description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location and description are required.",
        )

    ticket_code = generate_ticket_id(db)

    ticket = Ticket(
        ticket_id=ticket_code,
        user_id=current_user.id,
        category_id=payload.category_id,
        location=location,
        priority=payload.priority or "Medium",
        description=description,
        image_path=payload.image_path,
        status="Submitted",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Record initial history
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by_user_id=current_user.id,
        old_status=None,
        new_status="Submitted",
        comments="Ticket created and queued for review.",
    )
    db.add(history)

    # Initial notification for user
    notif = Notification(
        user_id=current_user.id,
        ticket_id=ticket.id,
        title=f"Ticket #{ticket_code} Created",
        message=f"Your complaint regarding {location} ({category.name}) has been submitted successfully.",
        is_read=False,
    )
    db.add(notif)

    # Also notify administrators of this college only
    admins = (
        db.query(User)
        .filter(
            User.role == "admin",
            User.college_name == current_user.college_name,
        )
        .all()
    )
    for admin in admins:
        admin_notif = Notification(
            user_id=admin.id,
            ticket_id=ticket.id,
            title=f"New Complaint #{ticket_code}",
            message=f"{current_user.full_name} ({current_user.role.title()}) raised a ticket for {location}: '{description[:50]}...'",
            is_read=False,
        )
        db.add(admin_notif)

    db.commit()

    return {
        "status": "success",
        "message": f"Ticket #{ticket_code} created successfully!",
        "ticket": {
            "id": ticket.id,
            "ticket_id": ticket.ticket_id,
            "location": ticket.location,
            "priority": ticket.priority,
            "status": ticket.status,
            "category": category.name,
            "created_at": ticket.created_at.isoformat(),
        },
    }


# -------------------------------------------------------------
# MY TICKETS (Student & Faculty)
# -------------------------------------------------------------

@router.get("/my")
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(desc(Ticket.created_at))
        .all()
    )

    result = []
    for t in tickets:
        result.append(
            {
                "id": t.id,
                "ticket_id": t.ticket_id,
                "category_id": t.category_id,
                "category": t.category.name if t.category else "General",
                "location": t.location,
                "priority": t.priority,
                "description": t.description,
                "status": t.status,
                "image_path": t.image_path,
                "resolution_details": t.resolution_details,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
                "technician_name": t.technician.full_name if t.technician else None,
            }
        )

    return {
        "status": "success",
        "count": len(result),
        "tickets": result,
    }


def check_ticket_access(ticket: Ticket, current_user: User):
    """Enforce college-scoped multi-tenancy and role permissions for tickets."""
    creator_college = ticket.creator.college_name if ticket.creator else None
    user_college = current_user.college_name

    if current_user.role == "admin":
        if user_college and creator_college and user_college != creator_college:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Ticket belongs to another college.",
            )
    elif current_user.role == "technician":
        if ticket.technician_id != current_user.id:
            if not user_college or not creator_college or user_college != creator_college:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access Denied: You do not have permission to view this ticket.",
                )
    else:
        if ticket.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this ticket.",
            )


# -------------------------------------------------------------
# GET TICKET DETAILS
# -------------------------------------------------------------

@router.get("/{ticket_id}")
def get_ticket_details(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Lookup by ticket_id string (CF-1001) or integer primary key
    if ticket_id.isdigit():
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id)).first()
    else:
        ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found.",
        )

    # Permission check: Creator, Assigned Tech, or College Admin
    check_ticket_access(ticket, current_user)

    history_logs = [
        {
            "id": h.id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "comments": h.comments,
            "changed_by": h.changed_by.full_name if h.changed_by else "System",
            "created_at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in ticket.history
    ]

    comments_list = [
        {
            "id": c.id,
            "comment": c.comment,
            "is_internal": c.is_internal,
            "author_name": c.author.full_name if c.author else "User",
            "author_role": c.author.role if c.author else "user",
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in ticket.comments
        if not c.is_internal or current_user.role in ["admin", "technician"]
    ]

    feedback_data = None
    if ticket.feedback:
        feedback_data = {
            "rating": ticket.feedback.rating,
            "comments": ticket.feedback.comments,
            "created_at": ticket.feedback.created_at.isoformat(),
        }

    return {
        "status": "success",
        "ticket": {
            "id": ticket.id,
            "ticket_id": ticket.ticket_id,
            "user_id": ticket.user_id,
            "user_name": ticket.creator.full_name if ticket.creator else "Unknown",
            "user_email": ticket.creator.email if ticket.creator else "",
            "user_role": ticket.creator.role if ticket.creator else "",
            "user_phone": ticket.creator.phone if ticket.creator else "",
            "category_id": ticket.category_id,
            "category": ticket.category.name if ticket.category else "",
            "technician_id": ticket.technician_id,
            "technician_name": ticket.technician.full_name if ticket.technician else "Not Assigned",
            "technician_phone": ticket.technician.phone if ticket.technician else None,
            "location": ticket.location,
            "priority": ticket.priority,
            "description": ticket.description,
            "status": ticket.status,
            "image_path": ticket.image_path,
            "resolution_details": ticket.resolution_details,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
            "history": history_logs,
            "comments": comments_list,
            "feedback": feedback_data,
        },
    }


# -------------------------------------------------------------
# COMMENTS
# -------------------------------------------------------------

@router.get("/{ticket_id}/comments")
def get_ticket_comments(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id) if ticket_id.isdigit() else -1).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    check_ticket_access(ticket, current_user)

    comments = (
        db.query(TicketComment)
        .filter(TicketComment.ticket_id == ticket.id)
        .order_by(TicketComment.created_at)
        .all()
    )

    return {
        "status": "success",
        "comments": [
            {
                "id": c.id,
                "comment": c.comment,
                "author": c.author.full_name if c.author else "User",
                "role": c.author.role if c.author else "user",
                "created_at": c.created_at.isoformat(),
            }
            for c in comments
        ],
    }


@router.post("/{ticket_id}/comments")
def add_ticket_comment(
    ticket_id: str,
    payload: TicketCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id) if ticket_id.isdigit() else -1).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    check_ticket_access(ticket, current_user)

    comment = TicketComment(
        ticket_id=ticket.id,
        user_id=current_user.id,
        comment=payload.comment.strip(),
        is_internal=payload.is_internal,
    )
    db.add(comment)
    db.commit()

    return {"status": "success", "message": "Comment posted successfully."}


# -------------------------------------------------------------
# FEEDBACK / RATING
# -------------------------------------------------------------

@router.post("/{ticket_id}/feedback")
def submit_ticket_feedback(
    ticket_id: str,
    payload: TicketFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id) if ticket_id.isdigit() else -1).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only ticket creator can submit feedback.")

    existing = db.query(TicketFeedback).filter(TicketFeedback.ticket_id == ticket.id).first()
    if existing:
        existing.rating = payload.rating
        existing.comments = payload.comments
    else:
        fb = TicketFeedback(
            ticket_id=ticket.id,
            user_id=current_user.id,
            rating=payload.rating,
            comments=payload.comments,
        )
        db.add(fb)

    db.commit()
    return {"status": "success", "message": "Feedback submitted successfully. Thank you!"}