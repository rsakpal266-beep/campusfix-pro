"""Administrator and College Management routes for CampusFix Pro (FastAPI)."""

from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db
from models import (
    User,
    Category,
    Ticket,
    TicketHistory,
    Notification,
    TechnicianAssignment,
    TicketFeedback,
)
from schemas import (
    UserCreate,
    TicketAssignRequest,
    CategoryCreate,
    AdminResetUserPasswordRequest,
)
from security import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# -------------------------------------------------------------
# ADMIN DASHBOARD (Strictly Scoped to Admin's College)
# -------------------------------------------------------------

@router.get("/dashboard")
def get_admin_dashboard(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    college = current_user.college_name

    # Scoped ticket query for this college only
    ticket_query = (
        db.query(Ticket)
        .join(User, Ticket.user_id == User.id)
        .filter(User.college_name == college)
    )

    total_tickets = ticket_query.count()
    pending_tickets = (
        ticket_query
        .filter(Ticket.status.in_(["Submitted", "Pending"]))
        .count()
    )
    in_progress_tickets = (
        ticket_query
        .filter(Ticket.status == "In Progress")
        .count()
    )
    resolved_tickets = (
        ticket_query
        .filter(Ticket.status == "Resolved")
        .count()
    )

    total_users = db.query(User).filter(User.college_name == college, User.is_active == True).count()
    total_technicians = (
        db.query(User)
        .filter(User.college_name == college, User.role == "technician", User.is_active == True)
        .count()
    )
    total_faculty = (
        db.query(User)
        .filter(User.college_name == college, User.role == "faculty", User.is_active == True)
        .count()
    )
    total_students = (
        db.query(User)
        .filter(User.college_name == college, User.role == "student", User.is_active == True)
        .count()
    )

    # 5 Most Recent Tickets for this college
    recent_db_tickets = (
        ticket_query
        .order_by(desc(Ticket.created_at))
        .limit(6)
        .all()
    )

    recent_tickets = []
    for t in recent_db_tickets:
        recent_tickets.append(
            {
                "id": t.id,
                "ticket_id": t.ticket_id,
                "location": t.location,
                "priority": t.priority,
                "status": t.status,
                "category": t.category.name if t.category else "General",
                "user_name": t.creator.full_name if t.creator else "Unknown",
                "technician_name": t.technician.full_name if t.technician else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
        )

    # Category distribution for tickets of this college
    all_cats = db.query(Category).all()
    category_distribution = []
    for c in all_cats:
        cnt = (
            db.query(Ticket)
            .join(User, Ticket.user_id == User.id)
            .filter(Ticket.category_id == c.id, User.college_name == college)
            .count()
        )
        category_distribution.append({"name": c.name, "count": cnt})

    return {
        "status": "success",
        "statistics": {
            "total_tickets": total_tickets,
            "pending": pending_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "total_users": total_users,
            "total_technicians": total_technicians,
            "total_faculty": total_faculty,
            "total_students": total_students,
        },
        "recent_tickets": recent_tickets,
        "category_distribution": category_distribution,
    }


# -------------------------------------------------------------
# ADMIN TICKETS LIST (Strictly Scoped to Admin's College)
# -------------------------------------------------------------

@router.get("/tickets")
def get_all_tickets_admin(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    college = current_user.college_name
    tickets = (
        db.query(Ticket)
        .join(User, Ticket.user_id == User.id)
        .filter(User.college_name == college)
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
                "user_name": t.creator.full_name if t.creator else "Unknown",
                "user_email": t.creator.email if t.creator else "",
                "user_role": t.creator.role if t.creator else "student",
                "category_id": t.category_id,
                "category": t.category.name if t.category else "General",
                "technician_id": t.technician_id,
                "technician_name": t.technician.full_name if t.technician else "Not Assigned",
                "location": t.location,
                "priority": t.priority,
                "description": t.description,
                "status": t.status,
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
# ADMIN TECHNICIANS LIST (Strictly Scoped to Admin's College)
# -------------------------------------------------------------

@router.get("/technicians")
def get_technicians_admin(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    college = current_user.college_name
    techs = (
        db.query(User)
        .filter(
            User.role == "technician",
            User.is_active == True,
            User.college_name == college,
        )
        .order_by(User.full_name)
        .all()
    )

    result = []
    for tech in techs:
        assigned_count = (
            db.query(Ticket)
            .filter(Ticket.technician_id == tech.id, Ticket.status != "Resolved")
            .count()
        )
        resolved_count = (
            db.query(Ticket)
            .filter(Ticket.technician_id == tech.id, Ticket.status == "Resolved")
            .count()
        )
        result.append(
            {
                "id": tech.id,
                "full_name": tech.full_name,
                "email": tech.email,
                "phone": tech.phone,
                "department": tech.department,
                "specialization": tech.specialization or "General Maintenance",
                "assigned_count": assigned_count,
                "resolved_count": resolved_count,
            }
        )

    return {
        "status": "success",
        "technicians": result,
    }


# -------------------------------------------------------------
# ASSIGN TECHNICIAN TO TICKET (With College Isolation)
# -------------------------------------------------------------

@router.put("/tickets/{ticket_id}/assign")
def assign_technician(
    ticket_id: str,
    payload: TicketAssignRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    college = current_user.college_name

    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket and ticket_id.isdigit():
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id)).first()

    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found.")

    # Isolation Check: Ticket creator must belong to this admin's college
    if ticket.creator and ticket.creator.college_name != college:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Ticket belongs to another college.",
        )

    # Isolation Check: Technician must belong to this admin's college
    technician = (
        db.query(User)
        .filter(
            User.id == payload.technician_id,
            User.role == "technician",
            User.college_name == college,
        )
        .first()
    )
    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found in your college or user is not an active technician.",
        )

    old_status = ticket.status
    ticket.technician_id = technician.id
    if ticket.status == "Submitted":
        ticket.status = "In Progress"

    # Log assignment record
    assign_log = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=technician.id,
        assigned_by_id=current_user.id,
        assignment_notes=payload.assignment_notes or f"Assigned to {technician.full_name}",
        status=ticket.status,
    )
    db.add(assign_log)

    # History audit
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by_user_id=current_user.id,
        old_status=old_status,
        new_status=ticket.status,
        comments=f"Assigned to technician {technician.full_name}. Notes: {payload.assignment_notes or 'None'}",
    )
    db.add(history)

    # Notify technician
    tech_notif = Notification(
        user_id=technician.id,
        ticket_id=ticket.id,
        title=f"New Task Assigned: #{ticket.ticket_id}",
        message=f"Administrator assigned you ticket #{ticket.ticket_id} ({ticket.location}) - Priority: {ticket.priority}.",
        type="assignment",
    )
    db.add(tech_notif)

    # Notify ticket creator
    creator_notif = Notification(
        user_id=ticket.user_id,
        ticket_id=ticket.id,
        title=f"Technician Assigned to #{ticket.ticket_id}",
        message=f"{technician.full_name} ({technician.phone or 'Tech'}) has been assigned to your ticket.",
        type="ticket",
    )
    db.add(creator_notif)

    db.commit()

    return {
        "status": "success",
        "message": f"Technician {technician.full_name} assigned to ticket #{ticket.ticket_id}.",
    }


