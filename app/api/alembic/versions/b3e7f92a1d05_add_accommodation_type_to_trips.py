"""add accommodation_type to trips

Revision ID: b3e7f92a1d05
Revises: fd26b1ce2c9b
Create Date: 2026-03-28

"""
from alembic import op
import sqlalchemy as sa

revision = 'b3e7f92a1d05'
down_revision = 'fd26b1ce2c9b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('trips', sa.Column('accommodation_type', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('trips', 'accommodation_type')
