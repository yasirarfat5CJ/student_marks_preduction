import math
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_validate
from sklearn.pipeline import Pipeline

from ml_pipeline.config import CV_FOLDS, FEATURES, RANDOM_STATE

try:
    import shap
except ImportError:  # pragma: no cover - optional dependency
    shap = None


@dataclass
class Evaluation:
    model: str
    mae: float
    mse: float
    rmse: float
    r2: float
    train_mae: float
    train_rmse: float
    train_r2: float


def rmse_score(y_true: pd.Series, y_pred: np.ndarray) -> float:
    return math.sqrt(mean_squared_error(y_true, y_pred))


def evaluate_models(
    models: dict[str, Pipeline],
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> tuple[pd.DataFrame, dict[str, Pipeline]]:
    """Fit models and evaluate each on the same train/test split."""
    fitted: dict[str, Pipeline] = {}
    rows: list[Evaluation] = []

    for name, pipeline in models.items():
        pipeline.fit(X_train, y_train)
        fitted[name] = pipeline

        pred_test = pipeline.predict(X_test)
        pred_train = pipeline.predict(X_train)

        rows.append(
            Evaluation(
                model=name,
                mae=mean_absolute_error(y_test, pred_test),
                mse=mean_squared_error(y_test, pred_test),
                rmse=rmse_score(y_test, pred_test),
                r2=r2_score(y_test, pred_test),
                train_mae=mean_absolute_error(y_train, pred_train),
                train_rmse=rmse_score(y_train, pred_train),
                train_r2=r2_score(y_train, pred_train),
            )
        )

    table = pd.DataFrame([row.__dict__ for row in rows])
    return sort_model_table(table), fitted


def cross_validation_table(
    models: dict[str, Pipeline],
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> pd.DataFrame:
    """Run 5-fold CV on training data only."""
    cv = KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    scoring = {
        "mae": "neg_mean_absolute_error",
        "rmse": "neg_root_mean_squared_error",
        "r2": "r2",
    }
    rows = []

    for name, pipeline in models.items():
        result = cross_validate(
            pipeline,
            X_train,
            y_train,
            cv=cv,
            scoring=scoring,
            n_jobs=1,
            error_score="raise",
        )
        rows.append(
            {
                "model": name,
                "cv_mae_mean": -result["test_mae"].mean(),
                "cv_mae_std": result["test_mae"].std(),
                "cv_rmse_mean": -result["test_rmse"].mean(),
                "cv_rmse_std": result["test_rmse"].std(),
                "cv_r2_mean": result["test_r2"].mean(),
                "cv_r2_std": result["test_r2"].std(),
            }
        )

    return pd.DataFrame(rows).sort_values(
        ["cv_mae_mean", "cv_rmse_mean", "cv_r2_mean"],
        ascending=[True, True, False],
    )


def select_final_model(
    comparison: pd.DataFrame,
    cv_table: pd.DataFrame,
    tuned_eval: pd.DataFrame,
    fitted_models: dict[str, Pipeline],
    tuned_models: dict[str, Pipeline],
) -> tuple[str, Pipeline, str]:
    """Choose the final model using test metrics plus CV context."""
    combined = pd.concat(
        [
            comparison[["model", "mae", "rmse", "r2"]].assign(source="initial"),
            tuned_eval[["model", "mae", "rmse", "r2"]].assign(source="tuned"),
        ],
        ignore_index=True,
    )
    best_name = str(sort_model_table(combined).iloc[0]["model"])
    model = tuned_models.get(best_name) or fitted_models[best_name]

    cv_match = cv_table[cv_table["model"].eq(best_name.replace(" Tuned", ""))]
    reason = (
        f"{best_name} had the best balanced final-test ranking by MAE/RMSE/R2 among "
        "the evaluated candidates. Cross-validation was used before final test "
        "evaluation to reduce reliance on a single split."
    )
    if not cv_match.empty:
        reason += (
            f" Its untuned family CV MAE was {cv_match.iloc[0]['cv_mae_mean']:.3f} "
            f"+/- {cv_match.iloc[0]['cv_mae_std']:.3f}."
        )
    return best_name, model, reason


def explain_model(
    model: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> tuple[pd.DataFrame, str]:
    """Return feature importance for the saved final model."""
    estimator = model.named_steps["model"]
    if hasattr(estimator, "feature_importances_"):
        importances = pd.DataFrame(
            {
                "feature": FEATURES,
                "importance": estimator.feature_importances_,
            }
        ).sort_values("importance", ascending=False)
        return importances, "Model-native feature importance from the final tree-based estimator."

    result = permutation_importance(
        model,
        X_test,
        y_test,
        n_repeats=15,
        random_state=RANDOM_STATE,
        scoring="neg_mean_absolute_error",
        n_jobs=1,
    )
    importances = pd.DataFrame(
        {
            "feature": FEATURES,
            "importance": result.importances_mean,
            "importance_std": result.importances_std,
        }
    ).sort_values("importance", ascending=False)
    return importances, "Permutation importance on the held-out test set."


def shap_example(model: Pipeline, example: pd.DataFrame) -> pd.DataFrame | None:
    """Compute SHAP values for one prediction when SHAP is installed."""
    estimator = model.named_steps["model"]
    if shap is None or not hasattr(estimator, "feature_importances_"):
        return None

    transformed = model.named_steps["preprocess"].transform(example)
    explainer = shap.TreeExplainer(estimator)
    values = explainer.shap_values(transformed)
    if isinstance(values, list):
        values = values[0]

    return pd.DataFrame(
        {
            "feature": FEATURES,
            "contribution": values[0],
            "direction": np.where(values[0] >= 0, "positive", "negative"),
        }
    ).sort_values("contribution", key=lambda series: series.abs(), ascending=False)


def sort_model_table(table: pd.DataFrame) -> pd.DataFrame:
    """Sort by MAE, then RMSE, then R2 as requested."""
    return table.sort_values(
        ["mae", "rmse", "r2"],
        ascending=[True, True, False],
    ).reset_index(drop=True)
