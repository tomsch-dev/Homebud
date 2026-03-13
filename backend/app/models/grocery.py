import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Float, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class GroceryTrip(Base):
    __tablename__ = "grocery_trips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_name: Mapped[str] = mapped_column(String(255), nullable=False)
    trip_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(10), default="EUR")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[List["GroceryTripItem"]] = relationship(
        "GroceryTripItem", back_populates="trip", cascade="all, delete-orphan"
    )

    @property
    def total_amount(self) -> float:
        return sum(item.total_price for item in self.items)


class GroceryTripItem(Base):
    __tablename__ = "grocery_trip_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("grocery_trips.id", ondelete="CASCADE"))
    food_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    price_per_unit: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="EUR")

    trip: Mapped["GroceryTrip"] = relationship("GroceryTrip", back_populates="items")
    food_item: Mapped[Optional["FoodItem"]] = relationship("FoodItem", back_populates="grocery_trip_items")
