from pathlib import Path
from typing import Any
import os

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib-codex")

import joblib
import numpy as np
import pandas as pd

from backend.app.core.config import get_settings
from backend.app.services.recommendation_service import generate_detailed_recommendations, get_risk_level

FEATURES = [
    "attendance_pct",
    "study_hours_week",
    "assignment_score",
    "internal_marks",
    "prev_sem_cgpa",
    "activity_score",
]


class PredictionService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model: Any | None = None

    def load_model(self) -> None:
        if self.model is not None:
            return
        model_path = Path(self.settings.model_path)
        if not model_path.exists():
            raise RuntimeError("Trained model artifact not found. Run the training pipeline first.")
        self.model = joblib.load(model_path)

    def predict(self, features: dict[str, float]) -> dict[str, Any]:
        self.load_model()
        row_df = pd.DataFrame([{feature: features[feature] for feature in FEATURES}])
        raw_prediction = float(self.model.predict(row_df)[0])
        predicted_marks = float(np.clip(raw_prediction, 0.0, 100.0))
        detailed_recommendations = generate_detailed_recommendations(features, predicted_marks)
        contributions, explanation_method = self._explain(row_df)

        return {
            "raw_prediction": raw_prediction,
            "predicted_final_marks": round(predicted_marks, 2),
            "was_clipped_to_valid_range": raw_prediction != predicted_marks,
            "model_name": self.settings.model_name,
            "risk_level": get_risk_level(predicted_marks),
            "explanation_method": explanation_method,
            "contributions": contributions,
            "recommendations": detailed_recommendations["flat_recommendations"],
            "detailed_recommendations": detailed_recommendations,
        }

    def _explain(self, row_df: pd.DataFrame) -> tuple[list[dict[str, Any]], str]:
        try:
            import shap
        except ImportError:
            shap = None

        if shap is not None:
            try:
                estimator = self.model.named_steps["model"]
                preprocessor = self.model.named_steps["preprocess"]
                transformed_row = preprocessor.transform(row_df)
                explainer = shap.TreeExplainer(estimator)
                shap_values = explainer.shap_values(transformed_row)
                if isinstance(shap_values, list):
                    shap_values = shap_values[0]
                contributions = [
                    {
                        "feature": feature,
                        "contribution": float(shap_values[0][idx]),
                        "direction": "positive" if float(shap_values[0][idx]) >= 0 else "negative",
                    }
                    for idx, feature in enumerate(FEATURES)
                ]
                return sorted(contributions, key=lambda item: abs(item["contribution"]), reverse=True), "SHAP"
            except Exception:
                pass

        return self._feature_importance_fallback(row_df), "Feature Importance Fallback"

    def _feature_importance_fallback(self, row_df: pd.DataFrame) -> list[dict[str, Any]]:
        estimator = self.model.named_steps["model"]
        importances = getattr(estimator, "feature_importances_", [1 / len(FEATURES)] * len(FEATURES))
        values = row_df.iloc[0].to_dict()
        means = {
            "attendance_pct": 75.0,
            "study_hours_week": 15.0,
            "assignment_score": 70.0,
            "internal_marks": 65.0,
            "prev_sem_cgpa": 7.0,
            "activity_score": 60.0,
        }
        contributions = []
        for idx, feature in enumerate(FEATURES):
            scale = 10 if feature == "prev_sem_cgpa" else 1
            value = (values[feature] - means[feature]) * scale * float(importances[idx])
            contributions.append(
                {
                    "feature": feature,
                    "contribution": float(value),
                    "direction": "positive" if value >= 0 else "negative",
                }
            )
        return sorted(contributions, key=lambda item: abs(item["contribution"]), reverse=True)


prediction_service = PredictionService()
