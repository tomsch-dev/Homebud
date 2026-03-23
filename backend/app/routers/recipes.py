import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.recipe import Recipe, RecipeIngredient, RecipeStep
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeOut
from app.utils.household import get_visible_user_ids

router = APIRouter(prefix="/recipes", tags=["recipes"])


def _apply_ingredients_steps(recipe: Recipe, data: RecipeCreate | RecipeUpdate, db: Session):
    if data.ingredients is not None:
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
        for ing in data.ingredients:
            db.add(RecipeIngredient(recipe_id=recipe.id, **ing.model_dump()))
    if data.steps is not None:
        db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe.id).delete()
        for step in data.steps:
            db.add(RecipeStep(recipe_id=recipe.id, **step.model_dump()))


@router.get("/", response_model=List[RecipeOut])
def list_recipes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user_ids = get_visible_user_ids(user_id, "share_recipes", db)
    return (
        db.query(Recipe)
        .filter(Recipe.user_id.in_(user_ids))
        .order_by(Recipe.created_at.desc())
        .all()
    )


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(
    recipe_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == user_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.post("/", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(
    data: RecipeCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    recipe = Recipe(
        user_id=user_id,
        name=data.name,
        description=data.description,
        servings=data.servings,
        prep_time_min=data.prep_time_min,
        cook_time_min=data.cook_time_min,
        is_ai_generated=data.is_ai_generated,
    )
    db.add(recipe)
    db.flush()
    _apply_ingredients_steps(recipe, data, db)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.patch("/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    recipe_id: uuid.UUID,
    data: RecipeUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == user_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    for field, value in data.model_dump(exclude_unset=True, exclude={"ingredients", "steps"}).items():
        setattr(recipe, field, value)
    _apply_ingredients_steps(recipe, data, db)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == user_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
