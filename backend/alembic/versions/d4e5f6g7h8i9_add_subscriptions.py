"""add subscriptions table

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-03-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'd4e5f6g7h8i9'
down_revision: Union[str, None] = 'c3d4e5f6g7h8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_name='subscriptions'"
    ))
    if result.fetchone() is None:
        op.create_table(
            'subscriptions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('amount', sa.Float, nullable=False),
            sa.Column('currency', sa.String(10), server_default='EUR'),
            sa.Column('billing_cycle', sa.String(50), server_default='monthly'),
            sa.Column('category', sa.String(100), server_default='other'),
            sa.Column('next_billing_date', sa.Date, nullable=True),
            sa.Column('is_active', sa.Boolean, server_default='true'),
            sa.Column('notes', sa.Text, nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table('subscriptions')
