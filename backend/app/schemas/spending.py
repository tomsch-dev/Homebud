from datetime import date
from typing import List
from pydantic import BaseModel


class WeeklyBreakdown(BaseModel):
    week_start: date
    week_end: date
    grocery_total: float
    eating_out_total: float
    total: float
    currency: str


class SpendingSummary(BaseModel):
    period_start: date
    period_end: date
    grocery_total: float
    eating_out_total: float
    subscription_total: float = 0.0
    total: float
    currency: str
    weekly_breakdown: List[WeeklyBreakdown]
    top_stores: List[dict]
    top_restaurants: List[dict]
