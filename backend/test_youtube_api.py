"""
Test script for YouTube API endpoint
"""
import asyncio
from api.routes.youtube import get_youtube_page_data

async def test_youtube_api():
    video_id = "54Pyv4TGO_w"
    print(f"Testing YouTube API with video ID: {video_id}")
    
    result = await get_youtube_page_data(video_id)
    
    if result:
        print(f"✅ Success!")
        print(f"Duration: {result.get('duration')} seconds")
        print(f"Title: {result.get('title')}")
        print(f"Author: {result.get('author')}")
    else:
        print("❌ Failed to fetch video data")

if __name__ == "__main__":
    asyncio.run(test_youtube_api())
