from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StudentProfileUpdate(BaseModel):
    attendance_pct: float | None = Field(default=None, ge=0, le=100)
    study_hours_week: float | None = Field(default=None, ge=0, le=40)
    assignment_score: float | None = Field(default=None, ge=0, le=100)
    internal_marks: float | None = Field(default=None, ge=0, le=100)
    prev_sem_cgpa: float | None = Field(default=None, ge=0, le=10)
    activity_score: float | None = Field(default=None, ge=0, le=100)


class StudentProfileResponse(StudentProfileUpdate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
