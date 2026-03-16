from typing import Optional
from sqlalchemy import String, Float, Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FoodData(Base):
    """Food nutrition data, cached from USDA FoodData Central API."""
    __tablename__ = "food_data"

    api_food_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    slug: Mapped[str] = mapped_column(Text, nullable=False, default="")
    display_name: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    canonical_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    is_fast_food: Mapped[bool] = mapped_column(Boolean, default=False)

    # Nutrition per 100g
    calories_kcal: Mapped[Optional[float]] = mapped_column(Float)
    protein_g: Mapped[Optional[float]] = mapped_column(Float)
    carbs_g: Mapped[Optional[float]] = mapped_column(Float)
    sugars_g: Mapped[Optional[float]] = mapped_column(Float)
    fiber_g: Mapped[Optional[float]] = mapped_column(Float)
    fat_g: Mapped[Optional[float]] = mapped_column(Float)
    saturated_fat_g: Mapped[Optional[float]] = mapped_column(Float)
    sodium_mg: Mapped[Optional[float]] = mapped_column(Float)
    cholesterol_mg: Mapped[Optional[float]] = mapped_column(Float)

    quality_score: Mapped[Optional[int]] = mapped_column(Integer)

    # Data source: "usda" for API-cached entries
    source: Mapped[str] = mapped_column(String(20), default="usda", server_default="usda")
    # USDA FDC ID for dedup and detail lookups
    fdc_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, index=True)
