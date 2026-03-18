from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import httpx

from app.config import settings
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)

# Cached JWKS with TTL
_jwks_cache: Optional[dict] = None
_jwks_cache_time: float = 0


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_cache_time
    import time
    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < 3600:  # Cache for 1 hour
        return _jwks_cache
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{settings.logto_endpoint}/oidc/jwks")
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_cache_time = now
        return _jwks_cache


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
        # Use API resource as audience if configured, otherwise fall back to app_id
        audience = settings.logto_api_resource or settings.logto_app_id
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=audience,
            issuer=f"{settings.logto_endpoint}/oidc",
        )
        return payload["sub"]
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")


def _sync_roles_from_token(token: str, user_id: str, db: Session) -> None:
    """Sync roles from the JWT 'roles' claim into our DB."""
    try:
        # Decode without verification just to read claims (already verified above)
        payload = jwt.get_unverified_claims(token)
        token_roles = payload.get("roles", [])
        if not token_roles:
            return

        from app.models.user import User, Role, UserRole

        user = db.get(User, user_id)
        if not user:
            return

        existing_roles = {ur.role.name for ur in user.user_roles}

        for role_name in token_roles:
            if role_name in existing_roles:
                continue
            # Get or create the role
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
            db.add(UserRole(user_id=user_id, role_id=role.id))

        # Remove roles no longer in token
        for ur in list(user.user_roles):
            if ur.role.name not in token_roles:
                db.delete(ur)

        db.commit()
    except Exception:
        db.rollback()


async def get_current_user_with_roles(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> str:
    """Same as get_current_user_id but also syncs roles from the JWT."""
    user_id = await get_current_user_id(credentials)
    if settings.logto_endpoint and credentials:
        _sync_roles_from_token(credentials.credentials, user_id, db)
    return user_id


async def require_premium(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> str:
    """
    Validates that the current user has the 'premium' role.
    In dev mode, always grants premium access.
    """
    if not settings.logto_endpoint:
        return user_id

    from app.models.user import User

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found")

    roles = {ur.role.name for ur in user.user_roles}
    if "premium" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required",
        )
    return user_id
