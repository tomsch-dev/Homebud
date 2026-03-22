from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    name: str
    amount: float
    currency: str = "EUR"
    billing_cycle: str = "monthly"
    category: str = "other"
    next_billing_date: Optional[date] = None
    notes: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    category: Optional[str] = None
    next_billing_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class SubscriptionOut(BaseModel):
    id: str
    name: str
    amount: float
    currency: str
    billing_cycle: str
    category: str
    next_billing_date: Optional[date] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    monthly_cost: float  # computed: normalized to monthly

    model_config = {"from_attributes": True}
