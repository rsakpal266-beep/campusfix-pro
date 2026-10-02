"""Technician routes for CampusFix Pro (FastAPI)."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models import (
    User,
    Ticket,
    TicketHistory,
    Notification,
    TechnicianAssignment,
)
from schemas import TicketStatusUpdateRequest
from security import get_current_user, require_roles

router = APIRouter(prefix="/api/technician", tags=["Technician"])


# -------------------------------------------------------------
# GET TECHNICIAN ASSIGNED TICKETS
# -------------------------------------------------------------

@router.get("/tickets")
def get_technician_tickets(
    current_user: User = Depends(require_roles(["technician"])),
    db: Session = Depends(get_db),
):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.technician_id == current_user.id)
        .order_by(desc(Ticket.created_at))
        .all()
    )

    result = []
    for t in tickets:
        result.append(
            {
                "id": t.id,
                "ticket_id": t.ticket_id,
                "user_id": t.user_id,
                "user_name": t.creator.full_name if t.creator else "Student/Faculty",
                "user_phone": t.creator.phone if t.creator else None,
                "user_email": t.creator.email if t.creator else None,
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
            }
        )

    return {
        "status": "success",
        "count": len(result),
        "tickets": result,
    }


# -------------------------------------------------------------
# GET TECHNICIAN TICKET DETAILS
# -------------------------------------------------------------

@router.get("/tickets/{ticket_id}")
def get_technician_ticket_details(
    ticket_id: str,
    current_user: User = Depends(require_roles(["technician"])),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket and ticket_id.isdigit():
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id)).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Assigned ticket not found.")

    if ticket.technician_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="This ticket is not assigned to you.",
        )

    return {
        "status": "success",
        "ticket": {
            "id": ticket.id,
            "ticket_id": ticket.ticket_id,
            "user_id": ticket.user_id,
            "user_name": ticket.creator.full_name if ticket.creator else "Student/Faculty",
            "user_phone": ticket.creator.phone if ticket.creator else None,
            "user_email": ticket.creator.email if ticket.creator else None,
            "category_id": ticket.category_id,
            "category": ticket.category.name if ticket.category else "General",
            "location": ticket.location,
            "priority": ticket.priority,
            "description": ticket.description,
            "status": ticket.status,
            "image_path": ticket.image_path,
            "resolution_details": ticket.resolution_details,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        },
    }


# -------------------------------------------------------------
# UPDATE TICKET STATUS / RESOLUTION
# -------------------------------------------------------------

@router.put("/tickets/{ticket_id}")
def update_technician_ticket(
    ticket_id: str,
    payload: TicketStatusUpdateRequest,
    current_user: User = Depends(require_roles(["technician"])),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket and ticket_id.isdigit():
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id)).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Assigned ticket not found.")

    if ticket.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="This ticket is not assigned to you.")

    new_status = payload.status.strip()
    if new_status not in ["Submitted", "Pending", "In Progress", "Resolved", "Closed"]:
        raise HTTPException(status_code=400, detail=f"Invalid status: '{new_status}'.")

    old_status = ticket.status
    ticket.status = new_status

    if payload.resolution_details is not None:
        ticket.resolution_details = payload.resolution_details.strip()

    if payload.estimated_cost is not None:
        ticket.estimated_cost = payload.estimated_cost

    if new_status == "Resolved":
        ticket.resolved_at = datetime.utcnow()

    # Log to History
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by_user_id=current_user.id,
        old_status=old_status,
        new_status=new_status,
        comments=payload.resolution_details or f"Technician changed status to {new_status}.",
    )
    db.add(history)

    # Notify ticket creator
    notif = Notification(
        user_id=ticket.user_id,
        ticket_id=ticket.id,
        title=f"Ticket #{ticket.ticket_id} {new_status}",
        message=(
            f"Technician {current_user.full_name} marked your ticket as {new_status}. "
            + (f"Resolution: {ticket.resolution_details}" if ticket.resolution_details else "")
        ),
        type="ticket",
    )
    db.add(notif)

    db.commit()

    return {
        "status": "success",
        "message": f"Ticket #{ticket.ticket_id} updated to {new_status}.",
        "ticket": {
            "id": ticket.id,
            "ticket_id": ticket.ticket_id,
            "status": ticket.status,
            "resolution_details": ticket.resolution_details,
        },
    }
