from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    """Returns a Supabase client configured with current .env settings."""
    url = settings.SUPABASE_URL.rstrip('/')
    if url.endswith('/rest/v1'):
        url = url[:-8].rstrip('/')

    key = settings.SUPABASE_KEY

    if not url or not key:
        raise RuntimeError(
            "Supabase is not configured. "
            "Please set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )

    return create_client(url, key)
