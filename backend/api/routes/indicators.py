"""
SL Academy Platform - Indicator Management Routes
Handles hospital performance and safety metrics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List
from uuid import UUID
from datetime import datetime
from models.indicators import Indicator, IndicatorImportRequest, IndicatorImportResult
from utils.session import get_current_user
from middleware.auth import require_role
from core.database import get_db
from core.cache import cached, invalidate_cache
from supabase import Client
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[Indicator])
@cached(ttl=300, prefix="indicators")  # 5 minutes cache
async def get_indicators(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get indicators for current user's hospital
    
    Automatically filtered by hospital_id via RLS
    Cached for 5 minutes
    """
    try:
        # Query indicators with hospital isolation
        query = db.table("indicators").select("*").is_("deleted_at", "null")
        
        # Hospital isolation is handled by RLS, but we can be explicit
        query = query.eq("hospital_id", current_user["hospital_id"])
        
        response = query.order("reference_date", desc=True).execute()
        
        return [Indicator(**indicator) for indicator in response.data]
    
    except Exception as e:
        logger.error(f"Error fetching indicators: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching indicators"
        )


@router.post("/import", response_model=IndicatorImportResult)
async def import_indicators(
    import_data: IndicatorImportRequest,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Import indicators from batch request (manager only)
    
    Validates and performs batch upsert of indicators for current hospital.
    Automatically handles existing records (updates) or creates new ones.
    """
    try:
        from services.indicators import indicator_import_service
        from models.indicators import IndicatorImportRow
        
        # Map request items to service data model
        service_indicators = [
            IndicatorImportRow(**row.dict()) 
            for row in import_data.indicators
        ]
        
        # Execute import via service
        result = await indicator_import_service.import_indicators(
            db=db,
            hospital_id=current_user["hospital_id"],
            indicators=service_indicators
        )
        
        # Invalidate indicators cache
        if result.success_count > 0:
            invalidate_cache("indicators:get_indicators:*")
            
        return result
        
    except Exception as e:
        logger.error(f"Error importing indicators: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during import: {str(e)}"
        )


@router.delete("/{indicator_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_indicator(
    indicator_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Soft delete indicator (manager only)
    
    Sets deleted_at timestamp instead of permanent deletion
    """
    try:
        response = db.table("indicators").update({
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", str(indicator_id)).is_("deleted_at", "null").execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Indicator not found"
            )
        
        # Invalidate indicators cache
        invalidate_cache("indicators:get_indicators:*")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting indicator {indicator_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting indicator"
        )
