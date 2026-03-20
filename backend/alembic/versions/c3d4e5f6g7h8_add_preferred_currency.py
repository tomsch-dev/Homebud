"""add preferred_currency to users

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-03-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='users' AND column_name='preferred_currency'"
    ))
    if result.fetchone() is None:
        op.add_column('users', sa.Column('preferred_currency', sa.String(10), server_default='EUR', nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'preferred_currency')
