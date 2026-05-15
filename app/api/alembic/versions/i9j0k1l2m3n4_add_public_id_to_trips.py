"""add public_id to trips

Revision ID: i9j0k1l2m3n4
Revises: h7i8j9k0l1m2
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = "i9j0k1l2m3n4"
down_revision = "h7i8j9k0l1m2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("trips", sa.Column("public_id", sa.String(32), nullable=True))
    op.execute("UPDATE trips SET public_id = md5(random()::text) WHERE public_id IS NULL")
    op.alter_column("trips", "public_id", nullable=False)
    op.create_index("ix_trips_public_id", "trips", ["public_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_trips_public_id", table_name="trips")
    op.drop_column("trips", "public_id")
