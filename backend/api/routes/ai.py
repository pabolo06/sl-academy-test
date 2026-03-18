"""
SL Academy Platform - AI Routes
Handles AI-powered recommendations
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import List
from uuid import UUID
from utils.session import get_current_user
from utils.rate_limiter import check_ai_request_rate_limit
from services.ai_service import ai_service
from core.database import get_db
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class RecommendationRequest(BaseModel):
    """AI recommendation request"""
    lesson_id: UUID
    pre_test_score: float = Field(..., ge=0, le=100)
    post_test_score: float = Field(..., ge=0, le=100)


class RecommendationItem(BaseModel):
    """Single recommendation"""
    lesson_id: str
    lesson_title: str
    reason: str


class RecommendationResponse(BaseModel):
    """AI recommendation response"""
    recommendations: List[RecommendationItem]


@router.post("/generate-recommendations", response_model=RecommendationResponse)
async def generate_recommendations(
    request_data: RecommendationRequest,
    _rate_limit: None = Depends(check_ai_request_rate_limit),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Generate AI-powered lesson recommendations
    
    - **lesson_id**: Current lesson UUID
    - **pre_test_score**: Pre-test score (0-100)
    - **post_test_score**: Post-test score (0-100)
    
    Returns 3-5 recommended lessons with reasons
    Implements timeout (3 seconds at p95)
    """
    try:
        # Validate scores
        if request_data.pre_test_score < 0 or request_data.pre_test_score > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pre-test score must be between 0 and 100"
            )
        
        if request_data.post_test_score < 0 or request_data.post_test_score > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post-test score must be between 0 and 100"
            )
        
        # Get current lesson info
        lesson_response = db.table("lessons").select(
            "id, title, track_id"
        ).eq("id", str(request_data.lesson_id)).is_("deleted_at", "null").single().execute()
        
        if not lesson_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        lesson = lesson_response.data
        
        # Get available lessons from same track (excluding current)
        available_lessons_response = db.table("lessons").select(
            "id, title, description"
        ).eq("track_id", lesson["track_id"]).neq(
            "id", str(request_data.lesson_id)
        ).is_("deleted_at", "null").limit(10).execute()
        
        available_lessons = available_lessons_response.data
        
        if not available_lessons:
            return RecommendationResponse(recommendations=[])
        
        # Generate recommendations with timeout
        import asyncio
        try:
            recommendations = await asyncio.wait_for(
                ai_service.generate_recommendations(
                    pre_test_score=request_data.pre_test_score,
                    post_test_score=request_data.post_test_score,
                    lesson_title=lesson["title"],
                    available_lessons=available_lessons
                ),
                timeout=5.0  # 5 second timeout
            )
        except asyncio.TimeoutError:
            logger.warning("AI recommendation generation timed out")
            # Fallback to first 3 lessons
            recommendations = [
                {
                    "lesson_id": l["id"],
                    "reason": "This lesson covers related topics that may help reinforce your understanding."
                }
                for l in available_lessons[:3]
            ]
        
        # Build response with lesson titles
        recommendation_items = []
        for rec in recommendations:
            # Find lesson title
            lesson_data = next(
                (l for l in available_lessons if l["id"] == rec["lesson_id"]),
                None
            )
            
            if lesson_data:
                recommendation_items.append(RecommendationItem(
                    lesson_id=rec["lesson_id"],
                    lesson_title=lesson_data["title"],
                    reason=rec["reason"]
                ))
        
        logger.info(
            f"Generated {len(recommendation_items)} recommendations for user {current_user['email']}"
        )
        
        return RecommendationResponse(recommendations=recommendation_items)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating recommendations"
        )
