from sqlalchemy.orm import Session

from app.models.household import HouseholdMember, Household


def get_visible_user_ids(user_id: str, share_field: str, db: Session) -> list[str]:
    """Get list of user IDs whose data should be visible (self + household if shared)."""
    member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).first()
    if not member:
        return [user_id]
    household = db.query(Household).filter(Household.id == member.household_id).first()
    if not household or not getattr(household, share_field, False):
        return [user_id]
    # Get all household member user IDs
    members = db.query(HouseholdMember.user_id).filter(
        HouseholdMember.household_id == member.household_id
    ).all()
    return [m.user_id for m in members]
