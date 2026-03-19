"""
SL Academy Platform - Track and Lesson Models
Pydantic models for tracks and lessons
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TrackBase(BaseModel):
    """Base track model"""
    title: str = Field(..., min_length=1, max_length=200, description="Track title")
    description: Optional[str] = Field(None, max_length=2000, description="Track description")


class TrackCreate(TrackBase):
    """Track creation request"""
    pass


class TrackUpdate(BaseModel):
    """Track update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)


class Track(TrackBase):
    """Track response model"""
    id: UUID
    hospital_id: UUID
    created_at: datetime
    deleted_at: Optional[datetime] = None
    lesson_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
        extra = "ignore"


class LessonBase(BaseModel):
    """Base lesson model"""
    title: str = Field(..., min_length=1, max_length=200, description="Lesson title")
    description: Optional[str] = Field(None, max_length=2000, description="Lesson description")
    video_url: str = Field(..., description="Video URL")
    duration_seconds: int = Field(..., gt=0, description="Video duration in seconds")
    position: int = Field(..., ge=0, description="Lesson position within track")
    
    @validator("duration_seconds")
    def validate_duration(cls, v):
        """Validate duration is positive"""
        if v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v
    
    @validator("position")
    def validate_position(cls, v):
        """Validate position is non-negative"""
        if v < 0:
            raise ValueError("Position must be greater than or equal to 0")
        return v


class LessonCreate(LessonBase):
    """Lesson creation request"""
    track_id: UUID = Field(..., description="Track ID")


class LessonUpdate(BaseModel):
    """Lesson update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    video_url: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, gt=0)
    position: Optional[int] = Field(None, ge=0)
    
    @validator("duration_seconds")
    def validate_duration(cls, v):
        """Validate duration is positive"""
        if v is not None and v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v
    
    @validator("position")
    def validate_position(cls, v):
        """Validate position is non-negative"""
        if v is not None and v < 0:
            raise ValueError("Position must be greater than or equal to 0")
        return v


class Lesson(LessonBase):
    """Lesson response model"""
    id: UUID
    track_id: UUID
    created_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        extra = "ignore"


class LessonDetail(Lesson):
    """Detailed lesson response with track info"""
    track: Optional[Track] = None
    pre_test_questions_count: Optional[int] = 0
    post_test_questions_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
        extra = "ignore"


class TrackWithLessons(Track):
    """Track with lessons list"""
    lessons: List[Lesson] = []
    
    class Config:
        from_attributes = True
        extra = "ignore"
