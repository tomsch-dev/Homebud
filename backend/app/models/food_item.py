import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Float, Date, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Price tracking
    price_per_unit: Mapped[Optional[float]] = mapped_column(Float)
    price_currency: Mapped[str] = mapped_column(String(10), default="EUR")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    nutrition: Mapped[Optional["Nutrition"]] = relationship("Nutrition", back_populates="food_item", uselist=False, cascade="all, delete-orphan")
    recipe_ingredients: Mapped[List["RecipeIngredient"]] = relationship("RecipeIngredient", back_populates="food_item")
    grocery_trip_items: Mapped[List["GroceryTripItem"]] = relationship("GroceryTripItem", back_populates="food_item")
