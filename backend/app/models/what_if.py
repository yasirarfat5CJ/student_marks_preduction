from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class WhatIfPrediction(Base):
    __tablename__ = "what_if_predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    current_prediction: Mapped[float] = mapped_column(Float, nullable=False)
    what_if_prediction: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_change: Mapped[float] = mapped_column(Float, nullable=False)
    current_features: Mapped[dict] = mapped_column(JSON, nullable=False)
    what_if_features: Mapped[dict] = mapped_column(JSON, nullable=False)
    changed_features: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    user = relationship("User", back_populates="what_if_predictions")
