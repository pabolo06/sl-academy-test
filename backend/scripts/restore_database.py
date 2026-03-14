#!/usr/bin/env python3
"""
Database restore script for SL Academy Platform.
Restores database from backup files.
"""

import os
import sys
import subprocess
from pathlib import Path
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BACKUP_DIR = os.getenv('BACKUP_DIR', './backups')
DATABASE_URL = os.getenv('DATABASE_URL')


def list_available_backups(backup_path: Path):
    """
    List all available backup files.
    
    Args:
        backup_path: Path to backup directory
    
    Returns:
        List of backup files sorted by date (newest first)
    """
    backups = []
    
    for backup_file in backup_path.glob('sl_academy_backup_*.sql*'):
        file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
        file_size = backup_file.stat().st_size / (1024 * 1024)  # MB
        
        backups.append({
            'file': backup_file,
            'name': backup_file.name,
            'date': file_time,
            'size_mb': file_size
        })
    
    # Sort by date (newest first)
    backups.sort(key=lambda x: x['date'], reverse=True)
    
    return backups


def decompress_backup(backup_file: Path) -> Path:
    """
    Decompress backup file if compressed.
    
    Args:
        backup_file: Path to backup file
    
    Returns:
        Path to decompressed file
    """
    if backup_file.suffix != '.gz':
        return backup_file
    
    try:
        logger.info(f"Decompressing backup: {backup_file}")
        
        result = subprocess.run(
            ['gzip', '-d', '-k', str(backup_file)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            decompressed_file = backup_file.with_suffix('')
            logger.info(f"Decompression completed: {decompressed_file}")
            return decompressed_file
        else:
            logger.error(f"Decompression failed: {result.stderr}")
            return None
    
    except Exception as e:
        logger.error(f"Decompression error: {e}")
        return None


def restore_backup(backup_file: Path, dry_run: bool = False) -> bool:
    """
    Restore database from backup file.
    
    Args:
        backup_file: Path to backup file
        dry_run: If True, only validate without restoring
    
    Returns:
        True if restore successful, False otherwise
    """
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable not set")
        return False
    
    # Decompress if needed
    if backup_file.suffix == '.gz':
        backup_file = decompress_backup(backup_file)
        if not backup_file:
            return False
    
    if dry_run:
        logger.info(f"DRY RUN: Would restore from {backup_file}")
        logger.info("No changes made to database")
        return True
    
    try:
        logger.warning("=" * 60)
        logger.warning("WARNING: This will OVERWRITE the current database!")
        logger.warning("=" * 60)
        
        # Confirm restore
        response = input("Type 'RESTORE' to confirm: ")
        if response != 'RESTORE':
            logger.info("Restore cancelled")
            return False
        
        logger.info(f"Starting restore from {backup_file}")
        
        # Run psql to restore
        result = subprocess.run(
            ['psql', DATABASE_URL, '-f', str(backup_file)],
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes timeout
        )
        
        if result.returncode == 0:
            logger.info("Restore completed successfully")
            
            # Clean up decompressed file if it was created
            if backup_file.suffix == '.sql' and Path(f"{backup_file}.gz").exists():
                backup_file.unlink()
                logger.info(f"Cleaned up temporary file: {backup_file}")
            
            return True
        else:
            logger.error(f"Restore failed: {result.stderr}")
            return False
    
    except subprocess.TimeoutExpired:
        logger.error("Restore timed out after 10 minutes")
        return False
    except KeyboardInterrupt:
        logger.info("Restore cancelled by user")
        return False
    except Exception as e:
        logger.error(f"Restore error: {e}")
        return False


def main():
    """Main restore execution."""
    logger.info("=" * 60)
    logger.info("SL Academy Platform - Database Restore")
    logger.info("=" * 60)
    
    # Check for backup directory
    backup_path = Path(BACKUP_DIR)
    if not backup_path.exists():
        logger.error(f"Backup directory not found: {backup_path}")
        sys.exit(1)
    
    # List available backups
    backups = list_available_backups(backup_path)
    
    if not backups:
        logger.error("No backup files found")
        sys.exit(1)
    
    # Display available backups
    logger.info("\nAvailable backups:")
    logger.info("-" * 60)
    for i, backup in enumerate(backups, 1):
        logger.info(f"{i}. {backup['name']}")
        logger.info(f"   Date: {backup['date'].strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"   Size: {backup['size_mb']:.2f} MB")
        logger.info("")
    
    # Get user selection
    try:
        selection = input(f"Select backup to restore (1-{len(backups)}) or 'q' to quit: ")
        
        if selection.lower() == 'q':
            logger.info("Restore cancelled")
            sys.exit(0)
        
        index = int(selection) - 1
        if index < 0 or index >= len(backups):
            logger.error("Invalid selection")
            sys.exit(1)
        
        selected_backup = backups[index]
        
        # Ask for dry run
        dry_run_response = input("Perform dry run first? (y/n): ")
        dry_run = dry_run_response.lower() == 'y'
        
        # Restore backup
        success = restore_backup(selected_backup['file'], dry_run=dry_run)
        
        if not success:
            logger.error("Restore failed")
            sys.exit(1)
        
        if not dry_run:
            logger.info("=" * 60)
            logger.info("Restore completed successfully")
            logger.info("=" * 60)
        
        sys.exit(0)
    
    except ValueError:
        logger.error("Invalid input")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("\nRestore cancelled")
        sys.exit(0)


if __name__ == '__main__':
    main()
