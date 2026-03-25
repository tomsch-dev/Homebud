"""add calendar events and share_calendar setting

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-03-25
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "l2m3n4o5p6q7"
down_revision: Union[str, None] = "k1l2m3n4o5p6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "calendar_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(128), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("event_date", sa.Date, nullable=False),
        sa.Column("start_time", sa.Time, nullable=True),
        sa.Column("end_time", sa.Time, nullable=True),
        sa.Column("all_day", sa.Boolean, server_default="true"),
        sa.Column("color", sa.String(20), server_default="'emerald'"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.add_column("households", sa.Column("share_calendar", sa.Boolean(), server_default="true", nullable=False))


def downgrade() -> None:
    op.drop_column("households", "share_calendar")
    op.drop_table("calendar_events")
