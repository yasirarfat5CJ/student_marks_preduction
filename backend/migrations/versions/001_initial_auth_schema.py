"""initial auth schema

Revision ID: 001_initial_auth_schema
Revises:
Create Date: 2026-08-14
"""

from alembic import op
import sqlalchemy as sa


revision = "001_initial_auth_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("student", "admin"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_id", "users", ["id"])

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("attendance_pct", sa.Float(), nullable=True),
        sa.Column("study_hours_week", sa.Float(), nullable=True),
        sa.Column("assignment_score", sa.Float(), nullable=True),
        sa.Column("internal_marks", sa.Float(), nullable=True),
        sa.Column("prev_sem_cgpa", sa.Float(), nullable=True),
        sa.Column("activity_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_student_profiles_id", "student_profiles", ["id"])
    op.create_index("ix_student_profiles_user_id", "student_profiles", ["user_id"], unique=True)

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("attendance_pct", sa.Float(), nullable=False),
        sa.Column("study_hours_week", sa.Float(), nullable=False),
        sa.Column("assignment_score", sa.Float(), nullable=False),
        sa.Column("internal_marks", sa.Float(), nullable=False),
        sa.Column("prev_sem_cgpa", sa.Float(), nullable=False),
        sa.Column("activity_score", sa.Float(), nullable=False),
        sa.Column("predicted_final_marks", sa.Float(), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_predictions_id", "predictions", ["id"])
    op.create_index("ix_predictions_user_id", "predictions", ["user_id"])
    op.create_index("ix_predictions_created_at", "predictions", ["created_at"])

    op.create_table(
        "what_if_predictions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("current_prediction", sa.Float(), nullable=False),
        sa.Column("what_if_prediction", sa.Float(), nullable=False),
        sa.Column("predicted_change", sa.Float(), nullable=False),
        sa.Column("current_features", sa.JSON(), nullable=False),
        sa.Column("what_if_features", sa.JSON(), nullable=False),
        sa.Column("changed_features", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_what_if_predictions_id", "what_if_predictions", ["id"])
    op.create_index("ix_what_if_predictions_user_id", "what_if_predictions", ["user_id"])
    op.create_index("ix_what_if_predictions_created_at", "what_if_predictions", ["created_at"])


def downgrade() -> None:
    op.drop_table("what_if_predictions")
    op.drop_table("predictions")
    op.drop_table("student_profiles")
    op.drop_table("users")
