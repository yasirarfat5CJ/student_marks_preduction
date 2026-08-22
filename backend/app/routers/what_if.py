from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.dependencies.auth import require_student_or_admin
from backend.app.models.user import User
from backend.app.models.what_if import WhatIfPrediction
from backend.app.schemas.prediction import WhatIfHistoryItem, WhatIfRequest, WhatIfResponse
from backend.app.services.prediction_service import prediction_service
from backend.app.services.recommendation_service import generate_detailed_recommendations


router = APIRouter(tags=["what-if"])


@router.post("/what-if", response_model=WhatIfResponse)
def what_if(
    payload: WhatIfRequest,
    current_user: Annotated[User, Depends(require_student_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    current_features = payload.current.model_dump()
    what_if_features = payload.what_if.model_dump()
    current_result = prediction_service.predict(current_features)
    what_if_result = prediction_service.predict(what_if_features)
    current_prediction = current_result["predicted_final_marks"]
    what_if_prediction = what_if_result["predicted_final_marks"]
    predicted_change = round(what_if_prediction - current_prediction, 2)
    changed_features = {
        feature: {"from": current_features[feature], "to": what_if_features[feature]}
        for feature in current_features
        if current_features[feature] != what_if_features[feature]
    }

    db.add(
        WhatIfPrediction(
            user_id=current_user.id,
            current_prediction=current_prediction,
            what_if_prediction=what_if_prediction,
            predicted_change=predicted_change,
            current_features=current_features,
            what_if_features=what_if_features,
            changed_features=changed_features,
        )
    )
    db.commit()

    return {
        "current_prediction": current_prediction,
        "what_if_prediction": what_if_prediction,
        "predicted_change": predicted_change,
        "changed_features": changed_features,
        "disclaimer": "The trained model predicts an approximate change under this scenario. This is not a guaranteed exam result.",
        "current_detailed_recommendations": generate_detailed_recommendations(current_features, current_prediction),
        "what_if_detailed_recommendations": generate_detailed_recommendations(what_if_features, what_if_prediction),
    }


@router.get("/what-if/history", response_model=list[WhatIfHistoryItem])
def what_if_history(
    current_user: Annotated[User, Depends(require_student_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    return (
        db.query(WhatIfPrediction)
        .filter(WhatIfPrediction.user_id == current_user.id)
        .order_by(WhatIfPrediction.created_at.desc())
        .all()
    )
