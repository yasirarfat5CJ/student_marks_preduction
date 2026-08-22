from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    attendance_pct: Mapped[float] = mapped_column(Float, nullable=False)
    study_hours_week: Mapped[float] = mapped_column(Float, nullable=False)
    assignment_score: Mapped[float] = mapped_column(Float, nullable=False)
    internal_marks: Mapped[float] = mapped_column(Float, nullable=False)
    prev_sem_cgpa: Mapped[float] = mapped_column(Float, nullable=False)
    activity_score: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_final_marks: Mapped[float] = mapped_column(Float, nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    user = relationship("User", back_populates="predictions")

    @property
    def risk_level(self) -> str:
        if self.predicted_final_marks < 50:
            return "High"
        if self.predicted_final_marks < 75:
            return "Moderate"
        return "Low"

    @property
    def date(self) -> str:
        return self.created_at.strftime("%b %d, %H:%M")
