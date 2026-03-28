"""
SL Academy Platform - Doubt Management Routes
Handles doubt creation, querying, and answering with RBAC
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from uuid import UUID
from models.doubts import Doubt, DoubtCreate, DoubtUpdate, DoubtStatus
from utils.session import get_current_user
from utils.rate_limiter import check_doubt_submission_rate_limit
from middleware.auth import require_role
from core.database import get_db
from supabase import Client
import logging
from datetime import datetime
import traceback

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=Doubt, status_code=status.HTTP_201_CREATED)
async def create_doubt(
    doubt: DoubtCreate,
    _rate_limit: None = Depends(check_doubt_submission_rate_limit),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Create new doubt
    
    - **lesson_id**: Lesson UUID
    - **text**: Doubt text (10-5000 characters, HTML sanitized)
    - **image_url**: Optional image URL (must be from Supabase Storage)
    
    Automatically sets status to 'pending' and profile_id from session
    """
    try:
        # Verify lesson exists and belongs to user's hospital
        lesson_response = db.table("lessons").select(
            "id, track_id, tracks(hospital_id)"
        ).eq("id", str(doubt.lesson_id)).is_("deleted_at", "null").single().execute()
        
        if not lesson_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Validate image URL if provided
        if doubt.image_url:
            from core.config import settings
            if not doubt.image_url.startswith(settings.supabase_url):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image URL must be from Supabase Storage"
                )
        
        # Optionally generate AI summary
        ai_summary = None
        try:
            from services.ai_service import ai_service
            ai_summary = await ai_service.generate_doubt_summary(doubt.text)
        except Exception as e:
            logger.warning(f"Failed to generate AI summary: {str(e)}")
            # Continue without summary
        
        # Create doubt
        response = db.table("doubts").insert({
            "profile_id": current_user["user_id"],
            "lesson_id": str(doubt.lesson_id),
            "text": doubt.text,
            "image_url": doubt.image_url,
            "status": DoubtStatus.PENDING.value,
            "ai_summary": ai_summary
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create doubt"
            )
        
        logger.info(f"Doubt created: {response.data[0]['id']} by {current_user['email']}")
        
        return Doubt(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating doubt: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating doubt"
        )



@router.get("", response_model=List[Doubt])
async def get_doubts(
    status_filter: Optional[DoubtStatus] = Query(None, alias="status", description="Filter by status"),
    lesson_id: Optional[UUID] = Query(None, description="Filter by lesson ID"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get doubts
    
    - **status**: Optional filter by status (pending/answered)
    - **lesson_id**: Optional filter by lesson ID
    
    Doctors see only their own doubts
    Managers see all hospital doubts
    """
    try:
        # Build query based on role
        query = db.table("doubts").select("*").is_("deleted_at", "null")
        
        # Doctors see only their own doubts
        if current_user["role"] == "doctor":
            query = query.eq("profile_id", current_user["user_id"])
        
        # Filter by status if provided
        if status_filter:
            query = query.eq("status", status_filter.value)
        
        # Filter by lesson if provided
        if lesson_id:
            query = query.eq("lesson_id", str(lesson_id))
        
        response = query.order("created_at", desc=True).execute()
        
        return [Doubt(**doubt) for doubt in response.data]
    
    except Exception as e:
        logger.error(f"Error fetching doubts: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching doubts: {str(e)}"
        )


@router.patch("/{doubt_id}", response_model=Doubt)
async def answer_doubt(
    doubt_id: UUID,
    doubt_update: DoubtUpdate,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Answer doubt (manager only)
    
    - **doubt_id**: Doubt UUID
    - **answer**: Answer text (10-5000 characters, HTML sanitized)
    
    Updates status to 'answered' and sets answered_by and answered_at
    """
    try:
        # Verify doubt exists and belongs to user's hospital
        doubt_response = db.table("doubts").select("id, status").eq(
            "id", str(doubt_id)
        ).is_("deleted_at", "null").single().execute()
        
        if not doubt_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doubt not found"
            )
        
        # Update doubt with answer
        response = db.table("doubts").update({
            "answer": doubt_update.answer,
            "status": DoubtStatus.ANSWERED.value,
            "answered_by": current_user["user_id"],
            "answered_at": datetime.utcnow().isoformat()
        }).eq("id", str(doubt_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doubt not found"
            )
        
        logger.info(f"Doubt answered: {doubt_id} by {current_user['email']}")
        
        return Doubt(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering doubt {doubt_id}: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while answering doubt: {str(e)}"
        )


@router.delete("/{doubt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doubt(
    doubt_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Soft delete doubt (manager only)
    
    Sets deleted_at timestamp instead of permanent deletion
    Automatically filtered by hospital_id via RLS
    """
    try:
        
        response = db.table("doubts").update({
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", str(doubt_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doubt not found"
            )
        
        logger.info(f"Doubt soft deleted: {doubt_id} by {current_user['email']}")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting doubt {doubt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting doubt"
        )
