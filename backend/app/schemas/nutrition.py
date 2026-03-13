import uuid
from datetime import datetime
from pydantic import BaseModel


class NutritionOut(BaseModel):
    id: uuid.UUID
    food_item_id: uuid.UUID
    serving_size_g: float
    calories: float
    fat_total_g: float
    fat_saturated_g: float
    protein_g: float
    sodium_mg: float
    potassium_mg: float
    cholesterol_mg: float
    carbohydrates_total_g: float
    fiber_g: float
    sugar_g: float
    fetched_at: datetime
    model_config = {"from_attributes": True}
