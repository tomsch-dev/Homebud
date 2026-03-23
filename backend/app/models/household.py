import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Boolean, String, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Household(Base):
    __tablename__ = "households"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    share_food_items: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    share_grocery_trips: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    share_eating_out: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    share_subscriptions: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    share_recipes: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    share_shopping_list: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    members: Mapped[List["HouseholdMember"]] = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")


class HouseholdMember(Base):
    __tablename__ = "household_members"
    __table_args__ = (UniqueConstraint("user_id", "household_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(128), ForeignKey("users.id", ondelete="CASCADE"))
    household_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20), default="member")  # "owner" or "member"
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="household_members")
    household: Mapped["Household"] = relationship("Household", back_populates="members")
