import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeOut
from app.utils.household import get_visible_user_ids

router = APIRouter(prefix="/income", tags=["income"])


@router.get("/", response_model=List[IncomeOut])
def list_income(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user_ids = get_visible_user_ids(user_id, "share_subscriptions", db)
    return (
        db.query(Income)
        .filter(Income.user_id.in_(user_ids))
        .order_by(Income.income_date.desc())
        .all()
    )


@router.post("/", response_model=IncomeOut, status_code=status.HTTP_201_CREATED)
def create_income(
    data: IncomeCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    income = Income(user_id=user_id, **data.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.patch("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: uuid.UUID,
    data: IncomeUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(income, field, value)
    db.commit()
    db.refresh(income)
    return income


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(income)
    db.commit()
