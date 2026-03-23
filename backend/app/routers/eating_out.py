import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.eating_out import EatingOutExpense
from app.schemas.eating_out import EatingOutCreate, EatingOutUpdate, EatingOutOut
from app.utils.household import get_visible_user_ids

router = APIRouter(prefix="/eating-out", tags=["eating-out"])


@router.get("/", response_model=List[EatingOutOut])
def list_expenses(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user_ids = get_visible_user_ids(user_id, "share_eating_out", db)
    return (
        db.query(EatingOutExpense)
        .filter(EatingOutExpense.user_id.in_(user_ids))
        .order_by(EatingOutExpense.expense_date.desc())
        .all()
    )


@router.get("/{expense_id}", response_model=EatingOutOut)
def get_expense(
    expense_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    expense = db.query(EatingOutExpense).filter(
        EatingOutExpense.id == expense_id, EatingOutExpense.user_id == user_id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/", response_model=EatingOutOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: EatingOutCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    expense = EatingOutExpense(user_id=user_id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.patch("/{expense_id}", response_model=EatingOutOut)
def update_expense(
    expense_id: uuid.UUID,
    data: EatingOutUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    expense = db.query(EatingOutExpense).filter(
        EatingOutExpense.id == expense_id, EatingOutExpense.user_id == user_id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    expense = db.query(EatingOutExpense).filter(
        EatingOutExpense.id == expense_id, EatingOutExpense.user_id == user_id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
