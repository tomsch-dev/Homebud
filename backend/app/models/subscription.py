import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Float, Date, DateTime, Boolean, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="EUR")
    # monthly, yearly, weekly, quarterly
    billing_cycle: Mapped[str] = mapped_column(String(50), default="monthly")
    # e.g. streaming, music, software, fitness, cloud, insurance, other
    category: Mapped[str] = mapped_column(String(100), default="other")
    next_billing_date: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
