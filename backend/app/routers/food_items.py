import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.food_item import FoodItem
from app.models.nutrition import Nutrition
from app.models.food_data import FoodData
from app.schemas.food_item import FoodItemCreate, FoodItemUpdate, FoodItemOut

router = APIRouter(prefix="/food-items", tags=["food-items"])


def _sync_nutrition_from_food_data(db: Session, food_item_id: uuid.UUID, food_data_id: str):
    """Look up food_data by id and create/update the Nutrition record for this food item."""
    fd = db.get(FoodData, food_data_id)
    if not fd:
        return
    nutrition = db.query(Nutrition).filter(Nutrition.food_item_id == food_item_id).first()
    values = {
        "serving_size_g": 100,
        "calories": fd.calories_kcal or 0,
        "protein_g": fd.protein_g or 0,
        "fat_total_g": fd.fat_g or 0,
        "carbohydrates_total_g": fd.carbs_g or 0,
    }
    if nutrition:
        for k, v in values.items():
            setattr(nutrition, k, v)
    else:
        nutrition = Nutrition(food_item_id=food_item_id, **values)
        db.add(nutrition)


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
    # Check for existing item with the same name and unit — merge by adding quantity
    existing = (
        db.query(FoodItem)
        .filter(
            func.lower(FoodItem.name) == data.name.lower(),
            FoodItem.unit == data.unit,
        )
        .first()
    )
    if existing:
        existing.quantity += data.quantity
        # Update expiry to the latest date if provided
        if data.expiry_date and (not existing.expiry_date or data.expiry_date > existing.expiry_date):
            existing.expiry_date = data.expiry_date
        if data.food_data_id and not existing.nutrition:
            _sync_nutrition_from_food_data(db, existing.id, data.food_data_id)
        db.commit()
        db.refresh(existing)
        return existing

    item_data = data.model_dump(exclude={"food_data_id"})
    item = FoodItem(**item_data)
    db.add(item)
    db.flush()
    if data.food_data_id:
        _sync_nutrition_from_food_data(db, item.id, data.food_data_id)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=FoodItemOut)
def update_food_item(item_id: uuid.UUID, data: FoodItemUpdate, db: Session = Depends(get_db)):
    item = db.get(FoodItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    update_data = data.model_dump(exclude_unset=True, exclude={"food_data_id"})
    for field, value in update_data.items():
        setattr(item, field, value)
    if data.food_data_id:
        _sync_nutrition_from_food_data(db, item.id, data.food_data_id)
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
