import uuid
from datetime import datetime
from pydantic import BaseModel


class NutritionOut(BaseModel):
    id: uuid.UUID
    food_item_id: uuid.UUID
    serving_size_g: float
    calories: float
    protein_g: float
    fat_total_g: float
    carbohydrates_total_g: float
    fetched_at: datetime
    model_config = {"from_attributes": True}