# -------------------------------------------------------------
# MANAGE USERS (Strictly Scoped to Admin's College)
# -------------------------------------------------------------

@router.get("/users")
def get_all_users(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    college = current_user.college_name

    # Return ONLY users belonging to this admin's college
    users = (
        db.query(User)
        .filter(User.college_name == college)
        .order_by(desc(User.created_at))
        .all()
    )
    result = []
    for u in users:
        result.append(
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "college_name": u.college_name or college or "Campus",
                "department": u.department,
                "specialization": u.specialization,
                "phone": u.phone,
                "student_or_emp_id": u.student_or_emp_id,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
        )

    return {
        "status": "success",
        "count": len(result),
        "users": result,
    }


@router.post("/users", status_code=status.HTTP_201_CREATED)
def admin_create_user(
    payload: UserCreate,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """
    College Admin creates an account for student, faculty, technician within their college.
    Returns the created user and credentials to easily share with them.
    """
    email = payload.email.strip().lower()
    full_name = payload.full_name.strip()
    role = payload.role.strip().lower()
    raw_password = payload.password.strip()

    if not full_name or not email or not raw_password or not role:
        raise HTTPException(
            status_code=400,
            detail="Full Name, Email, Password, and Role are required.",
        )

    if role not in ["student", "faculty", "technician", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be one of: student, faculty, technician, admin.",
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An account with email '{email}' already exists.",
        )

    target_college = current_user.college_name or "Campus"

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(raw_password),
        role=role,
        department=payload.department,
        specialization=payload.specialization,
        phone=payload.phone,
        student_or_emp_id=payload.student_or_emp_id,
        college_name=target_college,
        created_by_id=current_user.id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return structured credentials for Admin to copy/share directly
    return {
        "status": "success",
        "message": f"{role.capitalize()} account created successfully for {new_user.full_name}!",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "college_name": new_user.college_name,
            "department": new_user.department,
            "specialization": new_user.specialization,
            "phone": new_user.phone,
            "student_or_emp_id": new_user.student_or_emp_id,
            "created_at": new_user.created_at.isoformat(),
        },
        "credentials": {
            "full_name": new_user.full_name,
            "email": new_user.email,
            "password": raw_password,
            "role": new_user.role,
            "college_name": target_college,
            "department": new_user.department or "Campus",
            "share_message": (
                f"🏛️ {target_college} — CampusFix Pro Account Details:\n"
                f"Role: {new_user.role.title()}\n"
                f"Name: {new_user.full_name}\n"
                f"Email: {new_user.email}\n"
                f"Password: {raw_password}\n"
                f"Portal Login: http://localhost:3000/login"
            ),
        },
    }


@router.put("/users/{user_id}/reset-password")
def admin_reset_user_password(
    user_id: int,
    payload: AdminResetUserPasswordRequest,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """College Admin resets the password for any student, faculty, or technician within their own college."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Isolation Check: cannot modify user of another college
    if target_user.college_name != current_user.college_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot modify users from another college.",
        )

    # Primary Admin Protection: Cannot reset another administrator
    if target_user.role == "admin" and target_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot reset the password of another college administrator.",
        )

    raw_password = payload.new_password.strip()
    if not raw_password or len(raw_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    target_user.password_hash = hash_password(raw_password)
    db.commit()

    college = target_user.college_name or current_user.college_name or "Campus"

    return {
        "status": "success",
        "message": f"Password for {target_user.full_name} has been updated.",
        "credentials": {
            "full_name": target_user.full_name,
            "email": target_user.email,
            "password": raw_password,
            "role": target_user.role,
            "college_name": college,
            "share_message": (
                f"🔑 Updated CampusFix Pro Login Credentials:\n"
                f"Institution: {college}\n"
                f"Role: {target_user.role.title()}\n"
                f"Name: {target_user.full_name}\n"
                f"Email: {target_user.email}\n"
                f"New Password: {raw_password}\n"
                f"Portal Login: http://localhost:3000/login"
            ),
        },
    }


@router.put("/users/{user_id}/toggle-status")
def admin_toggle_user_status(
    user_id: int,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """Toggle user active / inactive status within the admin's college."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own active session.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Isolation Check
    if target_user.college_name != current_user.college_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot modify users from another college.",
        )

    if target_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Cannot deactivate administrator accounts.",
        )

    target_user.is_active = not target_user.is_active
    db.commit()
    status_label = "activated" if target_user.is_active else "deactivated"

    return {
        "status": "success",
        "message": f"Account for {target_user.full_name} has been {status_label}.",
        "is_active": target_user.is_active,
    }


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """Delete a user account within the admin's college."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Isolation Check
    if target_user.college_name != current_user.college_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot delete users from another college.",
        )

    if target_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Cannot delete college administrator accounts.",
        )

    # Clean up dependent records safely
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
    user_tickets = db.query(Ticket).filter(Ticket.user_id == user_id).all()
    for t in user_tickets:
        db.query(Notification).filter(Notification.ticket_id == t.id).delete(synchronize_session=False)
        db.delete(t)

    db.query(Ticket).filter(Ticket.technician_id == user_id).update({Ticket.technician_id: None})
    db.delete(target_user)
    db.commit()

    return {
        "status": "success",
        "message": f"User account '{target_user.full_name}' deleted successfully.",
    }


# -------------------------------------------------------------
# CATEGORIES CRUD
# -------------------------------------------------------------

@router.get("/categories")
def get_all_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.id).all()
    result = []
    for c in cats:
        ticket_count = db.query(Ticket).filter(Ticket.category_id == c.id).count()
        result.append(
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "icon": c.icon,
                "is_active": c.is_active,
                "ticket_count": ticket_count,
            }
        )
    return {"status": "success", "categories": result}


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def add_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required.")

    existing = db.query(Category).filter(Category.name.ilike(name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="A category with this name already exists.")

    cat = Category(
        name=name,
        description=payload.description,
        icon=payload.icon or "wrench",
        is_active=True,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    return {
        "status": "success",
        "message": f"Category '{name}' created successfully.",
        "category": {"id": cat.id, "name": cat.name, "description": cat.description},
    }


@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    payload: CategoryCreate,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    cat.name = payload.name.strip()
    cat.description = payload.description
    if payload.icon:
        cat.icon = payload.icon
    db.commit()

    return {"status": "success", "message": f"Category #{category_id} updated."}


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    linked_tickets = db.query(Ticket).filter(Ticket.category_id == category_id).count()
    if linked_tickets > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category: {linked_tickets} ticket(s) are associated with it.",
        )

    db.delete(cat)
    db.commit()
    return {"status": "success", "message": "Category deleted successfully."}


# -------------------------------------------------------------
# DYNAMIC REPORTS & ANALYTICS (REAL DATABASE DATA)
# -------------------------------------------------------------

@router.get("/reports")
def get_admin_reports(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """Real dynamic reports generated for the admin's specific college."""
    college = current_user.college_name

    # Category Breakdown for this college
    cats = db.query(Category).all()
    category_data = []
    for c in cats:
        cnt = (
            db.query(Ticket)
            .join(User, Ticket.user_id == User.id)
            .filter(Ticket.category_id == c.id, User.college_name == college)
            .count()
        )
        category_data.append({"name": c.name, "tickets": cnt})

    # Technician Performance for this college
    techs = (
        db.query(User)
        .filter(User.role == "technician", User.college_name == college)
        .all()
    )
    technician_data = []
    for t in techs:
        assigned = db.query(Ticket).filter(Ticket.technician_id == t.id).count()
        resolved = (
            db.query(Ticket)
            .filter(Ticket.technician_id == t.id, Ticket.status == "Resolved")
            .count()
        )
        pending = assigned - resolved
        technician_data.append(
            {
                "name": t.full_name,
                "assigned": assigned,
                "resolved": resolved,
                "pending": pending if pending >= 0 else 0,
            }
        )

    # Priority counts for this college
    priority_data = {
        "High": (
            db.query(Ticket)
            .join(User, Ticket.user_id == User.id)
            .filter(User.college_name == college, Ticket.priority.in_(["High", "Critical"]))
            .count()
        ),
        "Medium": (
            db.query(Ticket)
            .join(User, Ticket.user_id == User.id)
            .filter(User.college_name == college, Ticket.priority == "Medium")
            .count()
        ),
        "Low": (
            db.query(Ticket)
            .join(User, Ticket.user_id == User.id)
            .filter(User.college_name == college, Ticket.priority == "Low")
            .count()
        ),
    }

    # Average Feedback Rating for this college
    avg_rating = (
        db.query(func.avg(TicketFeedback.rating))
        .join(Ticket, Ticket.id == TicketFeedback.ticket_id)
        .join(User, Ticket.user_id == User.id)
        .filter(User.college_name == college)
        .scalar()
    ) or 5.0

    # Recent activity for this college
    recent_tickets = (
        db.query(Ticket)
        .join(User, Ticket.user_id == User.id)
        .filter(User.college_name == college)
        .order_by(desc(Ticket.created_at))
        .limit(6)
        .all()
    )
    recent_activity = [
        {
            "ticket": t.ticket_id,
            "issue": t.description[:35] + ("..." if len(t.description) > 35 else ""),
            "status": t.status,
            "date": t.created_at.strftime("%d %b %Y") if t.created_at else "-",
        }
        for t in recent_tickets
    ]

    return {
        "status": "success",
        "category_data": category_data,
        "technician_data": technician_data,
        "priority_data": priority_data,
        "average_rating": round(float(avg_rating), 1),
        "recent_activity": recent_activity,
    }
