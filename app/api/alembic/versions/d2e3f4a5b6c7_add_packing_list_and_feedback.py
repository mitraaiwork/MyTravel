"""add packing list and trip feedback

Revision ID: d2e3f4a5b6c7
Revises: c1a2b3d4e5f6
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'd2e3f4a5b6c7'
down_revision = 'c1a2b3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('itineraries', sa.Column('packing_list', sa.Text, nullable=True))

    op.create_table(
        'trip_feedback',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('trip_id', sa.Integer, sa.ForeignKey('trips.id'), unique=True, nullable=False),
        sa.Column('overall_rating', sa.Integer, nullable=True),
        sa.Column('itinerary_rating', sa.Integer, nullable=True),
        sa.Column('restaurant_rating', sa.Integer, nullable=True),
        sa.Column('flow_rating', sa.Integer, nullable=True),
        sa.Column('pace_rating', sa.Integer, nullable=True),
        sa.Column('keep_list', sa.Text, nullable=True),
        sa.Column('skip_list', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('trip_feedback')
    op.drop_column('itineraries', 'packing_list')
