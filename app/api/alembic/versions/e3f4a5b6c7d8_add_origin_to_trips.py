"""add origin to trips

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-04-08

"""
from alembic import op
import sqlalchemy as sa

revision = 'e3f4a5b6c7d8'
down_revision = 'd2e3f4a5b6c7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('trips', sa.Column('origin', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('trips', 'origin')
