"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-07

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "catches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("species", sa.String(100), nullable=False),
        sa.Column("weight_lbs", sa.Float(), nullable=True),
        sa.Column("length_inches", sa.Float(), nullable=True),
        sa.Column("water_body", sa.String(255), nullable=True),
        sa.Column("caught_at", sa.DateTime(), nullable=False),
        sa.Column("bait_lure", sa.String(255), nullable=True),
        sa.Column("technique", sa.String(100), nullable=True),
        sa.Column("weather", sa.String(255), nullable=True),
        sa.Column("water_temp_f", sa.Float(), nullable=True),
        sa.Column("kept", sa.Boolean(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("catches")
    op.drop_index("ix_users_email", "users")
    op.drop_index("ix_users_username", "users")
    op.drop_table("users")
