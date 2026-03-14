"""
SL Academy Platform - Admin Routes
Handles administrative operations like purging deleted records
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from utils.session import get_current_user
from middleware.auth import require_role
from utils.purge_deleted import purge_service
from core.database import get_db
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/purge-deleted", status_code=status.HTTP_200_OK)
async def purge_deleted_records(
    dry_run: bool = Query(False, description="If true, only count records without deleting"),
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db)
):
    """
    Permanently purge soft-deleted records older than 90 days (manager only)
    
    - **dry_run**: If true, only count records without actually deleting them
    
    This operation permanently removes records that have been soft-deleted
    for more than 90 days. Use dry_run=true to preview what would be deleted.
    
    Returns summary with count of purged records per table.
    """
    try:
        result = await purge_service.purge_all_tables(
            db=db,
            dry_run=dry_run
        )
        
        logger.info(
            f"Purge operation {'(dry run) ' if dry_run else ''}completed by {current_user['email']}: "
            f"{result['total_purged']} records"
        )
        
        # Log purge operation
        from utils.audit_logger import audit_logger
        await audit_logger.log_event(
            db=db,
            event_type="purge_deleted_records",
            user_id=current_user["user_id"],
            hospital_id=current_user["hospital_id"],
            details={
                "dry_run": dry_run,
                "total_purged": result["total_purged"],
                "tables_processed": result["tables_processed"]
            }
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error during purge operation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during purge operation"
        )
