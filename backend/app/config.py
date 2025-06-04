from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    # AWS Configuration
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-west-2"
    s3_bucket_name: str
    
    # Database Configuration
    db_host: str
    db_name: str
    db_user: str
    db_password: str
    db_port: int = 5432
    
    # OpenAI Configuration
    openai_api_key: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings() 