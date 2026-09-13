import logging
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import verify_user_token

logger = logging.getLogger("prism.auth")
security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Represents a verified Supabase authenticated user."""

    def __init__(self, user_data: Dict[str, Any], token: str):
        self.id: str = user_data["id"]
        self.email: Optional[str] = user_data.get("email")
        self.role: str = user_data.get("role", "authenticated")
        self.user_metadata: Dict[str, Any] = user_data.get("user_metadata", {})
        self.token: str = token

    def __repr__(self) -> str:
        return f"<AuthenticatedUser id={self.id} email={self.email}>"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthenticatedUser:
    """FastAPI dependency to authenticate requests using Supabase Bearer tokens."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()
    try:
        user_data = verify_user_token(token)
        return AuthenticatedUser(user_data=user_data, token=token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or unverified authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error during authentication: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication could not be completed.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
