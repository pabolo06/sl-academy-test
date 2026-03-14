#!/usr/bin/env python3
"""
Database backup script for SL Academy Platform.
Creates automated backups of the Supabase PostgreSQL database.
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BACKUP_DIR = os.getenv('BACKUP_DIR', './backups')
DATABASE_URL = os.getenv('DATABASE_URL')
RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', '30'))
BACKUP_PREFIX = 'sl_academy_backup'


def ensure_backup_directory():
    """Create backup directory if it doesn't exist."""
    backup_path = Path(BACKUP_DIR)
    backup_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Backup directory: {backup_path.absolute()}")
    return backup_path


def generate_backup_filename():
    """Generate timestamped backup filename."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"{BACKUP_PREFIX}_{timestamp}.sql"


def create_backup(backup_path: Path, filename: str) -> bool:
    """
    Create database backup using pg_dump.
    
    Args:
        backup_path: Path to backup directory
        filename: Backup filename
    
    Returns:
        True if backup successful, False otherwise
    """
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable not set")
        return False
    
    backup_file = backup_path / filename
    
    try:
        logger.info(f"Starting backup to {backup_file}")
        
        # Run pg_dump
        result = subprocess.run(
            ['pg_dump', DATABASE_URL, '-f', str(backup_file)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            # Get file size
            file_size = backup_file.stat().st_size
            size_mb = file_size / (1024 * 1024)
            
            logger.info(f"Backup completed successfully: {backup_file}")
            logger.info(f"Backup size: {size_mb:.2f} MB")
            
            # Compress backup
            compress_backup(backup_file)
            
            return True
        else:
            logger.error(f"Backup failed: {result.stderr}")
            return False
    
    except subprocess.TimeoutExpired:
        logger.error("Backup timed out after 5 minutes")
        return False
    except Exception as e:
        logger.error(f"Backup error: {e}")
        return False


def compress_backup(backup_file: Path):
    """
    Compress backup file using gzip.
    
    Args:
        backup_file: Path to backup file
    """
    try:
        logger.info(f"Compressing backup: {backup_file}")
        
        result = subprocess.run(
            ['gzip', '-f', str(backup_file)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            compressed_file = Path(f"{backup_file}.gz")
            compressed_size = compressed_file.stat().st_size
            size_mb = compressed_size / (1024 * 1024)
            
            logger.info(f"Compression completed: {compressed_file}")
            logger.info(f"Compressed size: {size_mb:.2f} MB")
        else:
            logger.warning(f"Compression failed: {result.stderr}")
    
    except Exception as e:
        logger.warning(f"Compression error: {e}")


def cleanup_old_backups(backup_path: Path):
    """
    Remove backups older than retention period.
    
    Args:
        backup_path: Path to backup directory
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
        logger.info(f"Cleaning up backups older than {RETENTION_DAYS} days")
        
        deleted_count = 0
        for backup_file in backup_path.glob(f"{BACKUP_PREFIX}_*.sql*"):
            # Get file modification time
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            
            if file_time < cutoff_date:
                logger.info(f"Deleting old backup: {backup_file}")
                backup_file.unlink()
                deleted_count += 1
        
        logger.info(f"Deleted {deleted_count} old backup(s)")
    
    except Exception as e:
        logger.error(f"Cleanup error: {e}")


def verify_backup(backup_file: Path) -> bool:
    """
    Verify backup file integrity.
    
    Args:
        backup_file: Path to backup file
    
    Returns:
        True if backup is valid, False otherwise
    """
    try:
        # Check if file exists and has content
        if not backup_file.exists():
            logger.error(f"Backup file not found: {backup_file}")
            return False
        
        file_size = backup_file.stat().st_size
        if file_size == 0:
            logger.error(f"Backup file is empty: {backup_file}")
            return False
        
        # For compressed files, check gzip integrity
        if backup_file.suffix == '.gz':
            result = subprocess.run(
                ['gzip', '-t', str(backup_file)],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"Backup file is corrupted: {backup_file}")
                return False
        
        logger.info(f"Backup verification passed: {backup_file}")
        return True
    
    except Exception as e:
        logger.error(f"Verification error: {e}")
        return False


def main():
    """Main backup execution."""
    logger.info("=" * 60)
    logger.info("SL Academy Platform - Database Backup")
    logger.info("=" * 60)
    
    # Ensure backup directory exists
    backup_path = ensure_backup_directory()
    
    # Generate backup filename
    filename = generate_backup_filename()
    
    # Create backup
    success = create_backup(backup_path, filename)
    
    if not success:
        logger.error("Backup failed")
        sys.exit(1)
    
    # Verify backup (check compressed file)
    backup_file = backup_path / f"{filename}.gz"
    if not verify_backup(backup_file):
        logger.error("Backup verification failed")
        sys.exit(1)
    
    # Cleanup old backups
    cleanup_old_backups(backup_path)
    
    logger.info("=" * 60)
    logger.info("Backup completed successfully")
    logger.info("=" * 60)
    
    sys.exit(0)


if __name__ == '__main__':
    main()
