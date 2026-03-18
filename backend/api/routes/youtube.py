"""
SL Academy Platform - YouTube API Routes
Fetch YouTube video metadata including duration
"""

from fastapi import APIRouter, HTTPException, Query, status
import httpx
import re
from typing import Optional
import json
import subprocess

router = APIRouter(prefix="/youtube", tags=["youtube"])

def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)',
        r'youtube\.com\/embed\/([^&\s]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def get_youtube_duration_simple(video_id: str) -> Optional[int]:
    """
    Simple approach: Use YouTube's oEmbed API and extract from page
    """
    try:
        async with httpx.AsyncClient() as client:
            # Try oEmbed first to validate video exists
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            response = await client.get(oembed_url, timeout=10.0)
            
            if response.status_code != 200:
                return None
            
            # Video exists, now try to get duration from page
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            page_response = await client.get(video_url, headers=headers, timeout=10.0)
            
            if page_response.status_code == 200:
                # Search for lengthSeconds in the HTML
                html = page_response.text
                
                # Try multiple patterns
                patterns = [
                    r'"lengthSeconds":"(\d+)"',
                    r'lengthSeconds\\":\\"(\d+)\\"',
                    r'lengthSeconds":(\d+)',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, html)
                    if matches:
                        return int(matches[0])
            
            return None
            
    except Exception as e:
        print(f"Error fetching YouTube duration: {e}")
        return None

@router.get("/duration")
async def get_video_duration(
    videoId: str = Query(..., description="YouTube video ID"),
    url: Optional[str] = Query(None, description="Full YouTube URL (alternative to videoId)")
):
    """
    Get the duration of a YouTube video in seconds
    
    This endpoint attempts to extract duration from YouTube's page.
    """
    
    # If URL is provided, extract video ID
    if url:
        extracted_id = extract_video_id(url)
        if extracted_id:
            videoId = extracted_id
    
    if not videoId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid YouTube URL or video ID"
        )
    
    try:
        duration = await get_youtube_duration_simple(videoId)
        
        if duration and duration > 0:
            return {
                "videoId": videoId,
                "duration": duration,
                "success": True
            }
        
        # If we couldn't get duration, return error
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not fetch video duration. Please enter manually."
        )
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Request to YouTube timed out"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error connecting to YouTube: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/info")
async def get_video_info(
    videoId: str = Query(..., description="YouTube video ID"),
):
    """
    Get basic information about a YouTube video
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json"
            response = await client.get(url, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                duration = await get_youtube_duration_simple(videoId)
                
                return {
                    "videoId": videoId,
                    "title": data.get("title", ""),
                    "author": data.get("author_name", ""),
                    "thumbnail": data.get("thumbnail_url", ""),
                    "duration": duration,
                    "success": True
                }
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found or unavailable"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
