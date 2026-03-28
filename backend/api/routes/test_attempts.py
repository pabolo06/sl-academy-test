"""
SL Academy Platform - Test Attempt Routes
Handles test submission and scoring
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List
from uuid import UUID
from models.tests import TestAttemptCreate, TestAttemptResponse
from utils.session import get_current_user
from utils.rate_limiter import check_test_submission_rate_limit
from services.scoring import scoring_service
from core.database import get_db
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=TestAttemptResponse, status_code=status.HTTP_201_CREATED)
def submit_test_attempt(
    request: Request,
    attempt: TestAttemptCreate,
    _rate_limit: None = Depends(check_test_submission_rate_limit),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Submit test attempt and calculate score
    
    - **lesson_id**: Lesson UUID
    - **type**: Question type (pre or post)
    - **answers**: List of answers with question_id and selected_option_index
    
    Validates all questions are answered and calculates score
    Automatically assigns profile_id from session
    """
    try:
        # Verify lesson exists and belongs to user's hospital
        lesson_response = db.table("lessons").select(
            "id, track_id, tracks(hospital_id)"
        ).eq("id", str(attempt.lesson_id)).is_("deleted_at", "null").single().execute()
        
        if not lesson_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Get correct answers for the lesson
        correct_answers = scoring_service.get_correct_answers(
            db=db,
            lesson_id=attempt.lesson_id,
            question_type=attempt.type.value
        )
        
        if not correct_answers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No {attempt.type.value}-test questions found for this lesson"
            )
        
        # Validate and calculate score
        try:
            test_score = scoring_service.calculate_score(
                answers=attempt.answers,
                correct_answers=correct_answers
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # Prepare answers dict for storage
        answers_dict = {
            str(answer.question_id): answer.selected_option_index
            for answer in attempt.answers
        }
        
        # Store test attempt
        response = db.table("test_attempts").insert({
            "profile_id": current_user["user_id"],
            "lesson_id": str(attempt.lesson_id),
            "type": attempt.type.value,
            "score": test_score.score,
            "answers": answers_dict
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save test attempt"
            )
        
        logger.info(
            f"Test attempt submitted: {response.data[0]['id']} "
            f"by {current_user['email']} - Score: {test_score.score}"
        )
        
        return TestAttemptResponse(
            id=UUID(response.data[0]["id"]),
            profile_id=UUID(response.data[0]["profile_id"]),
            lesson_id=UUID(response.data[0]["lesson_id"]),
            type=attempt.type,
            score=test_score.score,
            answers=answers_dict,
            created_at=response.data[0]["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting test attempt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while submitting test attempt"
        )


@router.get("/lessons/{lesson_id}/attempts", response_model=List[TestAttemptResponse])
def get_lesson_attempts(
    lesson_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get user's test attempts for a lesson
    
    Returns only current user's attempts
    Automatically filtered by profile_id
    """
    try:
        response = db.table("test_attempts").select("*").eq(
            "lesson_id", str(lesson_id)
        ).eq("profile_id", current_user["user_id"]).order(
            "created_at", desc=True
        ).execute()
        
        attempts = []
        for attempt_data in response.data:
            answers_dict = attempt_data["answers"]
            
            attempts.append(TestAttemptResponse(
                id=UUID(attempt_data["id"]),
                profile_id=UUID(attempt_data["profile_id"]),
                lesson_id=UUID(attempt_data["lesson_id"]),
                type=attempt_data["type"],
                score=attempt_data["score"],
                answers=answers_dict,
                created_at=attempt_data["created_at"]
            ))
        
        return attempts
    
    except Exception as e:
        logger.error(f"Error fetching test attempts for lesson {lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching test attempts"
        )
