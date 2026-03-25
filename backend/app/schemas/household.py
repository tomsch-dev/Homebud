import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class HouseholdCreate(BaseModel):
    name: str


class HouseholdMemberOut(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: str
    joined_at: datetime
    model_config = {"from_attributes": True}


class HouseholdOut(BaseModel):
    id: uuid.UUID
    name: str
    invite_code: str
    created_at: datetime
    members: List[HouseholdMemberOut] = []
    share_food_items: bool = True
    share_grocery_trips: bool = False
    share_eating_out: bool = False
    share_subscriptions: bool = False
    share_recipes: bool = False
    share_shopping_list: bool = True
    share_calendar: bool = True
    model_config = {"from_attributes": True}


class JoinHouseholdRequest(BaseModel):
    invite_code: str


class HouseholdSettingsUpdate(BaseModel):
    share_food_items: Optional[bool] = None
    share_grocery_trips: Optional[bool] = None
    share_eating_out: Optional[bool] = None
    share_subscriptions: Optional[bool] = None
    share_recipes: Optional[bool] = None
    share_shopping_list: Optional[bool] = None
    share_calendar: Optional[bool] = None
