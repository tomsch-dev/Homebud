from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.config import settings
from app.middleware.auth import require_admin, get_m2m_token
from app.models.user import User, Role, UserRole
from app.schemas.admin import AdminUserOut, RoleToggleRequest, SuspendRequest, AdminUserUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[AdminUserOut])
async def list_users(
    _admin_id: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            name=u.name,
            avatar=u.avatar,
            created_at=u.created_at,
            roles=[ur.role.name for ur in u.user_roles],
            is_suspended=u.is_suspended,
        )
        for u in users
    ]


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
async def toggle_user_role(
    user_id: str,
    body: RoleToggleRequest,
    _admin_id: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.action == "grant":
        role = db.query(Role).filter(Role.name == body.role).first()
        if not role:
            role = Role(name=body.role)
            db.add(role)
            db.flush()
        existing = (
            db.query(UserRole)
            .filter(UserRole.user_id == user_id, UserRole.role_id == role.id)
            .first()
        )
        if not existing:
            db.add(UserRole(user_id=user_id, role_id=role.id))
    elif body.action == "revoke":
        role = db.query(Role).filter(Role.name == body.role).first()
        if role:
            ur = (
                db.query(UserRole)
                .filter(UserRole.user_id == user_id, UserRole.role_id == role.id)
                .first()
            )
            if ur:
                db.delete(ur)

    db.commit()
    db.refresh(user)

    return AdminUserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        created_at=user.created_at,
        roles=[ur.role.name for ur in user.user_roles],
        is_suspended=user.is_suspended,
    )


@router.patch("/users/{user_id}/suspend", response_model=AdminUserOut)
async def toggle_user_suspension(
    user_id: str,
    body: SuspendRequest,
    _admin_id: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Call Logto Management API to suspend/unsuspend
    m2m_token = await get_m2m_token()
    if m2m_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.patch(
                    f"{settings.logto_endpoint}/api/users/{user_id}",
                    json={"isSuspended": body.suspended},
                    headers={"Authorization": f"Bearer {m2m_token}"},
                )
                if resp.status_code not in (200, 204):
                    raise HTTPException(
                        status_code=502,
                        detail=f"Logto API error: {resp.status_code}",
                    )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Logto API error: {e}")

    user.is_suspended = body.suspended
    db.commit()
    db.refresh(user)

    return AdminUserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        created_at=user.created_at,
        roles=[ur.role.name for ur in user.user_roles],
        is_suspended=user.is_suspended,
    )


@router.patch("/users/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: str,
    body: AdminUserUpdate,
    _admin_id: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return AdminUserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        created_at=user.created_at,
        roles=[ur.role.name for ur in user.user_roles],
        is_suspended=user.is_suspended,
    )


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    _admin_id: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Prevent deleting yourself
    if user_id == _admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    # Delete all user data
    from app.models.grocery import GroceryTrip
    from app.models.eating_out import EatingOutExpense
    from app.models.subscription import Subscription
    from app.models.recipe import Recipe
    from app.models.shopping_list import ShoppingListItem
    from app.models.food_item import FoodItem

    db.query(GroceryTrip).filter(GroceryTrip.user_id == user_id).delete()
    db.query(EatingOutExpense).filter(EatingOutExpense.user_id == user_id).delete()
    db.query(Subscription).filter(Subscription.user_id == user_id).delete()
    db.query(Recipe).filter(Recipe.user_id == user_id).delete()
    db.query(ShoppingListItem).filter(ShoppingListItem.user_id == user_id).delete()
    # Food items via household or direct
    db.query(FoodItem).filter(FoodItem.household_id.is_(None)).delete()  # orphaned items
    # The user model has cascade delete on user_roles and household_members
    db.delete(user)
    db.commit()
