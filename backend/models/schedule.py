"""
SL Academy Platform - Schedule Models
Pydantic models for on-call doctor schedules
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID


class ScheduleSlotBase(BaseModel):
    """Base schedule slot"""
    doctor_id: UUID = Field(..., description="Doctor UUID")
    slot_date: date = Field(..., description="Date of the shift")
    shift: str = Field(..., description="Shift: 'morning' | 'afternoon' | 'night'")
    notes: Optional[str] = Field(None, description="Optional notes for the shift")


class ScheduleSlotCreate(ScheduleSlotBase):
    """Create schedule slot"""
    pass


class ScheduleSlotResponse(ScheduleSlotBase):
    """Schedule slot response"""
    id: UUID
    schedule_id: UUID
    doctor_email: str = Field(..., description="Doctor email from join")
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduleBase(BaseModel):
    """Base schedule"""
    week_start: date = Field(..., description="Start of week (Monday)")


class ScheduleCreate(ScheduleBase):
    """Create schedule"""
    pass


class ScheduleResponse(ScheduleBase):
    """Schedule with slots"""
    id: UUID
    hospital_id: UUID
    status: str = Field(default="draft", description="'draft' | 'published'")
    required_track_id: Optional[UUID] = Field(
        None,
        description="Track UUID whose certification is required for all slots in this schedule.",
    )
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    slots: List[ScheduleSlotResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class SchedulePublish(BaseModel):
    """Request to publish schedule"""
    status: str = Field(..., description="Should be 'published'")
