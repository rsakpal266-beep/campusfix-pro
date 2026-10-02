"""Security, password hashing, JWT authentication and role-based access control."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS
from database import get_db
from models import User

security = HTTPBearer(auto_error=False)


# -------------------------------------------------------------
# PASSWORD HASHING & VERIFICATION
# -------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash password securely with bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash or fallback werkzeug scrypt/pbkdf2 hash."""
    if not plain_password or not hashed_password:
        return False

    # Check bcrypt hash ($2b$ or $2a$)
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

    # Backwards compatibility check for werkzeug/scrypt/pbkdf2 hashes if previously seeded
    try:
        from werkzeug.security import check_password_hash as wz_check
        return wz_check(hashed_password, plain_password)
    except ImportError:
        pass

    # Simple plain check fallback for dev only if not hashed
    return plain_password == hashed_password


# -------------------------------------------------------------
# JWT TOKEN GENERATION & DECODING
# -------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please login again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token.",
        )


# -------------------------------------------------------------
# FASTAPI AUTH DEPENDENCIES
# -------------------------------------------------------------

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that extracts and validates the currently logged-in user."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is required.",
        )

    token = auth.credentials
    payload = decode_token(token)

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token payload.",
        )

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found or has been disabled.",
        )

    return user


def require_roles(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}.",
            )
        return current_user
    return role_checker
