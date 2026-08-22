from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True, nullable=False)
    attendance_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    study_hours_week: Mapped[float | None] = mapped_column(Float, nullable=True)
    assignment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    internal_marks: Mapped[float | None] = mapped_column(Float, nullable=True)
    prev_sem_cgpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    activity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="profile")
