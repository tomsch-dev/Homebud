from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.user import User, UserRole, Role
from app.models.household import HouseholdMember
from app.schemas.user import UserOut, UserUpsert

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        # Auto-create on first login
        user = User(id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)

    roles = [ur.role.name for ur in user.user_roles]
    hh_member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        created_at=user.created_at,
        roles=roles,
        household_id=str(hh_member.household_id) if hh_member else None,
        preferred_currency=user.preferred_currency or "EUR",
    )


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpsert,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        user = User(id=user_id)
        db.add(user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    roles = [ur.role.name for ur in user.user_roles]
    hh_member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    return UserOut(id=user.id, email=user.email, name=user.name, avatar=user.avatar,
                   created_at=user.created_at, roles=roles,
                   household_id=str(hh_member.household_id) if hh_member else None,
                   preferred_currency=user.preferred_currency or "EUR")
