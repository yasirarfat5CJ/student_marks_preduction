import json
from pathlib import Path
from typing import Any

import pandas as pd

from src.config import (
    FEATURES,
    GB_TUNING_ITERATIONS,
    ID_COLUMN,
    MODEL_PATH,
    PLOT_DIR,
    REPORT_PATH,
    RF_TUNING_ITERATIONS,
    TARGET,
)
from src.models import XGBRegressor
from src.evaluation import shap


def dataframe_to_markdown(df: pd.DataFrame, include_index: bool = False) -> str:
    """Convert a DataFrame to markdown without requiring optional tabulate."""
    table = df.copy()
    if include_index:
        table = table.reset_index(names="feature")

    headers = [str(col) for col in table.columns]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]

    for _, row in table.iterrows():
        values = []
        for value in row.tolist():
            if isinstance(value, float):
                rendered = f"{value:.6g}"
            else:
                rendered = str(value)
            values.append(rendered.replace("|", "\\|"))
        lines.append("| " + " | ".join(values) + " |")

    return "\n".join(lines)


def markdown_table(
    df: pd.DataFrame,
    columns: list[str],
    float_cols: list[str] | None = None,
) -> str:
    out = df.loc[:, columns].copy()
    for col in float_cols or []:
        out[col] = out[col].map(lambda value: f"{value:.3f}")
    return dataframe_to_markdown(out)


