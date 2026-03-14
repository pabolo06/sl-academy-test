"""
SL Academy Platform - Purge Deleted Records Utility
Permanently deletes soft-deleted records older than 90 days
"""

from datetime import datetime, timedelta
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class PurgeService:
    """Service for permanently purging soft-deleted records"""
    
    # Tables with soft delete support
    SOFT_DELETE_TABLES = [
        "hospitals",
        "profiles",
        "tracks",
        "lessons",
        "questions",
        "doubts",
        "indicators"
    ]
    
    @staticmethod
    def get_purge_cutoff_date() -> str:
        """
        Get the cutoff date for purging (90 days ago)
        
        Returns:
            ISO format date string
        """
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        return cutoff_date.isoformat()
    
    @staticmethod
    async def purge_table(
        db: Client,
        table_name: str,
        cutoff_date: str,
        dry_run: bool = False
    ) -> dict:
        """
        Purge soft-deleted records from a table
        
        Args:
            db: Supabase client
            table_name: Name of the table to purge
            cutoff_date: ISO format date string for cutoff
            dry_run: If True, only count records without deleting
        
        Returns:
            Dict with table_name, count, and status
        """
        try:
            # First, count records to be purged
            count_response = db.table(table_name).select(
                "id", count="exact"
            ).not_.is_("deleted_at", "null").lt(
                "deleted_at", cutoff_date
            ).execute()
            
            record_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
            
            if record_count == 0:
                logger.info(f"No records to purge from {table_name}")
                return {
                    "table": table_name,
                    "count": 0,
                    "status": "no_records"
                }
            
            if dry_run:
                logger.info(f"[DRY RUN] Would purge {record_count} records from {table_name}")
                return {
                    "table": table_name,
                    "count": record_count,
                    "status": "dry_run"
                }
            
            # Permanently delete records
            delete_response = db.table(table_name).delete().not_.is_(
                "deleted_at", "null"
            ).lt("deleted_at", cutoff_date).execute()
            
            deleted_count = len(delete_response.data) if delete_response.data else 0
            
            logger.info(f"Purged {deleted_count} records from {table_name}")
            
            return {
                "table": table_name,
                "count": deleted_count,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error purging {table_name}: {str(e)}")
            return {
                "table": table_name,
                "count": 0,
                "status": "error",
                "error": str(e)
            }
    
    @staticmethod
    async def purge_all_tables(
        db: Client,
        dry_run: bool = False
    ) -> dict:
        """
        Purge soft-deleted records from all tables
        
        Args:
            db: Supabase client
            dry_run: If True, only count records without deleting
        
        Returns:
            Dict with summary of purge operation
        """
        cutoff_date = PurgeService.get_purge_cutoff_date()
        
        logger.info(
            f"{'[DRY RUN] ' if dry_run else ''}Starting purge of records deleted before {cutoff_date}"
        )
        
        results = []
        total_purged = 0
        errors = []
        
        for table_name in PurgeService.SOFT_DELETE_TABLES:
            result = await PurgeService.purge_table(
                db=db,
                table_name=table_name,
                cutoff_date=cutoff_date,
                dry_run=dry_run
            )
            
            results.append(result)
            
            if result["status"] == "success" or result["status"] == "dry_run":
                total_purged += result["count"]
            elif result["status"] == "error":
                errors.append({
                    "table": table_name,
                    "error": result.get("error")
                })
        
        summary = {
            "cutoff_date": cutoff_date,
            "dry_run": dry_run,
            "total_purged": total_purged,
            "tables_processed": len(results),
            "results": results,
            "errors": errors
        }
        
        logger.info(
            f"{'[DRY RUN] ' if dry_run else ''}Purge completed: "
            f"{total_purged} records from {len(results)} tables"
        )
        
        return summary


# Global purge service instance
purge_service = PurgeService()
