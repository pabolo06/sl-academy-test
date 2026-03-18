"""
Apply test helper functions migration for RLS testing
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    """Apply the test helper functions migration"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        return False
    
    client = create_client(url, key)
    
    # Read migration file
    migration_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "supabase",
        "migrations",
        "006_test_helper_functions.sql"
    )
    
    try:
        with open(migration_path, 'r') as f:
            sql = f.read()
        
        print(f"📄 Applying migration: 006_test_helper_functions.sql")
        
        # Execute the SQL
        result = client.rpc("exec_sql", {"sql": sql}).execute()
        
        print("✅ Migration applied successfully!")
        return True
    
    except FileNotFoundError:
        print(f"❌ Error: Migration file not found at {migration_path}")
        return False
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        print("\n💡 You may need to apply this migration manually through Supabase SQL Editor:")
        print(f"   1. Open Supabase Dashboard → SQL Editor")
        print(f"   2. Copy contents of: {migration_path}")
        print(f"   3. Execute the SQL")
        return False


if __name__ == "__main__":
    apply_migration()
