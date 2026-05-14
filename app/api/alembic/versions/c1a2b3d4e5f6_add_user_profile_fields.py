"""add user profile fields

Revision ID: c1a2b3d4e5f6
Revises: b3e7f92a1d05
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'c1a2b3d4e5f6'
down_revision = 'b3e7f92a1d05'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('home_city', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('passport_nationality', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('food_preference', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('seat_preference', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('preferred_pace', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('preferred_styles', sa.String(255), nullable=True))


def downgrade() -> None:
    for col in ['home_city', 'passport_nationality', 'food_preference',
                'seat_preference', 'preferred_pace', 'preferred_styles']:
        op.drop_column('users', col)
