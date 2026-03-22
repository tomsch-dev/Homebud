import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionOut

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

CYCLE_MONTHLY_FACTOR = {
    "weekly": 52 / 12,
    "monthly": 1.0,
    "quarterly": 1 / 3,
    "yearly": 1 / 12,
}


def _to_out(sub: Subscription) -> SubscriptionOut:
    factor = CYCLE_MONTHLY_FACTOR.get(sub.billing_cycle, 1.0)
    return SubscriptionOut(
        id=str(sub.id),
        name=sub.name,
        amount=sub.amount,
        currency=sub.currency,
        billing_cycle=sub.billing_cycle,
        category=sub.category,
        next_billing_date=sub.next_billing_date,
        is_active=sub.is_active,
        notes=sub.notes,
        created_at=sub.created_at,
        monthly_cost=round(sub.amount * factor, 2),
    )


@router.get("/", response_model=List[SubscriptionOut])
def list_subscriptions(db: Session = Depends(get_db)):
    subs = db.query(Subscription).order_by(Subscription.is_active.desc(), Subscription.name).all()
    return [_to_out(s) for s in subs]


@router.post("/", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
def create_subscription(data: SubscriptionCreate, db: Session = Depends(get_db)):
    sub = Subscription(**data.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _to_out(sub)


@router.patch("/{sub_id}", response_model=SubscriptionOut)
def update_subscription(sub_id: uuid.UUID, data: SubscriptionUpdate, db: Session = Depends(get_db)):
    sub = db.get(Subscription, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sub, field, value)
    db.commit()
    db.refresh(sub)
    return _to_out(sub)


@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(sub_id: uuid.UUID, db: Session = Depends(get_db)):
    sub = db.get(Subscription, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
