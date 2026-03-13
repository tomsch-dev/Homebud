import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.food_item import FoodItem
from app.models.nutrition import Nutrition
from app.schemas.nutrition import NutritionOut
from app.services.nutrition_service import fetch_nutrition

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.post("/fetch/{food_item_id}", response_model=NutritionOut)
async def fetch_and_save_nutrition(food_item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.get(FoodItem, food_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    try:
        data = await fetch_nutrition(item.name, item.quantity, item.unit)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to reach nutrition API")

    nutrition = db.query(Nutrition).filter(Nutrition.food_item_id == food_item_id).first()
    if nutrition:
        for k, v in data.items():
            setattr(nutrition, k, v)
    else:
        nutrition = Nutrition(food_item_id=food_item_id, **data)
        db.add(nutrition)

    db.commit()
    db.refresh(nutrition)
    return nutrition


@router.get("/{food_item_id}", response_model=NutritionOut)
def get_nutrition(food_item_id: uuid.UUID, db: Session = Depends(get_db)):
    nutrition = db.query(Nutrition).filter(Nutrition.food_item_id == food_item_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="No nutrition data stored for this item")
    return nutrition
