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
from models.ai import AssistantRequest, AssistantResponse, ChatMessage
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


@router.post("/assistant", response_model=AssistantResponse)
async def chat_with_assistant(
    request_data: AssistantRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with AI assistant (role-specific context)

    - **messages**: Chat history with user messages
    - **context**: Optional hospital/domain context

    Available for: doctor and manager roles

    Doctor assistant: Medical education, lessons, clinical concepts
    Manager assistant: Team organization, performance analysis, training management
    """
    try:
        # Get user role from session
        user_role = current_user.get("role")

        if user_role not in ["doctor", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors and managers can use the assistant"
            )

        # Validate at least one message
        if not request_data.messages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one message is required"
            )

        # Convert ChatMessage objects to dicts for AI service
        messages_dicts = [
            {"role": msg.role, "content": msg.content}
            for msg in request_data.messages
        ]

        # Generate response with role-specific context
        response_text = await ai_service.generate_assistant_response(
            messages=messages_dicts,
            role=user_role,
            hospital_context=request_data.context
        )

        logger.info(
            f"Assistant response generated for {user_role} ({current_user['email']})"
        )

        return AssistantResponse(
            response=response_text,
            role=user_role
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in assistant endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )
