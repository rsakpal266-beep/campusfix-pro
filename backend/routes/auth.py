"""Authentication routes for CampusFix Pro (FastAPI)."""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config import JWT_SECRET_KEY, JWT_ALGORITHM
from database import get_db
from models import User
from schemas import (
    LoginRequest,
    LoginResponse,
    ProfileUpdateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from security import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api", tags=["Auth"])


# -------------------------------------------------------------
# REGISTER: College Admin, Students, and Faculty
# -------------------------------------------------------------

@router.post("/register", status_code=status.HTTP_201_CREATED)
@router.post("/college/register", status_code=status.HTTP_201_CREATED)
def register_college(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """Register a College Admin, Student, or Faculty member."""

    raw_role = str(payload.get("role") or "admin").strip().lower()

    if raw_role == "technician":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technician accounts can only be created by a College Admin.",
        )

    if raw_role not in ("admin", "student", "faculty"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Choose Student, Faculty, or College Admin.",
        )

    email = str(payload.get("email") or "").strip().lower()
    raw_password = str(payload.get("password") or "")
    phone = str(payload.get("phone") or "").strip()
    college_name = str(payload.get("college_name") or "").strip()

    full_name = str(
        payload.get("admin_name")
        or payload.get("full_name")
        or ""
    ).strip()

    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required.",
        )

    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address.",
        )

    if len(raw_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    if raw_role == "admin" and not college_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College / Institution Name is required.",
        )

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    if raw_role == "admin":
        department = str(
            payload.get("campus_address")
            or payload.get("department")
            or "College Administration"
        ).strip()

        student_or_emp_id = str(
            payload.get("college_code")
            or payload.get("student_or_emp_id")
            or ""
        ).strip() or None
    else:
        department = str(
            payload.get("department") or ""
        ).strip() or None

        student_or_emp_id = str(
            payload.get("student_or_emp_id") or ""
        ).strip() or None

    # College Admin is active immediately.
    # Student and Faculty accounts require approval.
    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(raw_password),
        role=raw_role,
        department=department,
        college_name=college_name or None,
        student_or_emp_id=student_or_emp_id,
        phone=phone or None,
        is_active=(raw_role == "admin"),
        approval_status=(
            "approved" if raw_role == "admin" else "pending"
        ),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Preserve automatic login for College Admin registration.
    if raw_role == "admin":
        token = create_access_token(
            {
                "user_id": new_user.id,
                "email": new_user.email,
                "role": new_user.role,
                "full_name": new_user.full_name,
                "college_name": new_user.college_name,
            }
        )

        return {
            "status": "success",
            "message": (
                f"College '{college_name}' registered successfully!"
            ),
            "token": token,
            "user": {
                "id": new_user.id,
                "full_name": new_user.full_name,
                "email": new_user.email,
                "role": new_user.role,
                "college_name": new_user.college_name,
                "department": new_user.department,
                "phone": new_user.phone,
            },
        }

    return {
        "status": "success",
        "message": (
            f"{raw_role.capitalize()} registration submitted successfully. "
            "Your account is pending College Admin approval. "
            "You can log in after approval."
        ),
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "college_name": new_user.college_name or "Campus",
            "department": new_user.department,
            "phone": new_user.phone,
            "student_or_emp_id": new_user.student_or_emp_id,
            "approval_status": new_user.approval_status,
        },
    }


# -------------------------------------------------------------
# LOGIN: All existing account roles
# -------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
@router.post("/auth/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate an existing account."""

    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Require approval for Student and Faculty accounts.
    if user.role in ("student", "faculty"):
        approval = (
            getattr(user, "approval_status", None) or "pending"
        ).lower()

        if approval == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your account is pending College Admin approval."
                ),
            )

        if approval != "approved":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your registration was rejected. "
                    "Please contact your College Admin."
                ),
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Your account is inactive. "
                "Please contact your College Administration."
            ),
        )

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "college_name": user.college_name,
        }
    )

    return {
        "status": "success",
        "message": f"Welcome back, {user.full_name}!",
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "college_name": user.college_name or "Campus",
            "department": user.department,
            "phone": user.phone,
            "specialization": user.specialization,
            "student_or_emp_id": user.student_or_emp_id,
        },
    }


# -------------------------------------------------------------
# PROFILE: GET
# -------------------------------------------------------------

@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "status": "success",
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "department": current_user.department,
            "specialization": current_user.specialization,
            "phone": current_user.phone,
            "student_or_emp_id": current_user.student_or_emp_id,
            "college_name": current_user.college_name or "Campus",
            "created_at": (
                current_user.created_at.isoformat()
                if current_user.created_at
                else None
            ),
        },
    }


# -------------------------------------------------------------
# PROFILE: UPDATE
# -------------------------------------------------------------

@router.put("/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()

    if payload.phone is not None:
        current_user.phone = payload.phone.strip()

    if payload.department is not None:
        current_user.department = payload.department.strip()

    if payload.specialization is not None:
        current_user.specialization = payload.specialization.strip()

    if payload.student_or_emp_id is not None:
        current_user.student_or_emp_id = (
            payload.student_or_emp_id.strip()
        )

    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "department": current_user.department,
            "specialization": current_user.specialization,
            "phone": current_user.phone,
            "student_or_emp_id": current_user.student_or_emp_id,
            "college_name": current_user.college_name or "Campus",
        },
    }


# -------------------------------------------------------------
# FORGOT PASSWORD
# -------------------------------------------------------------

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    reset_token = jwt.encode(
        {
            "user_id": user.id,
            "email": user.email,
            "purpose": "password_reset",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    return {
        "status": "success",
        "message": "Password reset token generated successfully.",
        "reset_token": reset_token,
    }


# -------------------------------------------------------------
# RESET PASSWORD
# -------------------------------------------------------------

@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    new_password = payload.new_password.strip()

    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 6 characters.",
        )

    try:
        data = jwt.decode(
            payload.reset_token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        if data.get("purpose") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token.",
            )

        user_id = data.get("user_id")

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired.",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token.",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    user.password_hash = hash_password(new_password)
    db.commit()

    return {
        "status": "success",
        "message": "Password reset successfully. You can now log in.",
    }


# -------------------------------------------------------------
# CHANGE PASSWORD
# -------------------------------------------------------------

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must contain at least 6 characters.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {
        "status": "success",
        "message": "Password changed successfully.",
    }
