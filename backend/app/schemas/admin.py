from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel


class AdminUserOut(BaseModel):
    id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    roles: List[str] = []
    is_suspended: bool = False
    model_config = {"from_attributes": True}


class RoleToggleRequest(BaseModel):
    role: str
    action: Literal["grant", "revoke"]


class SuspendRequest(BaseModel):
    suspended: bool


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
