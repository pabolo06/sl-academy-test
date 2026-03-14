"""
SL Academy Platform - Test and Assessment Models
Pydantic models for questions, test attempts, and scoring
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class QuestionType(str, Enum):
    """Question type enum"""
    PRE = "pre"
    POST = "post"


class QuestionBase(BaseModel):
    """Base question model"""
    lesson_id: UUID
    type: QuestionType
    question_text: str = Field(..., min_length=1, max_length=1000)
    options: List[str] = Field(..., min_items=2, max_items=6)
    correct_option_index: int = Field(..., ge=0)
    
    @validator("correct_option_index")
    def validate_correct_option(cls, v, values):
        """Validate correct option index is within options range"""
        if "options" in values and v >= len(values["options"]):
            raise ValueError("correct_option_index must be within options range")
        return v


class QuestionCreate(QuestionBase):
    """Question creation request"""
    pass


class Question(QuestionBase):
    """Question response model (includes correct answer - admin only)"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class QuestionPublic(BaseModel):
    """Public question model (excludes correct answer)"""
    id: UUID
    lesson_id: UUID
    type: QuestionType
    question_text: str
    options: List[str]
    
    class Config:
        from_attributes = True


class TestAttemptAnswer(BaseModel):
    """Single answer in test attempt"""
    question_id: UUID
    selected_option_index: int = Field(..., ge=0)


class TestAttemptCreate(BaseModel):
    """Test attempt creation request"""
    lesson_id: UUID
    type: QuestionType
    answers: List[TestAttemptAnswer] = Field(..., min_items=1)
    
    @validator("answers")
    def validate_unique_questions(cls, v):
        """Validate no duplicate question IDs"""
        question_ids = [answer.question_id for answer in v]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("Duplicate question IDs in answers")
        return v


class TestAttemptResponse(BaseModel):
    """Test attempt response"""
    id: UUID
    profile_id: UUID
    lesson_id: UUID
    type: QuestionType
    score: float
    answers: Dict[str, int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TestScore(BaseModel):
    """Test score calculation result"""
    score: float = Field(..., ge=0, le=100)
    correct_count: int = Field(..., ge=0)
    total_count: int = Field(..., gt=0)
    passed: bool


class ImprovementScore(BaseModel):
    """Pre-test to post-test improvement"""
    pre_test_score: float
    post_test_score: float
    improvement: float
    improvement_percentage: float
