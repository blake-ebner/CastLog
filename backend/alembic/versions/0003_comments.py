"""add comments table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-16

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("catch_id", sa.Integer(), sa.ForeignKey("catches.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_comments_catch_id", "comments", ["catch_id"])


def downgrade() -> None:
    op.drop_index("ix_comments_catch_id", "comments")
    op.drop_table("comments")
