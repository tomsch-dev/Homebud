from typing import Optional
from pydantic import BaseModel


class FoodDataOut(BaseModel):
    api_food_id: str
    display_name: str
    canonical_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_fast_food: bool = False

    calories_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    sugars_g: Optional[float] = None
    fiber_g: Optional[float] = None
    fat_g: Optional[float] = None
    saturated_fat_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    cholesterol_mg: Optional[float] = None
    quality_score: Optional[int] = None

    source: str = "usda"
    fdc_id: Optional[int] = None
    # True only when this result was just fetched from USDA (not from local cache)
    is_new: bool = False

    model_config = {"from_attributes": True}
