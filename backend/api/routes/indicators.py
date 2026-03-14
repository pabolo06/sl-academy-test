"""
SL Academy Platform - Indicator Management Routes
Handles indicator querying and import with RBAC
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import List, Optional
from datetime import date
from models.indicators import Indicator, IndicatorImportRequest, IndicatorImportResult
from utils.session import get_current_user
from utils.rate_limiter import check_indicator_import_rate_limit
from middleware.auth import require_role
from services.indicators import indicator_import_service
from core.database import get_db
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[Indicator])
async def get_indicators(
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, alias="startDate", description="Filter by start date"),
    end_date: Optional[date] = Query(None, alias="endDate", description="Filter by end date"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get indicators for current user's hospital
    
    - **category**: Optional filter by category
    - **startDate**: Optional filter by start date (YYYY-MM-DD)
    - **endDate**: Optional filter by end date (YYYY-MM-DD)
    
    Automatically filtered by hospital_id via RLS
    """
    try:
        # Build query
        query = db.table("indicators").select("*").eq("deleted_at", None)
        
        # Filter by category if provided
        if category:
            query = query.eq("category", category)
        
        # Filter by date range if provided
        if start_date:
            query = query.gte("reference_date", start_date.isoformat())
        
        if end_date:
            query = query.lte("reference_date", end_date.isoformat())
        
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
    request: Request,
    import_request: IndicatorImportRequest,
    _rate_limit: None = Depends(check_indicator_import_rate_limit),
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Import indicators from CSV/XLSX (manager only)
    
    - **indicators**: List of indicator rows (max 10,000)
    
    Validates each row and performs upsert (update if exists, create if not)
    Returns detailed error report for failed rows
    """
    try:
        result = await indicator_import_service.import_indicators(
            db=db,
            hospital_id=current_user["hospital_id"],
            indicators=import_request.indicators
        )
        
        logger.info(
            f"Indicator import completed by {current_user['email']}: "
            f"{result.success_count} success, {result.error_count} errors"
        )
        
        # Log indicator import
        from utils.audit_logger import audit_logger
        await audit_logger.log_indicator_import(
            db=db,
            user_id=current_user["user_id"],
            hospital_id=current_user["hospital_id"],
            success_count=result.success_count,
            error_count=result.error_count
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error importing indicators: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while importing indicators"
        )



@router.delete("/{indicator_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_indicator(
    indicator_id: str,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Soft delete indicator (manager only)
    
    Sets deleted_at timestamp instead of permanent deletion
    Automatically filtered by hospital_id via RLS
    """
    try:
        from datetime import datetime
        
        response = db.table("indicators").update({
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", indicator_id).eq("deleted_at", None).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Indicator not found"
            )
        
        logger.info(f"Indicator soft deleted: {indicator_id} by {current_user['email']}")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting indicator {indicator_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting indicator"
        )
