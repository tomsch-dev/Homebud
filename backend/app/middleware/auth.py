from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import httpx
import time

from app.config import settings
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)

# Cached JWKS with TTL
_jwks_cache: Optional[dict] = None
_jwks_cache_time: float = 0

# Cached M2M token
_m2m_token: Optional[str] = None
_m2m_token_expiry: float = 0


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_cache_time
    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < 3600:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{settings.logto_endpoint}/oidc/jwks")
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_cache_time = now
        return _jwks_cache


async def get_m2m_token() -> Optional[str]:
    """Get a Management API access token using M2M app credentials."""
    global _m2m_token, _m2m_token_expiry
    now = time.time()
    if _m2m_token and now < _m2m_token_expiry - 60:
        return _m2m_token

    if not settings.logto_m2m_app_id or not settings.logto_m2m_app_secret:
        return None

    resource = settings.logto_management_api_resource or "https://default.logto.app/api"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.logto_endpoint}/oidc/token",
                data={
                    "grant_type": "client_credentials",
                    "resource": resource,
                    "scope": "all",
                },
                auth=(settings.logto_m2m_app_id, settings.logto_m2m_app_secret),
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            _m2m_token = data["access_token"]
            _m2m_token_expiry = now + data.get("expires_in", 3600)
            return _m2m_token
    except Exception:
        return None


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    """
    Validates the Logto JWT and returns the user's sub claim.
    In dev mode (LOGTO_ENDPOINT not set), returns 'dev-user' without checking the token.
    """
    if not settings.logto_endpoint:
        return "dev-user"

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        audience = settings.logto_api_resource or settings.logto_app_id
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256", "ES384"],
            audience=audience,
            issuer=f"{settings.logto_endpoint}/oidc",
        )
        return payload["sub"]
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")


def _check_role(user_id: str, role_name: str, db: Session) -> str:
    """Check that the user has the given role in the local DB."""
    if not settings.logto_endpoint:
        return user_id

    from app.models.user import User

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found")

    roles = {ur.role.name for ur in user.user_roles}
    if role_name not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{role_name.title()} access required",
        )
    return user_id


async def require_premium(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> str:
    return _check_role(user_id, "premium", db)


async def require_admin(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> str:
    return _check_role(user_id, "admin", db)
