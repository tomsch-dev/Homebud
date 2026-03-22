from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    roles: List[str] = []
    household_id: Optional[str] = None
    preferred_currency: str = "EUR"
    tos_accepted_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class UserUpsert(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    preferred_currency: Optional[str] = None
