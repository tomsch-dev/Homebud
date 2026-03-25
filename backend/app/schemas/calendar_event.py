import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[str] = None  # HH:MM
    end_time: Optional[str] = None
    all_day: bool = True
    color: str = "emerald"


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    all_day: Optional[bool] = None
    color: Optional[str] = None


class CalendarEventOut(BaseModel):
    id: uuid.UUID
    user_id: str
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    all_day: bool
    color: str
    created_at: datetime
    model_config = {"from_attributes": True}
