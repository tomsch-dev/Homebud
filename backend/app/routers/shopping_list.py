import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shopping_list import ShoppingListItem
from app.models.grocery import GroceryTripItem
from app.models.food_item import FoodItem
from app.schemas.shopping_list import (
    ShoppingListItemCreate, ShoppingListItemUpdate,
    ShoppingListItemOut, SuggestionOut,
)

router = APIRouter(prefix="/shopping-list", tags=["shopping-list"])


@router.get("/", response_model=List[ShoppingListItemOut])
def list_items(db: Session = Depends(get_db)):
    return (
        db.query(ShoppingListItem)
        .order_by(ShoppingListItem.checked, ShoppingListItem.created_at.desc())
        .all()
    )


@router.post("/", response_model=ShoppingListItemOut, status_code=status.HTTP_201_CREATED)
def create_item(data: ShoppingListItemCreate, db: Session = Depends(get_db)):
    item = ShoppingListItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ShoppingListItemOut)
def update_item(item_id: uuid.UUID, data: ShoppingListItemUpdate, db: Session = Depends(get_db)):
    item = db.get(ShoppingListItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.get(ShoppingListItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_checked(db: Session = Depends(get_db)):
    db.query(ShoppingListItem).filter(ShoppingListItem.checked == True).delete()
    db.commit()


@router.get("/suggestions", response_model=List[SuggestionOut])
def get_suggestions(db: Session = Depends(get_db)):
    """Suggest items based on grocery trip history frequency."""
    # Count how often each item name appears in grocery trips
    grocery_freq = (
        db.query(
            func.lower(GroceryTripItem.name).label("name"),
            func.count().label("freq"),
        )
        .group_by(func.lower(GroceryTripItem.name))
        .subquery()
    )

    results = (
        db.query(grocery_freq.c.name, grocery_freq.c.freq)
        .order_by(grocery_freq.c.freq.desc())
        .limit(20)
        .all()
    )

    # Try to match category from existing food items
    food_cats = {
        fi.name.lower(): fi.category
        for fi in db.query(FoodItem).all()
        if fi.category
    }

    return [
        SuggestionOut(
            name=row.name.title(),
            category=food_cats.get(row.name),
            frequency=row.freq,
        )
        for row in results
    ]
