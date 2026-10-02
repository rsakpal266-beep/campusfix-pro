"""Notification routes for CampusFix Pro (FastAPI)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models import Notification, User
from security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .all()
    )

    result = [
        {
            "id": n.id,
            "user_id": n.user_id,
            "ticket_id": n.ticket_id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "type": n.type,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]

    unread_count = sum(1 for n in notifs if not n.is_read)

    return {
        "status": "success",
        "unread_count": unread_count,
        "notifications": result,
    }


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.is_read = True
    db.commit()

    return {"status": "success", "message": "Notification marked as read."}


@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {"status": "success", "message": "All notifications marked as read."}
