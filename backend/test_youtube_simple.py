"""
Simple test for YouTube API
"""
import asyncio
from api.routes.youtube import get_youtube_duration_simple

async def test():
    video_id = "54Pyv4TGO_w"
    print(f"Testing with video ID: {video_id}")
    
    duration = await get_youtube_duration_simple(video_id)
    
    if duration:
        print(f"✅ Duration: {duration} seconds ({duration//60}:{duration%60:02d})")
    else:
        print("❌ Could not fetch duration")

if __name__ == "__main__":
    asyncio.run(test())