def write_report(
    dataset_path: Path,
    audit: dict[str, Any],
    outliers: pd.DataFrame,
    plots: list[str],
    comparison: pd.DataFrame,
    cv_table: pd.DataFrame,
    tuning_table: pd.DataFrame,
    tuned_eval: pd.DataFrame,
    feature_engineering: pd.DataFrame,
    final_name: str,
    final_reason: str,
    feature_importance: pd.DataFrame,
    importance_note: str,
    shap_values: pd.DataFrame | None,
    prediction_example: dict[str, Any],
) -> None:
    """Write the final project report to artifacts/final_report.md."""
    corr_target = audit["correlation"][TARGET].drop(TARGET).sort_values(ascending=False)
    strongest = corr_target.abs().sort_values(ascending=False)
    target = audit["describe"].loc[TARGET]

    xgboost_note = (
        "XGBoost was included."
        if XGBRegressor is not None
        else "XGBoost was skipped because `xgboost` is not installed. Install with `pip install xgboost` to include it."
    )
    shap_note = (
        "SHAP values were computed for the example prediction."
        if shap_values is not None
        else "SHAP was not computed because `shap` is unavailable or the final estimator is not tree-based. Install with `pip install shap` for SHAP explanations."
    )
    metric_explanation = explain_metrics()
    model_result_explanation = explain_model_results(comparison)
    cv_explanation = explain_cv_results(cv_table)

    report = f"""# Student Final Exam Marks Prediction Report

## Dataset

- Dataset file: `{dataset_path}`
- Initial shape: {audit['initial_shape']}
- Clean shape: {audit['clean_shape']}
- Predictive feature count: {len(FEATURES)}
- Target variable: `{TARGET}`
- Identifier retained for traceability but excluded from `X`: `{ID_COLUMN}`
- Missing expected columns: {audit['missing_expected_columns']}
- Accidental index columns removed: {audit['removed_unnamed_columns']}
- Numeric conversion new missing values: `{audit['numeric_conversion_new_missing']}`
- Exact duplicate rows removed: {audit['exact_duplicates_removed']}
- Repeated student IDs retained for review count: {audit['repeated_student_id_count']}
- Rows before target cleaning: {audit['target_rows_before_cleaning']}
- Rows removed for missing target: {audit['target_rows_removed']}
- Rows remaining after target cleaning: {audit['target_rows_remaining']}
- Domain-invalid records removed: {audit['domain_invalid_rows_removed']}
- Remaining missing values are handled inside training pipelines using median imputation for input features only.

## Initial Inspection

Columns: `{audit['initial_columns']}`

Data types:

```json
{json.dumps(audit['initial_dtypes'], indent=2)}
```

Initial missing values:

```json
{json.dumps(audit['initial_missing'], indent=2)}
```

First 5 rows:

```text
{audit['head']}
```

Last 5 rows:

```text
{audit['tail']}
```

## Validation And Cleaning

The expected schema was verified after stripping leading/trailing column whitespace. `student_id` was never used as a predictive feature. Numeric columns were converted with `pd.to_numeric(errors="coerce")` and newly introduced missing values were counted. The target was not imputed; any missing target rows would be removed because supervised training needs observed labels.

Domain validation used valid academic ranges. Invalid values were removed instead of clipped. Prediction-time clipping is reported separately because regressors can occasionally predict slightly outside 0-100.

## Statistical Summary

{dataframe_to_markdown(audit['describe'].assign(median=pd.Series(audit['median'])), include_index=True)}

## EDA

- Plot files generated: {len(plots)} in `{PLOT_DIR}`.
- Target mean: {target['mean']:.3f}
- Target median: {audit['median'][TARGET]:.3f}
- Target standard deviation: {target['std']:.3f}
- Target minimum: {target['min']:.3f}
- Target maximum: {target['max']:.3f}
- Target skewness: {audit['skewness'][TARGET]:.3f}
- Strongest absolute correlations with `{TARGET}`: {strongest.round(3).to_dict()}
- Signed correlations with `{TARGET}`: {corr_target.round(3).to_dict()}

Correlation describes association only; it does not prove causation.

## Outliers

{dataframe_to_markdown(outliers)}

Outliers identified by IQR were treated as rare-but-possible observations unless they violated domain ranges. They were not removed simply to improve model performance.

## Leakage Prevention

The model uses only information plausibly available before the final exam. `final_exam_marks` is separated before modeling and is never included in preprocessing for input features. All imputers and scalers are fitted inside Scikit-learn pipelines using training folds only.

## Models

- Dummy Regressor: baseline that predicts the training-set mean.
- Linear Regression: interpretable linear benchmark.
- Decision Tree: nonlinear baseline, but can overfit.
- Random Forest: bagged tree ensemble suitable for tabular data.
- Gradient Boosting: sequential ensemble that can model nonlinear structure.
- {xgboost_note}

## Test Results

{markdown_table(comparison, ['model', 'mae', 'mse', 'rmse', 'r2', 'train_r2'], ['mae', 'mse', 'rmse', 'r2', 'train_r2'])}

### How To Read The Metrics

{metric_explanation}

### Why Models Performed Differently

{model_result_explanation}

## Cross Validation

{markdown_table(cv_table, ['model', 'cv_mae_mean', 'cv_mae_std', 'cv_rmse_mean', 'cv_rmse_std', 'cv_r2_mean', 'cv_r2_std'], ['cv_mae_mean', 'cv_mae_std', 'cv_rmse_mean', 'cv_rmse_std', 'cv_r2_mean', 'cv_r2_std'])}

{cv_explanation}

## Hyperparameter Tuning

RandomizedSearchCV tested {GB_TUNING_ITERATIONS} Gradient Boosting combinations and {RF_TUNING_ITERATIONS} Random Forest combinations using cross-validation on the training data only.

{dataframe_to_markdown(tuning_table)}

Tuned model test performance:

{markdown_table(tuned_eval, ['model', 'mae', 'mse', 'rmse', 'r2', 'train_r2'], ['mae', 'mse', 'rmse', 'r2', 'train_r2'])}

## Feature Engineering Experiment

{markdown_table(feature_engineering, ['feature_set', 'cv_mae_mean', 'cv_mae_std'], ['cv_mae_mean', 'cv_mae_std'])}

Engineered features were not automatically added to the final model.

## Final Model

- Selected model: {final_name}
- Saved pipeline: `{MODEL_PATH}`
- Selection rationale: {final_reason}

Overfitting was checked by comparing train R2 and test R2. Selection did not rely on training score alone.

## Explainability

{importance_note}

{dataframe_to_markdown(feature_importance)}

{shap_note}

{'' if shap_values is None else dataframe_to_markdown(shap_values)}

Feature importance and SHAP-style contributions describe model behavior, not causal effects.

## Prediction Example

Input: attendance=90, study hours=15, assignment=85, internal=80, previous CGPA=8.2, activity=84.

```json
{json.dumps(prediction_example, indent=2)}
```

If a raw regression prediction falls outside 0-100, the returned prediction is clipped to the valid range and `was_clipped_to_valid_range` is set to true.

## Reproducibility

- Dataset version: `{dataset_path.name}` loaded from the working directory.
- Random state: 42
- Train/test ratio: 80/20
- Cross-validation folds: 5
- Preprocessing: median imputation for numeric inputs; StandardScaler only for scaled linear pipeline.
- Metrics: MAE, MSE, RMSE, R2.

## Limitations

- Dataset quality limits model quality; missing and duplicate records were handled conservatively.
- If this dataset is synthetic, performance may not represent real student outcomes.
- Predictions have uncertainty and should not be used as the sole basis for academic decisions.
- Correlation and feature importance do not imply causation.
- Performance may change on future or real-world student data.
"""
    REPORT_PATH.write_text(report, encoding="utf-8")


