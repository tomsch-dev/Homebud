import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, model_validator


class GroceryTripItemIn(BaseModel):
    food_item_id: Optional[uuid.UUID] = None
    name: str
    quantity: float
    unit: str
    price_per_unit: float
    discount: float = 0.0
    currency: str = "EUR"

    @model_validator(mode="after")
    def compute_total(self):
        self.total_price = round(self.quantity * self.price_per_unit - self.discount, 4)
        return self

    total_price: float = 0.0


class GroceryTripItemOut(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    food_item_id: Optional[uuid.UUID] = None
    name: str
    quantity: float
    unit: str
    price_per_unit: float
    discount: float
    total_price: float
    currency: str
    model_config = {"from_attributes": True}


class GroceryTripCreate(BaseModel):
    store_name: str
    trip_date: date
    notes: Optional[str] = None
    currency: str = "EUR"
    items: List[GroceryTripItemIn] = []
    total_override: Optional[float] = None


class GroceryTripUpdate(BaseModel):
    store_name: Optional[str] = None
    trip_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[GroceryTripItemIn]] = None


class GroceryTripOut(BaseModel):
    id: uuid.UUID
    store_name: str
    trip_date: date
    notes: Optional[str] = None
    currency: str
    created_at: datetime
    items: List[GroceryTripItemOut]
    total_amount: float
    model_config = {"from_attributes": True}
