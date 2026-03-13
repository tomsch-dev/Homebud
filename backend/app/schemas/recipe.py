import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class RecipeIngredientIn(BaseModel):
    food_item_id: Optional[uuid.UUID] = None
    name: str
    quantity: float
    unit: str


class RecipeIngredientOut(RecipeIngredientIn):
    id: uuid.UUID
    recipe_id: uuid.UUID
    model_config = {"from_attributes": True}


class RecipeStepIn(BaseModel):
    step_number: int
    instruction: str


class RecipeStepOut(RecipeStepIn):
    id: uuid.UUID
    recipe_id: uuid.UUID
    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    servings: int = 1
    prep_time_min: Optional[int] = None
    cook_time_min: Optional[int] = None
    is_ai_generated: bool = False
    ingredients: List[RecipeIngredientIn]
    steps: List[RecipeStepIn]


class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    servings: Optional[int] = None
    prep_time_min: Optional[int] = None
    cook_time_min: Optional[int] = None
    ingredients: Optional[List[RecipeIngredientIn]] = None
    steps: Optional[List[RecipeStepIn]] = None


class RecipeOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    servings: int
    prep_time_min: Optional[int] = None
    cook_time_min: Optional[int] = None
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime
    ingredients: List[RecipeIngredientOut]
    steps: List[RecipeStepOut]
    model_config = {"from_attributes": True}
