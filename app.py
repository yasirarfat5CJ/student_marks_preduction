from __future__ import annotations

import json
import os
import warnings
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path("/tmp/matplotlib-codex")))

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

from ml_pipeline.config import (
    ARTIFACT_DIR,
    FEATURES,
    ID_COLUMN,
    MODEL_PATH,
    RANDOM_STATE,
    REPORT_PATH,
    TARGET,
    TEST_SIZE,
)
from ml_pipeline.evaluation import cross_validation_table, evaluate_models, explain_model, select_final_model, shap_example
from ml_pipeline.models import build_models, feature_engineering_cv, tune_candidates
from ml_pipeline.prediction import predict_marks
from ml_pipeline.preprocessing import clean_and_validate, find_dataset, iqr_outlier_summary
from ml_pipeline.reporting import markdown_table, write_report
from ml_pipeline.visualization import make_plots


def main() -> None:
    """Run the full student marks prediction pipeline."""
    warnings.filterwarnings("ignore", category=UserWarning)
    ARTIFACT_DIR.mkdir(exist_ok=True)

    # Step 1: Load, clean, and validate the raw CSV.
    dataset_path = find_dataset()
    print(f"Loading dataset: {dataset_path}", flush=True)
    raw_data = pd.read_csv(dataset_path)
    cleaned_data, audit = clean_and_validate(raw_data)
    outliers = iqr_outlier_summary(cleaned_data)

    # Step 2: Create EDA plots before training models.
    print("Generating EDA plots...", flush=True)
    plots = make_plots(cleaned_data)

    # Step 3: Split features and target. student_id is not used for prediction.
    X = cleaned_data.drop(columns=[ID_COLUMN, TARGET])
    y = cleaned_data[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    # Step 4: Train multiple models on the same training data.
    print("Training baseline and candidate models...", flush=True)
    models = build_models()
    comparison, fitted_models = evaluate_models(models, X_train, X_test, y_train, y_test)

    # Step 5: Check model stability with cross-validation.
    print("Running 5-fold cross-validation...", flush=True)
    cv_table = cross_validation_table(models, X_train, y_train)

    # Step 6: Tune the strongest model families without using the test set.
    print("Tuning strongest candidate models...", flush=True)
    tuning_table, tuned_models = tune_candidates(X_train, y_train)
    tuned_eval, fitted_tuned_models = evaluate_models(tuned_models, X_train, X_test, y_train, y_test)
    tuned_models.update(fitted_tuned_models)

    # Step 7: Try simple engineered features, but keep them only if justified.
    print("Running feature engineering comparison...", flush=True)
    feature_engineering = feature_engineering_cv(X_train, y_train)

    # Step 8: Select, save, explain, and report the final model.
    final_name, final_model, final_reason = select_final_model(
        comparison,
        cv_table,
        tuned_eval,
        fitted_models,
        tuned_models,
    )
    final_model.fit(X_train, y_train)

    print(f"Saving final model: {final_name}", flush=True)
    joblib.dump(final_model, MODEL_PATH)

    prediction_example = predict_marks(90, 15, 85, 80, 8.2, 84)
    example_row = pd.DataFrame(
        [
            {
                "attendance_pct": 90,
                "study_hours_week": 15,
                "assignment_score": 85,
                "internal_marks": 80,
                "prev_sem_cgpa": 8.2,
                "activity_score": 84,
            }
        ],
        columns=FEATURES,
    )

    feature_importance, importance_note = explain_model(final_model, X_test, y_test)
    shap_values = shap_example(final_model, example_row)

    save_artifacts(
        comparison,
        cv_table,
        tuning_table,
        tuned_eval,
        feature_importance,
        outliers,
        feature_engineering,
        prediction_example,
    )

    write_report(
        dataset_path,
        audit,
        outliers,
        plots,
        comparison,
        cv_table,
        tuning_table,
        tuned_eval,
        feature_engineering,
        final_name,
        final_reason,
        feature_importance,
        importance_note,
        shap_values,
        prediction_example,
    )

    print_summary(dataset_path, final_name, comparison, prediction_example)


def save_artifacts(
    comparison: pd.DataFrame,
    cv_table: pd.DataFrame,
    tuning_table: pd.DataFrame,
    tuned_eval: pd.DataFrame,
    feature_importance: pd.DataFrame,
    outliers: pd.DataFrame,
    feature_engineering: pd.DataFrame,
    prediction_example: dict,
) -> None:
    """Save tabular outputs so the report is reproducible."""
    comparison.to_csv(ARTIFACT_DIR / "model_comparison.csv", index=False)
    cv_table.to_csv(ARTIFACT_DIR / "cross_validation.csv", index=False)
    tuning_table.to_csv(ARTIFACT_DIR / "hyperparameter_tuning.csv", index=False)
    tuned_eval.to_csv(ARTIFACT_DIR / "tuned_model_comparison.csv", index=False)
    feature_importance.to_csv(ARTIFACT_DIR / "feature_importance.csv", index=False)
    outliers.to_csv(ARTIFACT_DIR / "outlier_summary.csv", index=False)
    feature_engineering.to_csv(ARTIFACT_DIR / "feature_engineering_experiment.csv", index=False)
    (ARTIFACT_DIR / "prediction_example.json").write_text(
        json.dumps(prediction_example, indent=2),
        encoding="utf-8",
    )


def print_summary(
    dataset_path,
    final_name: str,
    comparison: pd.DataFrame,
    prediction_example: dict,
) -> None:
    """Print a concise terminal summary after the run finishes."""
    print("Student marks prediction pipeline completed.")
    print(f"Dataset: {dataset_path}")
    print(f"Final model: {final_name}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Report: {REPORT_PATH}")
    print("\nModel comparison:")
    print(markdown_table(comparison, ["model", "mae", "rmse", "r2"], ["mae", "rmse", "r2"]))
    print("\nPrediction example:")
    print(json.dumps(prediction_example, indent=2))


if __name__ == "__main__":
    main()
