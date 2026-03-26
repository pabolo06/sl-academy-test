"""
SL Academy Platform - Track Management Routes
Handles track CRUD operations with hospital isolation and RBAC
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List
from uuid import UUID
from models.tracks import Track, TrackCreate, TrackUpdate, TrackWithLessons
from utils.session import get_current_user
from middleware.auth import require_role
from core.database import get_db
from core.cache import cached, invalidate_cache
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[Track])
@cached(ttl=600, prefix="tracks")  # 10 minutes cache
async def get_tracks(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get all tracks for current user's hospital
    
    Automatically filtered by hospital_id via RLS
    Cached for 10 minutes
    """
    try:
        # Query tracks with lesson count
        response = db.table("tracks").select(
            "*, lessons(count)"
        ).is_("deleted_at", "null").order("created_at", desc=True).execute()
        
        tracks_data = []
        for track in response.data:
            # Map Supabase lessons(count) to lesson_count
            lessons_info = track.get("lessons")
            if isinstance(lessons_info, dict):
                track["lesson_count"] = lessons_info.get("count", 0)
            elif isinstance(lessons_info, list) and len(lessons_info) > 0:
                track["lesson_count"] = lessons_info[0].get("count", 0)
            else:
                track["lesson_count"] = 0
            
            tracks_data.append(Track(**track))
            
        return tracks_data
    
    except Exception as e:
        logger.error(f"Error fetching tracks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching tracks"
        )


@router.get("/{track_id}", response_model=TrackWithLessons)
async def get_track(
    track_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get track by ID with lessons
    
    Automatically filtered by hospital_id via RLS
    """
    try:
        response = db.table("tracks").select(
            "*, lessons(*)"
        ).eq("id", str(track_id)).is_("deleted_at", "null").single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found"
            )
        
        track_data = response.data
        if not track_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found"
            )
        
        # Extract lessons and remove from track_data to avoid duplicate kwarg in Pydantic model
        raw_lessons = track_data.pop("lessons", [])
        lessons = [lesson for lesson in raw_lessons if lesson.get("deleted_at") is None]
        lessons.sort(key=lambda x: x.get("order", 0))
        
        return TrackWithLessons(**track_data, lessons=lessons)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching track {track_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching track: {str(e)}"
        )


@router.post("", response_model=Track, status_code=status.HTTP_201_CREATED)
async def create_track(
    track: TrackCreate,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Create new track (manager only)
    
    Automatically assigns hospital_id from session via RLS
    """
    try:
        response = db.table("tracks").insert({
            "title": track.title,
            "description": track.description,
            "hospital_id": current_user["hospital_id"]
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create track"
            )
        
        # Invalidate tracks cache for this hospital
        invalidate_cache(f"tracks:get_tracks:*")
        
        logger.info(f"Track created: {response.data[0]['id']} by {current_user['email']}")
        
        return Track(**response.data[0], lesson_count=0)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating track: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating track"
        )


@router.patch("/{track_id}", response_model=Track)
async def update_track(
    track_id: UUID,
    track_update: TrackUpdate,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Update track (manager only)
    
    Automatically filtered by hospital_id via RLS
    """
    try:
        # Build update data
        update_data = {}
        if track_update.title is not None:
            update_data["title"] = track_update.title
        if track_update.description is not None:
            update_data["description"] = track_update.description
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        response = db.table("tracks").update(
            update_data
        ).eq("id", str(track_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found"
            )
        
        # Invalidate tracks and lessons cache
        invalidate_cache(f"tracks:get_tracks:*")
        invalidate_cache(f"lessons:get_track_lessons:*{track_id}*")
        
        logger.info(f"Track updated: {track_id} by {current_user['email']}")
        
        # Add lesson count (default to 0 for update response)
        track_resp = response.data[0]
        track_resp["lesson_count"] = 0
        
        return Track(**track_resp)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating track {track_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating track"
        )


@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(
    track_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Soft delete track (manager only)
    
    Sets deleted_at timestamp instead of permanent deletion
    Automatically filtered by hospital_id via RLS
    """
    try:
        from datetime import datetime
        
        response = db.table("tracks").update({
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", str(track_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found"
            )
        
        # Invalidate tracks and lessons cache
        invalidate_cache(f"tracks:get_tracks:*")
        invalidate_cache(f"lessons:get_track_lessons:*{track_id}*")
        
        logger.info(f"Track soft deleted: {track_id} by {current_user['email']}")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting track {track_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting track"
        )
