#!/usr/bin/env python3
"""
SL Academy Platform - Purge Deleted Records Script
CLI script for purging soft-deleted records older than 90 days

Usage:
    python scripts/purge_deleted_records.py [--dry-run]

Options:
    --dry-run    Preview what would be deleted without actually deleting
"""

import sys
import os
import asyncio
import argparse

# Add parent directory to path to import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.database import Database
from utils.purge_deleted import purge_service
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    """Main function to run purge operation"""
    parser = argparse.ArgumentParser(
        description="Purge soft-deleted records older than 90 days"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be deleted without actually deleting"
    )
    
    args = parser.parse_args()
    
    try:
        # Get database client
        db = Database.get_client()
        
        logger.info("=" * 80)
        logger.info("SL Academy Platform - Purge Deleted Records")
        logger.info("=" * 80)
        
        if args.dry_run:
            logger.info("Running in DRY RUN mode - no records will be deleted")
        else:
            logger.warning("Running in LIVE mode - records will be permanently deleted!")
        
        logger.info("")
        
        # Run purge operation
        result = await purge_service.purge_all_tables(
            db=db,
            dry_run=args.dry_run
        )
        
        # Print summary
        logger.info("")
        logger.info("=" * 80)
        logger.info("PURGE SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Cutoff Date: {result['cutoff_date']}")
        logger.info(f"Total Records {'Would Be ' if args.dry_run else ''}Purged: {result['total_purged']}")
        logger.info(f"Tables Processed: {result['tables_processed']}")
        logger.info("")
        
        # Print per-table results
        logger.info("Per-Table Results:")
        logger.info("-" * 80)
        for table_result in result['results']:
            status_icon = "✓" if table_result['status'] in ['success', 'dry_run', 'no_records'] else "✗"
            logger.info(
                f"{status_icon} {table_result['table']:20s} - "
                f"{table_result['count']:5d} records - "
                f"{table_result['status']}"
            )
        
        # Print errors if any
        if result['errors']:
            logger.info("")
            logger.error("ERRORS:")
            logger.error("-" * 80)
            for error in result['errors']:
                logger.error(f"✗ {error['table']}: {error['error']}")
        
        logger.info("=" * 80)
        
        if args.dry_run:
            logger.info("DRY RUN completed. Run without --dry-run to actually delete records.")
        else:
            logger.info("Purge operation completed successfully.")
        
        return 0
    
    except Exception as e:
        logger.error(f"Fatal error during purge operation: {str(e)}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