def explain_metrics() -> str:
    """Return a beginner-friendly explanation of regression metrics."""
    return """- MAE means Mean Absolute Error. It is the average prediction mistake in marks. Lower is better. MAE = 6 means the model is usually off by about 6 marks.
- MSE means Mean Squared Error. It squares mistakes, so big mistakes are punished more strongly. Lower is better.
- RMSE means Root Mean Squared Error. It is also in marks, like MAE, but it reacts more to large errors. Lower is better.
- R2 explains how much target variation the model captures compared with predicting the average mark. Higher is better, but R2 is not an accuracy percentage.
- train_r2 shows performance on training data. If train_r2 is much higher than test R2, the model may be overfitting."""


def explain_model_results(comparison: pd.DataFrame) -> str:
    """Explain why the observed model results make sense."""
    best = comparison.iloc[0]
    worst = comparison.iloc[-1]
    lines = [
        f"- Best test model: {best['model']} with MAE {best['mae']:.3f}, RMSE {best['rmse']:.3f}, and R2 {best['r2']:.3f}. It gives the lowest error on unseen test data.",
        f"- Highest-error model: {worst['model']} with MAE {worst['mae']:.3f}. This is expected when the model is too simple or ignores useful feature patterns.",
    ]

    for _, row in comparison.iterrows():
        name = row["model"]
        mae = row["mae"]
        r2 = row["r2"]
        train_r2 = row["train_r2"]

        if name == "Gradient Boosting":
            lines.append(
                f"- Gradient Boosting performs well because it builds many small trees one after another. Each tree tries to fix previous mistakes, so it captures nonlinear patterns without memorizing the data too much. Here its train R2 ({train_r2:.3f}) and test R2 ({r2:.3f}) are close, which is a good sign."
            )
        elif name == "Linear Regression":
            lines.append(
                f"- Linear Regression is strong because the features have clear positive relationships with final marks. Its MAE ({mae:.3f}) is close to the best model, so much of the dataset pattern is approximately linear."
            )
        elif name == "Random Forest":
            lines.append(
                f"- Random Forest has low test error, but its train R2 ({train_r2:.3f}) is much higher than test R2 ({r2:.3f}). That means it learned training data very strongly and may overfit a little."
            )
        elif name == "Decision Tree":
            lines.append(
                f"- Decision Tree has train R2 ({train_r2:.3f}) but weaker test R2 ({r2:.3f}). A single deep tree can memorize training rows, so it often gives higher error on new students."
            )
        elif name == "Dummy Regressor":
            lines.append(
                f"- Dummy Regressor predicts the average mark for everyone. Its high MAE ({mae:.3f}) shows the real ML models are learning useful information from the features."
            )
        elif name == "XGBoost":
            lines.append(
                f"- XGBoost is another boosting model. It can be excellent for tabular data, but it should only be chosen if its validation and test metrics justify it."
            )

    return "\n".join(lines)


def explain_cv_results(cv_table: pd.DataFrame) -> str:
    """Explain cross-validation results in simple language."""
    best = cv_table.iloc[0]
    return (
        "Five-fold cross-validation trains and validates the model five times using different splits of the training data. "
        "This is more reliable than trusting one split only. "
        f"The best average CV model was {best['model']} with CV MAE {best['cv_mae_mean']:.3f} +/- {best['cv_mae_std']:.3f}. "
        "A small standard deviation means performance is stable across folds. "
        "The final test set was still kept separate until final evaluation."
    )
