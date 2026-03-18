"""
SL Academy Platform - Authentication Models
Pydantic models for authentication requests and responses
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Login request payload"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    accept_terms: bool = Field(..., description="User consent to terms and privacy policy")


class LoginResponse(BaseModel):
    """Login response payload"""
    success: bool
    message: str
    user: Optional[dict] = None
    redirect_url: Optional[str] = None


class SessionData(BaseModel):
    """Session data stored in encrypted cookie"""
    user_id: str
    email: str
    hospital_id: str
    role: str
    created_at: datetime
    last_activity: datetime


class LogoutResponse(BaseModel):
    """Logout response payload"""
    success: bool
    message: str


class UserDataExport(BaseModel):
    """User data export for GDPR compliance"""
    profile: dict
    test_attempts: list[dict]
    doubts: list[dict]
    video_history: list[dict]
    export_date: datetime
