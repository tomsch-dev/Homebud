from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.food_item import FoodItem
from app.models.recipe import Recipe, RecipeIngredient, RecipeStep
from app.schemas.recipe import RecipeOut
from app.services.ai_service import get_recipe_recommendations

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/recommend")
async def recommend_recipes(db: Session = Depends(get_db)):
    items = db.query(FoodItem).order_by(FoodItem.expiry_date.asc().nullslast()).all()
    if not items:
        raise HTTPException(status_code=400, detail="No food items in kitchen")

    fridge_lines = []
    for item in items:
        expiry = f" (expires {item.expiry_date})" if item.expiry_date else ""
        fridge_lines.append(f"- {item.quantity} {item.unit} of {item.name}{expiry}")
    fridge_contents = "\n".join(fridge_lines)

    try:
        recipes = await get_recipe_recommendations(fridge_contents)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    return {"recommendations": recipes}


@router.post("/recommend/save", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def save_recommendation(data: dict, db: Session = Depends(get_db)):
    recipe = Recipe(
        name=data["name"],
        description=data.get("description"),
        servings=data.get("servings", 1),
        prep_time_min=data.get("prepTimeMin") or data.get("prep_time_min"),
        cook_time_min=data.get("cookTimeMin") or data.get("cook_time_min"),
        is_ai_generated=True,
    )
    db.add(recipe)
    db.flush()

    for ing in data.get("ingredients", []):
        db.add(RecipeIngredient(
            recipe_id=recipe.id,
            name=ing["name"],
            quantity=ing["quantity"],
            unit=ing["unit"],
        ))
    for step in data.get("steps", []):
        db.add(RecipeStep(
            recipe_id=recipe.id,
            step_number=step.get("stepNumber") or step.get("step_number", 1),
            instruction=step["instruction"],
        ))

    db.commit()
    db.refresh(recipe)
    return recipe
