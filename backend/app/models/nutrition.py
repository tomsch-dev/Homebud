import uuid
from datetime import datetime
from sqlalchemy import Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Nutrition(Base):
    __tablename__ = "nutrition"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    food_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("food_items.id", ondelete="CASCADE"), unique=True)

    serving_size_g: Mapped[float] = mapped_column(Float, default=0)
    calories: Mapped[float] = mapped_column(Float, default=0)
    fat_total_g: Mapped[float] = mapped_column(Float, default=0)
    fat_saturated_g: Mapped[float] = mapped_column(Float, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    sodium_mg: Mapped[float] = mapped_column(Float, default=0)
    potassium_mg: Mapped[float] = mapped_column(Float, default=0)
    cholesterol_mg: Mapped[float] = mapped_column(Float, default=0)
    carbohydrates_total_g: Mapped[float] = mapped_column(Float, default=0)
    fiber_g: Mapped[float] = mapped_column(Float, default=0)
    sugar_g: Mapped[float] = mapped_column(Float, default=0)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    food_item: Mapped["FoodItem"] = relationship("FoodItem", back_populates="nutrition")
