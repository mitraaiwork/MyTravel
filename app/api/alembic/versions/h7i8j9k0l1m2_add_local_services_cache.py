"""add local_services cache to itineraries

Revision ID: h7i8j9k0l1m2
Revises: g6h7i8j9k0l1
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = "h7i8j9k0l1m2"
down_revision = "g6h7i8j9k0l1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("itineraries", sa.Column("local_services", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("itineraries", "local_services")
