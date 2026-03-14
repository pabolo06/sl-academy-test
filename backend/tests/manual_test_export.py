"""
Manual test script for user data export endpoint
Run this after starting the backend server to test the export functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_export_endpoint():
    """
    Manual test for the data export endpoint
    
    Prerequisites:
    1. Backend server must be running
    2. You must have a valid user account
    3. Update the credentials below with a test user
    """
    
    print("=" * 60)
    print("Testing User Data Export Endpoint")
    print("=" * 60)
    
    # Step 1: Login to get session cookie
    print("\n1. Logging in...")
    login_data = {
        "email": "test@example.com",  # Update with actual test user
        "password": "testpassword123"  # Update with actual password
    }
    
    session = requests.Session()
    
    try:
        login_response = session.post(
            f"{API_URL}/auth/login",
            json=login_data
        )
        
        if login_response.status_code == 200:
            print("✓ Login successful")
            user_data = login_response.json()
            print(f"  User: {user_data.get('user', {}).get('email')}")
            print(f"  Role: {user_data.get('user', {}).get('role')}")
        else:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"  Response: {login_response.text}")
            return
    except Exception as e:
        print(f"✗ Login error: {str(e)}")
        return
    
    # Step 2: Test the export endpoint
    print("\n2. Testing data export...")
    
    try:
        export_response = session.get(f"{API_URL}/auth/me/export")
        
        if export_response.status_code == 200:
            print("✓ Export successful")
            export_data = export_response.json()
            
            # Display summary
            print("\n" + "=" * 60)
            print("Export Summary")
            print("=" * 60)
            
            # Profile
            profile = export_data.get("profile", {})
            print(f"\nProfile:")
            print(f"  Name: {profile.get('full_name')}")
            print(f"  Role: {profile.get('role')}")
            print(f"  Hospital: {profile.get('hospital_name')}")
            print(f"  Focal Point: {profile.get('is_focal_point')}")
            
            # Test Attempts
            test_attempts = export_data.get("test_attempts", [])
            print(f"\nTest Attempts: {len(test_attempts)}")
            if test_attempts:
                print(f"  Latest: {test_attempts[0].get('lesson_title')} - Score: {test_attempts[0].get('score')}")
            
            # Doubts
            doubts = export_data.get("doubts", [])
            print(f"\nDoubts Submitted: {len(doubts)}")
            if doubts:
                print(f"  Latest: {doubts[0].get('lesson_title')} - Status: {doubts[0].get('status')}")
            
            # Video History
            video_history = export_data.get("video_history", [])
            print(f"\nVideos Watched: {len(video_history)}")
            if video_history:
                print(f"  Latest: {video_history[0].get('lesson_title')}")
            
            # Export Date
            export_date = export_data.get("export_date")
            print(f"\nExport Date: {export_date}")
            
            # Save to file
            filename = f"user_data_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            print(f"\n✓ Full export saved to: {filename}")
            
        else:
            print(f"✗ Export failed: {export_response.status_code}")
            print(f"  Response: {export_response.text}")
    except Exception as e:
        print(f"✗ Export error: {str(e)}")
    
    # Step 3: Test without authentication
    print("\n3. Testing without authentication...")
    
    try:
        unauth_session = requests.Session()
        unauth_response = unauth_session.get(f"{API_URL}/auth/me/export")
        
        if unauth_response.status_code == 401:
            print("✓ Correctly requires authentication (401)")
        else:
            print(f"✗ Unexpected status: {unauth_response.status_code}")
    except Exception as e:
        print(f"✗ Test error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)


if __name__ == "__main__":
    print("\nNOTE: Make sure to update the login credentials in this script")
    print("      with a valid test user before running.\n")
    
    response = input("Continue with test? (y/n): ")
    if response.lower() == 'y':
        test_export_endpoint()
    else:
        print("Test cancelled")
