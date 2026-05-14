"""add include_route_stops to trips

Revision ID: f5g6h7i8j9k0
Revises: e3f4a5b6c7d8
Create Date: 2026-05-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "f5g6h7i8j9k0"
down_revision = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "trips",
        sa.Column("include_route_stops", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("trips", "include_route_stops")
