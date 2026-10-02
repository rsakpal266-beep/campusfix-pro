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
    UserCreate,
    CollegeRegisterRequest,
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
# REGISTER (Only for Colleges / Institutional Accounts)
# -------------------------------------------------------------

@router.post("/register", status_code=status.HTTP_201_CREATED)
@router.post("/college/register", status_code=status.HTTP_201_CREATED)
def register_college(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Register a College / Institution account.
    Students, Faculty, and Technicians cannot self-register;
    they are onboarded by their College Admin with an email & password.
    """
    raw_role = str(payload.get("role", "")).strip().lower()

    # Block students, faculty, and technicians from self-registration
    if raw_role in ["student", "faculty", "technician"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Self-registration is not allowed for {raw_role.capitalize()} accounts. "
                "Your College Administrator must add your account from their dashboard and "
                "provide you with your login email and password."
            ),
        )

    # College Registration Details
    college_name = str(payload.get("college_name") or "").strip()
    admin_name = str(payload.get("admin_name") or payload.get("full_name") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    raw_password = str(payload.get("password") or "").strip()
    phone = str(payload.get("phone") or "").strip()
    campus_address = str(payload.get("campus_address") or payload.get("department") or "").strip()
    college_code = str(payload.get("college_code") or payload.get("student_or_emp_id") or "").strip()

    if not college_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College / Institution Name is required.",
        )

    if not admin_name:
        admin_name = f"{college_name} Administrator"

    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid official college email address is required.",
        )

    if not raw_password or len(raw_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{email}' already exists. Please sign in instead.",
        )

    new_college_admin = User(
        full_name=admin_name,
        email=email,
        password_hash=hash_password(raw_password),
        role="admin",
        department=campus_address or "College Administration",
        college_name=college_name,
        student_or_emp_id=college_code or None,
        phone=phone or None,
        is_active=True,
    )
    db.add(new_college_admin)
    db.commit()
    db.refresh(new_college_admin)

    # Generate JWT Token so the college admin is ready to access dashboard
    token = create_access_token(
        {
            "user_id": new_college_admin.id,
            "email": new_college_admin.email,
            "role": new_college_admin.role,
            "full_name": new_college_admin.full_name,
            "college_name": new_college_admin.college_name,
        }
    )

    return {
        "status": "success",
        "message": f"College '{college_name}' registered successfully! You can now log in and onboard students, faculty, and technicians.",
        "token": token,
        "user": {
            "id": new_college_admin.id,
            "full_name": new_college_admin.full_name,
            "email": new_college_admin.email,
            "role": new_college_admin.role,
            "college_name": new_college_admin.college_name,
            "department": new_college_admin.department,
            "phone": new_college_admin.phone,
        },
    }


# -------------------------------------------------------------
# LOGIN (For College Admin, Technicians, Students, & Faculty)
# -------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint for all roles:
    - College Administrator (registered with their college)
    - Technicians (created by their college)
    - Faculty (created by their college)
    - Students (created by their college)
    """
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. If you are a Student, Faculty, or Technician, make sure your College Admin has created your account.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your College Administration.",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please check your credentials or ask your College Admin to reset your password.",
        )

    # Generate JWT Token
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
# PROFILE (GET & PUT)
# -------------------------------------------------------------

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
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
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
    }


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
        },
    }


# -------------------------------------------------------------
# FORGOT & RESET PASSWORD
# -------------------------------------------------------------

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # 15-minute reset token
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


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    new_password = payload.new_password.strip()
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 6 characters.",
        )

    try:
        data = jwt.decode(payload.reset_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
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
        "message": "Password reset successfully. You can now login with your new password.",
    }


# -------------------------------------------------------------
# CHANGE PASSWORD (FOR LOGGED IN USERS)
# -------------------------------------------------------------

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
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
