"""add household sharing settings

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-03-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("households", sa.Column("share_food_items", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("households", sa.Column("share_grocery_trips", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("households", sa.Column("share_eating_out", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("households", sa.Column("share_subscriptions", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("households", sa.Column("share_recipes", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("households", sa.Column("share_shopping_list", sa.Boolean(), server_default="true", nullable=False))


def downgrade() -> None:
    op.drop_column("households", "share_shopping_list")
    op.drop_column("households", "share_recipes")
    op.drop_column("households", "share_subscriptions")
    op.drop_column("households", "share_eating_out")
    op.drop_column("households", "share_grocery_trips")
    op.drop_column("households", "share_food_items")
