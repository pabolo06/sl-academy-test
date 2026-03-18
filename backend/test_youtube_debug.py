"""
Debug script for YouTube scraping
"""
import asyncio
import httpx
import re
import json

async def test_youtube_scraping():
    video_id = "54Pyv4TGO_w"
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    print(f"Fetching: {url}")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0, follow_redirects=True)
        
        print(f"Status code: {response.status_code}")
        print(f"Content length: {len(response.text)}")
        
        # Try to find ytInitialPlayerResponse
        pattern = r'var ytInitialPlayerResponse = ({.*?});'
        match = re.search(pattern, response.text)
        
        if match:
            print("✅ Found ytInitialPlayerResponse")
            try:
                data = json.loads(match.group(1))
                video_details = data.get('videoDetails', {})
                duration = video_details.get('lengthSeconds')
                title = video_details.get('title')
                
                print(f"Duration: {duration} seconds")
                print(f"Title: {title}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
        else:
            print("❌ ytInitialPlayerResponse not found")
            
            # Try alternative pattern
            alt_pattern = r'ytInitialPlayerResponse\s*=\s*({.*?});'
            alt_match = re.search(alt_pattern, response.text)
            if alt_match:
                print("✅ Found alternative pattern")
            else:
                print("❌ Alternative pattern also not found")
                
                # Save HTML for inspection
                with open('youtube_page.html', 'w', encoding='utf-8') as f:
                    f.write(response.text)
                print("Saved HTML to youtube_page.html for inspection")

if __name__ == "__main__":
    asyncio.run(test_youtube_scraping())
