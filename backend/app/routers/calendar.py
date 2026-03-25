import uuid
from datetime import date, time as dt_time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEventOut
from app.utils.household import get_visible_user_ids

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _parse_time(t: Optional[str]) -> Optional[dt_time]:
    if not t:
        return None
    parts = t.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _format_time(t: Optional[dt_time]) -> Optional[str]:
    if not t:
        return None
    return t.strftime("%H:%M")


@router.get("/", response_model=List[CalendarEventOut])
def list_events(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user_ids = get_visible_user_ids(user_id, "share_calendar", db)
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id.in_(user_ids))
    if start:
        query = query.filter(CalendarEvent.event_date >= start)
    if end:
        query = query.filter(CalendarEvent.event_date <= end)
    events = query.order_by(CalendarEvent.event_date, CalendarEvent.start_time).all()
    # Convert time objects to strings for response
    result = []
    for e in events:
        out = CalendarEventOut.model_validate(e)
        out.start_time = _format_time(e.start_time)
        out.end_time = _format_time(e.end_time)
        result.append(out)
    return result


@router.post("/", response_model=CalendarEventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    data: CalendarEventCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    event = CalendarEvent(
        user_id=user_id,
        title=data.title,
        description=data.description,
        event_date=data.event_date,
        start_time=_parse_time(data.start_time),
        end_time=_parse_time(data.end_time),
        all_day=data.all_day,
        color=data.color,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    out = CalendarEventOut.model_validate(event)
    out.start_time = _format_time(event.start_time)
    out.end_time = _format_time(event.end_time)
    return out


@router.patch("/{event_id}", response_model=CalendarEventOut)
def update_event(
    event_id: uuid.UUID,
    data: CalendarEventUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    updates = data.model_dump(exclude_unset=True)
    if "start_time" in updates:
        updates["start_time"] = _parse_time(updates["start_time"])
    if "end_time" in updates:
        updates["end_time"] = _parse_time(updates["end_time"])
    for field, value in updates.items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    out = CalendarEventOut.model_validate(event)
    out.start_time = _format_time(event.start_time)
    out.end_time = _format_time(event.end_time)
    return out


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
