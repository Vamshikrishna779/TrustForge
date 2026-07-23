import os
from pydantic_settings import BaseSettings

# In local dev: load from .env file if it exists.
# In production (HF Spaces): env vars are injected directly — no .env file needed.
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                val_clean = val.split("#", 1)[0].strip().strip('"').strip("'")
                # Don't overwrite values already set by the environment (HF Spaces secrets)
                if not os.environ.get(key.strip()):
                    os.environ[key.strip()] = val_clean

class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustForge"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trustforge.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
