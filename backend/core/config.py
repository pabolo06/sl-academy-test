"""
SL Academy Platform - Configuration Management
Loads and validates environment variables using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Supabase Configuration (Obrigatórios em produção, mas com defaults para evitar crash no build)
    supabase_url: str = Field(default="https://placeholder.supabase.co", env="SUPABASE_URL")
    supabase_anon_key: str = Field(default="placeholder", env="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(default="placeholder", env="SUPABASE_SERVICE_KEY")
    
    # Database
    database_url: str = Field(default="postgresql://localhost", env="DATABASE_URL")
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_reload: bool = Field(default=False, env="API_RELOAD")
    
    # CORS Configuration — valor bruto separado por vírgulas, use cors_origins_list para obter a lista
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001,https://sl-academy.vercel.app",
        env="CORS_ORIGINS"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Retorna a lista de origens CORS parseada."""
        if not self.cors_origins:
            return ["http://localhost:3000"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
    
    # Session Configuration
    session_secret_key: str = Field(default="temporary_secret_key_change_me_in_production_32_chars", env="SESSION_SECRET_KEY")
    
    # AI Configuration (OpenAI)
    openai_api_key: str = Field(default="sk-placeholder", env="OPENAI_API_KEY")
    ai_model: str = Field(default="gpt-4-turbo-preview", env="AI_MODEL")
    
    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Frontend URLs by domain
    doctor_frontend_url: str = Field(default="http://localhost:3000", env="DOCTOR_FRONTEND_URL")
    manager_frontend_url: str = Field(default="http://localhost:3001", env="MANAGER_FRONTEND_URL")

    # Redis / Cache
    redis_url: str = Field(default="", env="REDIS_URL")
    cache_ttl_default: int = Field(default=300, env="CACHE_TTL_DEFAULT")
    cache_ttl_lessons: int = Field(default=600, env="CACHE_TTL_LESSONS")
    cache_ttl_indicators: int = Field(default=300, env="CACHE_TTL_INDICATORS")
    cache_ttl_profile: int = Field(default=900, env="CACHE_TTL_PROFILE")

    # Scoring
    scoring_pass_threshold: float = Field(default=70.0, env="SCORING_PASS_THRESHOLD")

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
