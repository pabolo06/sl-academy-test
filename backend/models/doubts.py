"""
SL Academy Platform - Doubt Management Models
Pydantic models for doubts and answers
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum
import re


def _strip_html(text: str) -> str:
    """Remove all HTML/script tags from text (replaces bleach.clean with tags=[])"""
    return re.sub(r"<[^>]+>", "", text)


class DoubtStatus(str, Enum):
    """Doubt status enum"""
    PENDING = "pending"
    ANSWERED = "answered"


class DoubtBase(BaseModel):
    """Base doubt model"""
    lesson_id: UUID
    text: str = Field(..., min_length=10, max_length=5000, description="Doubt text")
    image_url: Optional[str] = Field(None, description="Optional image URL")
    
    @validator("text")
    def sanitize_text(cls, v):
        """Remove HTML/script tags from text"""
        return _strip_html(v)


class DoubtCreate(DoubtBase):
    """Doubt creation request"""
    pass


class DoubtUpdate(BaseModel):
    """Doubt update request (for answering)"""
    answer: str = Field(..., min_length=10, max_length=5000, description="Answer text")
    
    @validator("answer")
    def sanitize_answer(cls, v):
        """Remove HTML/script tags from answer"""
        return _strip_html(v)


class Doubt(DoubtBase):
    """Doubt response model"""
    id: UUID
    profile_id: UUID
    status: DoubtStatus
    answer: Optional[str] = None
    answered_by: Optional[UUID] = None
    answered_at: Optional[datetime] = None
    ai_summary: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        extra = "ignore"
