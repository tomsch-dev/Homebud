from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

# Cached JWKS
_jwks_cache: Optional[dict] = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.logto_endpoint}/oidc/jwks")
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    """
    Validates the Logto JWT and returns the user's sub claim.
    In dev mode (LOGTO_ENDPOINT not set), returns 'dev-user' without checking the token.
    """
    if not settings.logto_endpoint:
        # Dev mode — no auth required
        return "dev-user"

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        # jose expects a key list
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.logto_app_id,
            issuer=f"{settings.logto_endpoint}/oidc",
        )
        return payload["sub"]
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")
