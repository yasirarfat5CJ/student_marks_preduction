from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.dependencies.auth import require_student_or_admin
from backend.app.models.prediction import Prediction
from backend.app.models.user import User
from backend.app.schemas.prediction import PredictionHistoryItem, PredictionRequest, PredictionResponse
from backend.app.services.prediction_service import prediction_service


router = APIRouter(tags=["predictions"])


@router.post("/predict", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest,
    current_user: Annotated[User, Depends(require_student_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    features = payload.model_dump()
    result = prediction_service.predict(features)
    db.add(
        Prediction(
            user_id=current_user.id,
            **features,
            predicted_final_marks=result["predicted_final_marks"],
            model_name=result["model_name"],
        )
    )
    db.commit()
    return result


@router.get("/predictions/history", response_model=list[PredictionHistoryItem])
def prediction_history(
    current_user: Annotated[User, Depends(require_student_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    return (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
