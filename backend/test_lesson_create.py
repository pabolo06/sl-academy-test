"""
Test lesson creation directly
"""
import requests
import json

# Test data
lesson_data = {
    "track_id": "550e8400-e29b-41d4-a716-446655440000",  # Replace with actual track ID
    "title": "teste teste",
    "description": "Descrição da aula",
    "video_url": "https://www.youtube.com/watch?v=L3MyjjnlwH0",
    "duration_seconds": 1276,
    "order": 0
}

print("Testing lesson creation...")
print(f"Data: {json.dumps(lesson_data, indent=2)}")

# Make request
response = requests.post(
    "http://localhost:8000/api/lessons",
    json=lesson_data,
    headers={"Content-Type": "application/json"}
)

print(f"\nStatus Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code != 201:
    print("\n❌ Failed to create lesson")
    try:
        error_data = response.json()
        print(f"Error details: {json.dumps(error_data, indent=2)}")
    except:
        pass
else:
    print("\n✅ Lesson created successfully")
