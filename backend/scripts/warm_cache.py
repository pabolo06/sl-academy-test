"""
SL Academy Platform - Cache Warming Script
Pre-populates Redis cache with frequently accessed data
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.database import get_db
from core.cache import redis_client
from supabase import Client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def warm_tracks_cache(db: Client, hospital_id: str):
    """Warm cache for tracks listing."""
    try:
        response = db.table("tracks").select(
            "*, lessons(count)"
        ).eq("hospital_id", hospital_id).is_("deleted_at", "null").order("created_at", desc=True).execute()
        
        logger.info(f"Warmed tracks cache for hospital {hospital_id}: {len(response.data)} tracks")
        return response.data
    except Exception as e:
        logger.error(f"Error warming tracks cache: {str(e)}")
        return []


async def warm_lessons_cache(db: Client, track_id: str):
    """Warm cache for lessons listing."""
    try:
        response = db.table("lessons").select("*").eq(
            "track_id", track_id
        ).is_("deleted_at", "null").order("order", desc=False).execute()
        
        logger.info(f"Warmed lessons cache for track {track_id}: {len(response.data)} lessons")
        return response.data
    except Exception as e:
        logger.error(f"Error warming lessons cache: {str(e)}")
        return []


async def warm_cache():
    """Pre-populate cache with frequently accessed data."""
    
    if redis_client is None:
        logger.error("Redis is not available. Cache warming skipped.")
        return
    
    logger.info("Starting cache warming...")
    
    try:
        # Get database client
        db = next(get_db())
        
        # Get all hospitals
        hospitals_response = db.table("hospitals").select("id, name").is_("deleted_at", "null").execute()
        hospitals = hospitals_response.data
        
        logger.info(f"Found {len(hospitals)} hospitals")
        
        total_tracks = 0
        total_lessons = 0
        
        for hospital in hospitals:
            hospital_id = hospital["id"]
            hospital_name = hospital["name"]
            
            logger.info(f"Warming cache for hospital: {hospital_name} ({hospital_id})")
            
            # Warm tracks cache
            tracks = await warm_tracks_cache(db, hospital_id)
            total_tracks += len(tracks)
            
            # Warm lessons cache for each track
            for track in tracks:
                lessons = await warm_lessons_cache(db, track["id"])
                total_lessons += len(lessons)
        
        logger.info(f"Cache warming completed!")
        logger.info(f"Total: {len(hospitals)} hospitals, {total_tracks} tracks, {total_lessons} lessons")
        
    except Exception as e:
        logger.error(f"Cache warming failed: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(warm_cache())
