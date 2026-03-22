"""add tos_accepted_at to users

Revision ID: e5f6g7h8i9j0
Revises: c3d4e5f6g7h8
Create Date: 2026-03-22
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6g7h8i9j0"
down_revision = "d4e5f6g7h8i9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("tos_accepted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "tos_accepted_at")
