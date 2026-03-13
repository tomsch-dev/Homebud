import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

MEAL_TYPES = ["breakfast", "lunch", "dinner", "coffee", "snack", "other"]


class EatingOutCreate(BaseModel):
    restaurant_name: str
    expense_date: date
    amount: float
    currency: str = "EUR"
    meal_type: str = "other"
    notes: Optional[str] = None


class EatingOutUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    expense_date: Optional[date] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    meal_type: Optional[str] = None
    notes: Optional[str] = None


class EatingOutOut(BaseModel):
    id: uuid.UUID
    restaurant_name: str
    expense_date: date
    amount: float
    currency: str
    meal_type: str
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
