import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ShoppingListItemCreate(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None


class ShoppingListItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    checked: Optional[bool] = None


class ShoppingListItemOut(BaseModel):
    id: uuid.UUID
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    checked: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class SuggestionOut(BaseModel):
    name: str
    category: Optional[str] = None
    frequency: int
