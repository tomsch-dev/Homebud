"""add user_id to grocery_trips, eating_out_expenses, subscriptions, recipes, shopping_list_items

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-03-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("grocery_trips", sa.Column("user_id", sa.String(255), nullable=True))
    op.create_index("ix_grocery_trips_user_id", "grocery_trips", ["user_id"])

    op.add_column("eating_out_expenses", sa.Column("user_id", sa.String(255), nullable=True))
    op.create_index("ix_eating_out_expenses_user_id", "eating_out_expenses", ["user_id"])

    op.add_column("subscriptions", sa.Column("user_id", sa.String(255), nullable=True))
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])

    op.add_column("recipes", sa.Column("user_id", sa.String(255), nullable=True))
    op.create_index("ix_recipes_user_id", "recipes", ["user_id"])

    op.add_column("shopping_list_items", sa.Column("user_id", sa.String(255), nullable=True))
    op.create_index("ix_shopping_list_items_user_id", "shopping_list_items", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_shopping_list_items_user_id", "shopping_list_items")
    op.drop_column("shopping_list_items", "user_id")

    op.drop_index("ix_recipes_user_id", "recipes")
    op.drop_column("recipes", "user_id")

    op.drop_index("ix_subscriptions_user_id", "subscriptions")
    op.drop_column("subscriptions", "user_id")

    op.drop_index("ix_eating_out_expenses_user_id", "eating_out_expenses")
    op.drop_column("eating_out_expenses", "user_id")

    op.drop_index("ix_grocery_trips_user_id", "grocery_trips")
    op.drop_column("grocery_trips", "user_id")
