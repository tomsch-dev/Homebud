"""add is_suspended to users

Revision ID: a1b2c3d4e5f6
Revises: 44b7e2ec32e8
Create Date: 2026-03-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '44b7e2ec32e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Idempotent: only add if column doesn't exist
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='users' AND column_name='is_suspended'"
    ))
    if result.fetchone() is None:
        op.add_column('users', sa.Column('is_suspended', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'is_suspended')
