import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.food_item import FoodItem
from app.schemas.food_item import FoodItemCreate, FoodItemUpdate, FoodItemOut

router = APIRouter(prefix="/food-items", tags=["food-items"])


@router.get("/", response_model=List[FoodItemOut])
def list_food_items(db: Session = Depends(get_db)):
    return db.query(FoodItem).order_by(FoodItem.created_at.desc()).all()


@router.get("/{item_id}", response_model=FoodItemOut)
def get_food_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.get(FoodItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return item


@router.post("/", response_model=FoodItemOut, status_code=status.HTTP_201_CREATED)
def create_food_item(data: FoodItemCreate, db: Session = Depends(get_db)):
    item = FoodItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=FoodItemOut)
def update_food_item(item_id: uuid.UUID, data: FoodItemUpdate, db: Session = Depends(get_db)):
    item = db.get(FoodItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.get(FoodItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(item)
    db.commit()
