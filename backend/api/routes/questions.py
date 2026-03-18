"""
SL Academy Platform - Question Management Routes
Handles question retrieval with security (excludes correct answers)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from uuid import UUID
from models.tests import QuestionPublic, QuestionType
from utils.session import get_current_user
from core.database import get_db
from supabase import Client
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/lessons/{lesson_id}/questions", response_model=List[QuestionPublic])
async def get_lesson_questions(
    lesson_id: UUID,
    type: Optional[QuestionType] = Query(None, description="Filter by question type (pre/post)"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get questions for a lesson
    
    - **lesson_id**: Lesson UUID
    - **type**: Optional filter by question type (pre or post)
    
    Security: Excludes correct_option_index from response
    Automatically filtered by hospital_id via RLS
    """
    try:
        # Verify lesson exists and belongs to user's hospital
        lesson_response = db.table("lessons").select(
            "id, track_id, tracks(hospital_id)"
        ).eq("id", str(lesson_id)).is_("deleted_at", "null").single().execute()
        
        if not lesson_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Build query - questions table does NOT have deleted_at column
        query = db.table("questions").select(
            "id, lesson_id, type, question_text, options"
        ).eq("lesson_id", str(lesson_id))
        
        # Filter by type if provided
        if type:
            query = query.eq("type", type.value)
        
        response = query.order("created_at").execute()
        
        logger.debug(f"Questions data for lesson {lesson_id}: {response.data}")
        
        return [QuestionPublic(**question) for question in response.data]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching questions for lesson {lesson_id}: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching questions: {str(e)}"
        )
