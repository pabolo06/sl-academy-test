
import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import bcrypt

load_dotenv()

async def create_test_doctor():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    supabase = create_client(url, key)
    
    email = "medico@hospital.com"
    password = "SecurePass123!"
    
    # Hash password same as in auth.py
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Get a hospital_id from existing users or hospitals table
    hospitals = supabase.table("hospitals").select("id").limit(1).execute()
    if not hospitals.data:
        print("No hospitals found.")
        return
    
    hospital_id = hospitals.data[0]["id"]
    
    new_user = {
        "email": email,
        "password_hash": hashed_password,
        "full_name": "Dr. Fernando Medico",
        "role": "doctor",
        "hospital_id": hospital_id,
        "is_active": True
    }
    
    try:
        # Avoid filters that might trigger the deleted_at error
        response = supabase.table("users").insert(new_user).execute()
        print(f"Doctor user created: {email}")
        print(f"Password: {password}")
    except Exception as e:
        print(f"Failed to create doctor: {str(e)}")

if __name__ == "__main__":
    asyncio.run(create_test_doctor())
