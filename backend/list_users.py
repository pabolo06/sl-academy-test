
import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

async def list_all_users():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    supabase = create_client(url, key)
    
    try:
        # Simple select without filters to avoid potential deleted_at trigger
        response = supabase.table("users").select("email, role, id").limit(10).execute()
        print("Users in DB:")
        for u in response.data:
            print(f"Email: {u['email']}, Role: {u['role']}")
    except Exception as e:
        print(f"Failed to list users: {str(e)}")

if __name__ == "__main__":
    asyncio.run(list_all_users())
