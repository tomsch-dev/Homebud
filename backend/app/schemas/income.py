import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class IncomeCreate(BaseModel):
    amount: float
    currency: str = "EUR"
    source: str
    income_date: date
    is_recurring: bool = False
    frequency: Optional[str] = None
    notes: Optional[str] = None


class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = None
    source: Optional[str] = None
    income_date: Optional[date] = None
    is_recurring: Optional[bool] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None


class IncomeOut(BaseModel):
    id: uuid.UUID
    amount: float
    currency: str
    source: str
    income_date: date
    is_recurring: bool
    frequency: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
