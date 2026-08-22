from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    attendance_pct: float = Field(..., ge=0, le=100)
    study_hours_week: float = Field(..., ge=0, le=40)
    assignment_score: float = Field(..., ge=0, le=100)
    internal_marks: float = Field(..., ge=0, le=100)
    prev_sem_cgpa: float = Field(..., ge=0, le=10)
    activity_score: float = Field(..., ge=0, le=100)


class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    direction: str


class PredictionResponse(BaseModel):
    raw_prediction: float
    predicted_final_marks: float
    was_clipped_to_valid_range: bool
    model_name: str
    risk_level: str
    explanation_method: str
    contributions: list[FeatureContribution]
    recommendations: list[str]
    detailed_recommendations: dict[str, Any]


class PredictionHistoryItem(BaseModel):
    id: int
    predicted_final_marks: float
    model_name: str
    risk_level: str
    date: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WhatIfRequest(BaseModel):
    current: PredictionRequest
    what_if: PredictionRequest


class WhatIfResponse(BaseModel):
    current_prediction: float
    what_if_prediction: float
    predicted_change: float
    changed_features: dict[str, dict[str, float]]
    disclaimer: str
    current_detailed_recommendations: dict[str, Any]
    what_if_detailed_recommendations: dict[str, Any]


class WhatIfHistoryItem(BaseModel):
    id: int
    current_prediction: float
    what_if_prediction: float
    predicted_change: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
