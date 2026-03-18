
import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

async def find_doctor():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    supabase = create_client(url, key)
    
    # List a few users to find a doctor
    response = supabase.table("users").select("email, role").eq("role", "doctor").limit(1).execute()
    
    if response.data:
        print(f"Doctor found: {response.data[0]['email']}")
    else:
        # If no doctor, find any non-admin or list all roles
        all_users = supabase.table("users").select("email, role").limit(5).execute()
        print("No doctor found. Available users:")
        for u in all_users.data:
            print(f"Email: {u['email']}, Role: {u['role']}")

if __name__ == "__main__":
    asyncio.run(find_doctor())
