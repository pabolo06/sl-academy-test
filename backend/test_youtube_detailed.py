"""
Detailed debug script for YouTube scraping
"""
import asyncio
import httpx
import re
import json

async def test_youtube_detailed():
    video_id = "54Pyv4TGO_w"
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    print(f"Fetching: {url}")
    
    async with httpx.AsyncClient() as client:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = await client.get(url, timeout=10.0, follow_redirects=True, headers=headers)
        
        print(f"Status code: {response.status_code}")
        html = response.text
        
        # Search for lengthSeconds directly
        length_pattern = r'"lengthSeconds":"(\d+)"'
        length_matches = re.findall(length_pattern, html)
        
        if length_matches:
            print(f"✅ Found lengthSeconds: {length_matches[0]} seconds")
            print(f"   That's {int(length_matches[0])//60} minutes and {int(length_matches[0])%60} seconds")
        else:
            print("❌ lengthSeconds not found")
        
        # Search for title
        title_pattern = r'"title":"([^"]+)"'
        title_matches = re.findall(title_pattern, html)
        if title_matches:
            print(f"✅ Found titles: {title_matches[:3]}")
        
        # Search for videoDetails section
        video_details_pattern = r'"videoDetails":\s*\{([^}]+lengthSeconds[^}]+)\}'
        vd_match = re.search(video_details_pattern, html)
        if vd_match:
            print(f"✅ Found videoDetails section")
            print(f"   Content preview: {vd_match.group(0)[:200]}...")

if __name__ == "__main__":
    asyncio.run(test_youtube_detailed())
