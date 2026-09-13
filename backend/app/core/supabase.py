import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client, ClientOptions
from app.core.config import settings

logger = logging.getLogger("prism.supabase")


def get_supabase_client(token: Optional[str] = None) -> Client:
    """Create a Supabase client.
    
    If a user token is provided, it configures the client with the user's
    Bearer token for Row Level Security (RLS) enforcement.
    Otherwise, if SUPABASE_SERVICE_ROLE_KEY is set, it uses that for admin access.
    Otherwise, it uses the standard publishable/anon key.
    """
    url = settings.effective_supabase_url

    if token:
        options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
        return create_client(url, settings.effective_supabase_anon_key, options=options)

    if settings.SUPABASE_SERVICE_ROLE_KEY:
        return create_client(url, settings.SUPABASE_SERVICE_ROLE_KEY)

    return create_client(url, settings.effective_supabase_anon_key)


def get_admin_supabase_client() -> Client:
    """Return an admin/service-role Supabase client if configured, or default client."""
    url = settings.effective_supabase_url
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.effective_supabase_anon_key
    return create_client(url, key)


def verify_user_token(token: str) -> Dict[str, Any]:
    """Verify a Supabase Auth JWT token and retrieve the user record.
    
    Raises:
        ValueError: If token verification fails or user is not found.
    """
    if not token or not token.strip():
        raise ValueError("Authentication token is missing or empty")

    url = settings.effective_supabase_url
    anon_key = settings.effective_supabase_anon_key

    # Initialize a base client to verify auth token
    client = create_client(url, anon_key)
    try:
        response = client.auth.get_user(token.strip())
        if not response or not response.user:
            raise ValueError("Invalid or expired session token")

        user = response.user
        return {
            "id": user.id,
            "email": getattr(user, "email", None),
            "role": getattr(user, "role", "authenticated"),
            "user_metadata": getattr(user, "user_metadata", {}),
        }
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise ValueError(f"Authentication failed: {exc}") from exc
