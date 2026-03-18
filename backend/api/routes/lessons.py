"""
SL Academy Platform - Lesson Management Routes
Handles lesson CRUD operations with ordering and RBAC
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List
from uuid import UUID
from models.tracks import Lesson, LessonCreate, LessonUpdate, LessonDetail
from utils.session import get_current_user
from middleware.auth import require_role
from core.database import get_db
from core.cache import cached, invalidate_cache
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/tracks/{track_id}/lessons", response_model=List[Lesson])
@cached(ttl=600, prefix="lessons")  # 10 minutes cache
async def get_track_lessons(
    track_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get all lessons for a track
    
    Returns lessons ordered by order field
    Automatically filtered by hospital_id via RLS
    Cached for 10 minutes
    """
    try:
        # Verify track exists and belongs to user's hospital
        track_response = db.table("tracks").select("id").eq(
            "id", str(track_id)
        ).is_("deleted_at", "null").single().execute()
        
        if not track_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found"
            )
        
        # Get lessons ordered by order field
        response = db.table("lessons").select("*").eq(
            "track_id", str(track_id)
        ).is_("deleted_at", "null").order("order", desc=False).execute()
        
        return [Lesson(**lesson) for lesson in response.data]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching lessons for track {track_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching lessons"
        )


@router.get("/{lesson_id}", response_model=LessonDetail)
@cached(ttl=600, prefix="lessons")  # 10 minutes cache
async def get_lesson(
    lesson_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get lesson by ID with track info and question counts
    
    Automatically filtered by hospital_id via RLS
    Cached for 10 minutes
    """
    try:
        response = db.table("lessons").select(
            "*, tracks(*), questions(count)"
        ).eq("id", str(lesson_id)).is_("deleted_at", "null").single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        lesson_data = response.data
        
        # Count pre and post test questions
        pre_test_count = 0
        post_test_count = 0
        if lesson_data.get("questions"):
            # questions table does NOT have deleted_at column
            questions_response = db.table("questions").select(
                "type"
            ).eq("lesson_id", str(lesson_id)).execute()
            
            for q in questions_response.data:
                if q["type"] == "pre":
                    pre_test_count += 1
                elif q["type"] == "post":
                    post_test_count += 1
        
        return LessonDetail(
            **lesson_data,
            track=lesson_data.get("tracks"),
            pre_test_questions_count=pre_test_count,
            post_test_questions_count=post_test_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching lesson {lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching lesson"
        )


@router.post("", response_model=Lesson, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson: LessonCreate,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Create new lesson (manager only)
    
    Enforces unique ordering within track
    Automatically filtered by hospital_id via RLS
    """
    try:
        # Verify track exists and belongs to user's hospital
        track_response = db.table("tracks").select("id").eq(
            "id", str(lesson.track_id)
        ).is_("deleted_at", "null").single().execute()
        
        if not track_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found"
            )
        
        # Check for duplicate order in track
        existing_order = db.table("lessons").select("id").eq(
            "track_id", str(lesson.track_id)
        ).eq("order", lesson.order).is_("deleted_at", "null").execute()
        
        if existing_order.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lesson with order {lesson.order} already exists in this track"
            )
        
        # Create lesson
        response = db.table("lessons").insert({
            "track_id": str(lesson.track_id),
            "title": lesson.title,
            "description": lesson.description,
            "video_url": lesson.video_url,
            "duration_seconds": lesson.duration_seconds,
            "order": lesson.order
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create lesson"
            )
        
        # Invalidate lessons cache for this track
        invalidate_cache(f"lessons:get_track_lessons:*{lesson.track_id}*")
        invalidate_cache(f"tracks:get_tracks:*")
        
        logger.info(f"Lesson created: {response.data[0]['id']} by {current_user['email']}")
        
        return Lesson(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating lesson: {str(e)}", exc_info=True)
        logger.error(f"Lesson data: track_id={lesson.track_id}, title={lesson.title}, duration={lesson.duration_seconds}, order={lesson.order}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating lesson: {str(e)}"
        )


@router.patch("/{lesson_id}", response_model=Lesson)
async def update_lesson(
    lesson_id: UUID,
    lesson_update: LessonUpdate,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Update lesson (manager only)
    
    Enforces unique ordering within track if order is updated
    Automatically filtered by hospital_id via RLS
    """
    try:
        # Get current lesson
        current_lesson = db.table("lessons").select(
            "track_id, order"
        ).eq("id", str(lesson_id)).is_("deleted_at", "null").single().execute()
        
        if not current_lesson.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Build update data
        update_data = {}
        if lesson_update.title is not None:
            update_data["title"] = lesson_update.title
        if lesson_update.description is not None:
            update_data["description"] = lesson_update.description
        if lesson_update.video_url is not None:
            update_data["video_url"] = lesson_update.video_url
        if lesson_update.duration_seconds is not None:
            update_data["duration_seconds"] = lesson_update.duration_seconds
        if lesson_update.order is not None:
            # Check for duplicate order in track
            if lesson_update.order != current_lesson.data["order"]:
                existing_order = db.table("lessons").select("id").eq(
                    "track_id", current_lesson.data["track_id"]
                ).eq("order", lesson_update.order).is_("deleted_at", "null").execute()
                
                if existing_order.data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Lesson with order {lesson_update.order} already exists in this track"
                    )
            
            update_data["order"] = lesson_update.order
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        response = db.table("lessons").update(
            update_data
        ).eq("id", str(lesson_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Invalidate lessons cache
        invalidate_cache(f"lessons:get_track_lessons:*{current_lesson.data['track_id']}*")
        invalidate_cache(f"lessons:get_lesson:*{lesson_id}*")
        invalidate_cache(f"tracks:get_tracks:*")
        
        logger.info(f"Lesson updated: {lesson_id} by {current_user['email']}")
        
        return Lesson(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lesson {lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating lesson"
        )


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Soft delete lesson (manager only)
    
    Sets deleted_at timestamp instead of permanent deletion
    Automatically filtered by hospital_id via RLS
    """
    try:
        from datetime import datetime
        
        # Get lesson to find track_id for cache invalidation
        lesson_response = db.table("lessons").select("track_id").eq(
            "id", str(lesson_id)
        ).is_("deleted_at", "null").single().execute()
        
        if not lesson_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        track_id = lesson_response.data["track_id"]
        
        response = db.table("lessons").update({
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", str(lesson_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Invalidate lessons cache
        invalidate_cache(f"lessons:get_track_lessons:*{track_id}*")
        invalidate_cache(f"lessons:get_lesson:*{lesson_id}*")
        invalidate_cache(f"tracks:get_tracks:*")
        
        logger.info(f"Lesson soft deleted: {lesson_id} by {current_user['email']}")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lesson {lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting lesson"
        )
