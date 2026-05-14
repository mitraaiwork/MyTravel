"""add trip_type and schedule fields

Revision ID: g6h7i8j9k0l1
Revises: f5g6h7i8j9k0
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa

revision = "g6h7i8j9k0l1"
down_revision = "f5g6h7i8j9k0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("trips", sa.Column("trip_type", sa.String(20), nullable=False, server_default="destination"))
    op.add_column("trips", sa.Column("arrive_destination_date", sa.Date(), nullable=True))
    op.add_column("trips", sa.Column("arrive_destination_time", sa.String(5), nullable=True))
    op.add_column("trips", sa.Column("leave_destination_date", sa.Date(), nullable=True))
    op.add_column("trips", sa.Column("leave_destination_time", sa.String(5), nullable=True))
    op.add_column("trips", sa.Column("include_return_stops", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("trips", "include_return_stops")
    op.drop_column("trips", "leave_destination_time")
    op.drop_column("trips", "leave_destination_date")
    op.drop_column("trips", "arrive_destination_time")
    op.drop_column("trips", "arrive_destination_date")
    op.drop_column("trips", "trip_type")
