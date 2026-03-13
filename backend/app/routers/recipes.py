import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recipe import Recipe, RecipeIngredient, RecipeStep
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeOut

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
def list_recipes(db: Session = Depends(get_db)):
    return db.query(Recipe).order_by(Recipe.created_at.desc()).all()


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: uuid.UUID, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.post("/", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(data: RecipeCreate, db: Session = Depends(get_db)):
    recipe = Recipe(
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
def update_recipe(recipe_id: uuid.UUID, data: RecipeUpdate, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    for field, value in data.model_dump(exclude_unset=True, exclude={"ingredients", "steps"}).items():
        setattr(recipe, field, value)
    _apply_ingredients_steps(recipe, data, db)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: uuid.UUID, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
