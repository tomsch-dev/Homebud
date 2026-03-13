import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

from app.schemas.nutrition import NutritionOut


class FoodItemBase(BaseModel):
    name: str
    quantity: float
    unit: str
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    price_per_unit: Optional[float] = None
    price_currency: str = "EUR"


class FoodItemCreate(FoodItemBase):
    pass


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    price_per_unit: Optional[float] = None
    price_currency: Optional[str] = None


class FoodItemOut(FoodItemBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    nutrition: Optional[NutritionOut] = None
    model_config = {"from_attributes": True}
