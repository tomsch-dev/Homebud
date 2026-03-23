import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.household import Household, HouseholdMember
from app.models.food_item import FoodItem
from app.models.user import User
from app.schemas.household import HouseholdCreate, HouseholdOut, HouseholdMemberOut, JoinHouseholdRequest, HouseholdSettingsUpdate

router = APIRouter(prefix="/households", tags=["households"])


def _household_to_out(h: Household) -> HouseholdOut:
    return HouseholdOut(
        id=h.id,
        name=h.name,
        invite_code=h.invite_code,
        created_at=h.created_at,
        members=[
            HouseholdMemberOut(
                user_id=m.user_id,
                name=m.user.name,
                email=m.user.email,
                avatar=m.user.avatar,
                role=m.role,
                joined_at=m.joined_at,
            )
            for m in h.members
        ],
        share_food_items=h.share_food_items,
        share_grocery_trips=h.share_grocery_trips,
        share_eating_out=h.share_eating_out,
        share_subscriptions=h.share_subscriptions,
        share_recipes=h.share_recipes,
        share_shopping_list=h.share_shopping_list,
    )


def get_user_household_id(user_id: str, db: Session) -> Optional[str]:
    """Get the household ID for a user, or None."""
    member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    return member.household_id if member else None


@router.get("/my", response_model=Optional[HouseholdOut])
def get_my_household(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    if not member:
        return None
    return _household_to_out(member.household)


@router.post("/", response_model=HouseholdOut, status_code=201)
def create_household(
    data: HouseholdCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Check user doesn't already belong to a household
    existing = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in a household")

    household = Household(
        name=data.name,
        invite_code=secrets.token_urlsafe(16),
    )
    db.add(household)
    db.flush()

    member = HouseholdMember(user_id=user_id, household_id=household.id, role="owner")
    db.add(member)
    # Migrate user's existing food items to the new household
    db.query(FoodItem).filter(
        FoodItem.user_id == user_id, FoodItem.household_id.is_(None)
    ).update({"household_id": household.id})
    db.commit()
    db.refresh(household)
    return _household_to_out(household)


@router.post("/join", response_model=HouseholdOut)
def join_household(
    data: JoinHouseholdRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    existing = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in a household")

    household = db.query(Household).filter(Household.invite_code == data.invite_code).first()
    if not household:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    member = HouseholdMember(user_id=user_id, household_id=household.id, role="member")
    db.add(member)
    # Migrate user's existing food items to the household they're joining
    db.query(FoodItem).filter(
        FoodItem.user_id == user_id, FoodItem.household_id.is_(None)
    ).update({"household_id": household.id})
    db.commit()
    db.refresh(household)
    return _household_to_out(household)


@router.post("/leave", status_code=204)
def leave_household(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Not in a household")

    # If owner and sole member, delete the household
    household = member.household
    if member.role == "owner" and len(household.members) == 1:
        db.delete(household)
    elif member.role == "owner":
        # Transfer ownership to next member
        next_member = next(m for m in household.members if m.user_id != user_id)
        next_member.role = "owner"
        db.delete(member)
    else:
        db.delete(member)

    db.commit()


@router.post("/regenerate-invite", response_model=HouseholdOut)
def regenerate_invite(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    member = db.query(HouseholdMember).filter(
        HouseholdMember.user_id == user_id, HouseholdMember.role == "owner"
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Only the owner can regenerate invites")

    member.household.invite_code = secrets.token_urlsafe(16)
    db.commit()
    db.refresh(member.household)
    return _household_to_out(member.household)


@router.patch("/settings", response_model=HouseholdOut)
def update_household_settings(
    data: HouseholdSettingsUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Not in a household")

    household = member.household
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(household, field, value)
    db.commit()
    db.refresh(household)
    return _household_to_out(household)
