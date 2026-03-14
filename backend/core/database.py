"""
SL Academy Platform - Database Connection
Manages Supabase client connection
"""

from supabase import create_client, Client
from .config import settings


class Database:
    """Supabase database client wrapper"""
    
    _client: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance"""
        if cls._client is None:
            cls._client = create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
        return cls._client
    
    @classmethod
    def get_anon_client(cls) -> Client:
        """Get Supabase client with anon key (for public operations)"""
        return create_client(
            settings.supabase_url,
            settings.supabase_anon_key
        )


# Convenience function
def get_db() -> Client:
    """Dependency injection for database client"""
    return Database.get_client()
