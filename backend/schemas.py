"""Pydantic request and response schemas for CampusFix Pro."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# -------------------------------------------------------------
# AUTH & USER SCHEMAS
# -------------------------------------------------------------

class UserBase(BaseModel):
    full_name: str
    email: str
    role: str  # student, faculty, technician, admin
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    student_or_emp_id: Optional[str] = None
    college_name: Optional[str] = None


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "student"
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    student_or_emp_id: Optional[str] = None
    college_name: Optional[str] = None


class CollegeRegisterRequest(BaseModel):
    college_name: str
    admin_name: Optional[str] = None
    full_name: Optional[str] = None
    email: str
    password: str
    phone: Optional[str] = None
    campus_address: Optional[str] = None
    college_code: Optional[str] = None
    department: Optional[str] = "Administration"


class AdminResetUserPasswordRequest(BaseModel):
    new_password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    status: str = "success"
    message: str = "Login successful!"
    token: str
    user: Dict[str, Any]


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    student_or_emp_id: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# -------------------------------------------------------------
# CATEGORY SCHEMAS
# -------------------------------------------------------------

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "wrench"


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# LOCATION SCHEMAS
# -------------------------------------------------------------

class LocationResponse(BaseModel):
    id: int
    building_name: str
    block_code: Optional[str] = None
    floor: Optional[str] = None
    room_number: Optional[str] = None
    landmark: Optional[str] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# TICKET SCHEMAS
# -------------------------------------------------------------

class TicketCreate(BaseModel):
    category_id: int
    location: str
    priority: str = "Medium"  # Low, Medium, High, Critical
    description: str
    image_path: Optional[str] = None


class TicketAssignRequest(BaseModel):
    technician_id: int
    assignment_notes: Optional[str] = None


class TicketStatusUpdateRequest(BaseModel):
    status: str
    resolution_details: Optional[str] = None
    estimated_cost: Optional[float] = None


class TicketCommentCreate(BaseModel):
    comment: str
    is_internal: bool = False


class TicketFeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comments: Optional[str] = None


class TicketDetailResponse(BaseModel):
    id: int
    ticket_id: str
    user_id: int
    category_id: int
    technician_id: Optional[int] = None
    location: str
    priority: str
    description: str
    status: str
    image_path: Optional[str] = None
    resolution_details: Optional[str] = None
    estimated_cost: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    user_phone: Optional[str] = None
    technician_name: Optional[str] = None
    technician_phone: Optional[str] = None
    feedback_rating: Optional[int] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# NOTIFICATION SCHEMAS
# -------------------------------------------------------------

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    ticket_id: Optional[int] = None
    title: str
    message: str
    is_read: bool
    type: str
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# FIXBOT AI SCHEMAS
# -------------------------------------------------------------

class FixBotChatRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    api_key: Optional[str] = None  # User can optionally provide their own Gemini or OpenAI key


class FixBotChatResponse(BaseModel):
    status: str = "success"
    response: str
    intent: Optional[str] = None
    provider: str = "ai"
    suggestions: List[str] = []
