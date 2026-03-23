import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.grocery import GroceryTrip, GroceryTripItem
from app.schemas.grocery import GroceryTripCreate, GroceryTripUpdate, GroceryTripOut
from app.utils.household import get_visible_user_ids

router = APIRouter(prefix="/grocery-trips", tags=["grocery"])


def _apply_items(trip: GroceryTrip, items_data, db: Session):
    db.query(GroceryTripItem).filter(GroceryTripItem.trip_id == trip.id).delete()
    for item in items_data:
        d = item.model_dump()
        # total_price is already computed by the schema validator (qty * price - discount)
        db.add(GroceryTripItem(trip_id=trip.id, **d))


@router.get("/", response_model=List[GroceryTripOut])
def list_trips(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user_ids = get_visible_user_ids(user_id, "share_grocery_trips", db)
    return (
        db.query(GroceryTrip)
        .filter(GroceryTrip.user_id.in_(user_ids))
        .order_by(GroceryTrip.trip_date.desc())
        .all()
    )


@router.get("/{trip_id}", response_model=GroceryTripOut)
def get_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    trip = db.query(GroceryTrip).filter(GroceryTrip.id == trip_id, GroceryTrip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/", response_model=GroceryTripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    data: GroceryTripCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    trip = GroceryTrip(
        user_id=user_id,
        store_name=data.store_name,
        trip_date=data.trip_date,
        notes=data.notes,
        currency=data.currency,
        total_override=data.total_override,
    )
    db.add(trip)
    db.flush()
    _apply_items(trip, data.items, db)
    db.commit()
    db.refresh(trip)
    return trip


@router.patch("/{trip_id}", response_model=GroceryTripOut)
def update_trip(
    trip_id: uuid.UUID,
    data: GroceryTripUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    trip = db.query(GroceryTrip).filter(GroceryTrip.id == trip_id, GroceryTrip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for field, value in data.model_dump(exclude_unset=True, exclude={"items"}).items():
        setattr(trip, field, value)
    if data.items is not None:
        _apply_items(trip, data.items, db)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    trip = db.query(GroceryTrip).filter(GroceryTrip.id == trip_id, GroceryTrip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
