from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from ml_pipeline.config import MODEL_PATH


def predict_marks(
    attendance_pct: float,
    study_hours_week: float,
    assignment_score: float,
    internal_marks: float,
    prev_sem_cgpa: float,
    activity_score: float,
    model_path: Path = MODEL_PATH,
) -> dict[str, Any]:
    """Predict final exam marks from the saved preprocessing + model pipeline."""
    model = joblib.load(model_path)
    row = pd.DataFrame(
        [
            {
                "attendance_pct": attendance_pct,
                "study_hours_week": study_hours_week,
                "assignment_score": assignment_score,
                "internal_marks": internal_marks,
                "prev_sem_cgpa": prev_sem_cgpa,
                "activity_score": activity_score,
            }
        ]
    )

    raw_prediction = float(model.predict(row)[0])
    clipped_prediction = float(np.clip(raw_prediction, 0, 100))

    return {
        "raw_prediction": raw_prediction,
        "predicted_final_marks": clipped_prediction,
        "was_clipped_to_valid_range": raw_prediction != clipped_prediction,
    }
