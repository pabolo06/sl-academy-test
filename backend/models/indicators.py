"""
SL Academy Platform - Indicator Models
Pydantic models for hospital indicators and imports
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


class IndicatorBase(BaseModel):
    """Base indicator model"""
    name: str = Field(..., min_length=1, max_length=200, description="Indicator name")
    category: str = Field(..., min_length=1, max_length=100, description="Indicator category")
    value: float = Field(..., description="Indicator value")
    reference_date: date = Field(..., description="Reference date for the indicator")


class IndicatorCreate(IndicatorBase):
    """Indicator creation request"""
    pass


class Indicator(IndicatorBase):
    """Indicator response model"""
    id: UUID
    hospital_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
        extra = "ignore"


class IndicatorImportRow(BaseModel):
    """Single row in indicator import"""
    name: str
    category: str
    value: float
    reference_date: str  # Will be parsed to date
    unit: Optional[str] = None
    notes: Optional[str] = None


class IndicatorImportRequest(BaseModel):
    """Indicator import request"""
    indicators: List[IndicatorImportRow] = Field(..., max_items=10000)
    
    @validator("indicators")
    def validate_row_limit(cls, v):
        """Validate row limit"""
        if len(v) > 10000:
            raise ValueError("Maximum 10,000 rows allowed per import")
        return v


class IndicatorImportError(BaseModel):
    """Single error in indicator import"""
    row: int
    error: str
    data: Optional[dict] = None


class IndicatorImportResult(BaseModel):
    """Indicator import result"""
    success_count: int
    error_count: int
    errors: List[IndicatorImportError]
