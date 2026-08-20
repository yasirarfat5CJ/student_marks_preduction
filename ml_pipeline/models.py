from typing import Any

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, RandomizedSearchCV, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor

from ml_pipeline.config import CV_FOLDS, FEATURES, GB_TUNING_ITERATIONS, RANDOM_STATE, RF_TUNING_ITERATIONS

try:
    from xgboost import XGBRegressor
except ImportError:  # pragma: no cover - optional dependency
    XGBRegressor = None


def numeric_pipeline(scale: bool) -> ColumnTransformer:
    """Build preprocessing for numeric input features."""
    steps: list[tuple[str, Any]] = [("imputer", SimpleImputer(strategy="median"))]
    if scale:
        steps.append(("scaler", StandardScaler()))
    return ColumnTransformer([("numeric", Pipeline(steps), FEATURES)], remainder="drop")


def build_models() -> dict[str, Pipeline]:
    """Create all baseline and candidate regression models."""
    models: dict[str, Pipeline] = {
        "Dummy Regressor": Pipeline(
            [
                ("preprocess", numeric_pipeline(scale=False)),
                ("model", DummyRegressor(strategy="mean")),
            ]
        ),
        "Linear Regression": Pipeline(
            [
                ("preprocess", numeric_pipeline(scale=True)),
                ("model", LinearRegression()),
            ]
        ),
        "Decision Tree": Pipeline(
            [
                ("preprocess", numeric_pipeline(scale=False)),
                ("model", DecisionTreeRegressor(random_state=RANDOM_STATE)),
            ]
        ),
        "Random Forest": Pipeline(
            [
                ("preprocess", numeric_pipeline(scale=False)),
                (
                    "model",
                    RandomForestRegressor(
                        n_estimators=50,
                        random_state=RANDOM_STATE,
                        n_jobs=1,
                    ),
                ),
            ]
        ),
        "Gradient Boosting": Pipeline(
            [
                ("preprocess", numeric_pipeline(scale=False)),
                ("model", GradientBoostingRegressor(random_state=RANDOM_STATE)),
            ]
        ),
    }

    if XGBRegressor is not None:
        models["XGBoost"] = Pipeline(
            [
                ("preprocess", numeric_pipeline(scale=False)),
                (
                    "model",
                    XGBRegressor(
                        objective="reg:squarederror",
                        random_state=RANDOM_STATE,
                        n_estimators=50,
                        n_jobs=1,
                    ),
                ),
            ]
        )
    return models


def tune_candidates(X_train: pd.DataFrame, y_train: pd.Series) -> tuple[pd.DataFrame, dict[str, Pipeline]]:
    """Tune strong candidate models with RandomizedSearchCV."""
    searches = build_tuning_searches()
    rows = []
    tuned_models = {}

    for name, search in searches.items():
        search.fit(X_train, y_train)
        rows.append(
            {
                "model": name,
                "best_cv_mae": -search.best_score_,
                "best_params": search.best_params_,
            }
        )
        tuned_models[name] = search.best_estimator_

    return pd.DataFrame(rows).sort_values("best_cv_mae"), tuned_models


def build_tuning_searches() -> dict[str, RandomizedSearchCV]:
    """Define compact tuning searches that run comfortably in this environment."""
    searches: dict[str, RandomizedSearchCV] = {
        "Random Forest Tuned": RandomizedSearchCV(
            Pipeline(
                [
                    ("preprocess", numeric_pipeline(scale=False)),
                    ("model", RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=1)),
                ]
            ),
            param_distributions={
                "model__n_estimators": [40, 60],
                "model__max_depth": [6, 10],
                "model__min_samples_split": [2, 6, 10],
                "model__min_samples_leaf": [1, 2, 4],
                "model__max_features": [1.0, "sqrt", "log2"],
            },
            n_iter=RF_TUNING_ITERATIONS,
            scoring="neg_mean_absolute_error",
            cv=KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE),
            random_state=RANDOM_STATE,
            n_jobs=1,
        ),
        "Gradient Boosting Tuned": RandomizedSearchCV(
            Pipeline(
                [
                    ("preprocess", numeric_pipeline(scale=False)),
                    ("model", GradientBoostingRegressor(random_state=RANDOM_STATE)),
                ]
            ),
            param_distributions={
                "model__n_estimators": [80, 120, 150],
                "model__learning_rate": [0.02, 0.03, 0.05, 0.08, 0.1],
                "model__max_depth": [2, 3, 4, 5],
                "model__min_samples_split": [2, 4, 6, 10],
                "model__min_samples_leaf": [1, 2, 3, 4],
                "model__subsample": [0.75, 0.85, 0.95, 1.0],
            },
            n_iter=GB_TUNING_ITERATIONS,
            scoring="neg_mean_absolute_error",
            cv=KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE),
            random_state=RANDOM_STATE,
            n_jobs=1,
        ),
    }

    if XGBRegressor is not None:
        searches["XGBoost Tuned"] = RandomizedSearchCV(
            Pipeline(
                [
                    ("preprocess", numeric_pipeline(scale=False)),
                    ("model", XGBRegressor(objective="reg:squarederror", random_state=RANDOM_STATE, n_jobs=1)),
                ]
            ),
            param_distributions={
                "model__n_estimators": [150, 250, 400],
                "model__learning_rate": [0.03, 0.05, 0.08, 0.1],
                "model__max_depth": [2, 3, 4, 5],
                "model__subsample": [0.75, 0.9, 1.0],
                "model__colsample_bytree": [0.75, 0.9, 1.0],
                "model__min_child_weight": [1, 3, 5],
            },
            n_iter=GB_TUNING_ITERATIONS,
            scoring="neg_mean_absolute_error",
            cv=KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE),
            random_state=RANDOM_STATE,
            n_jobs=1,
        )

    return searches


def feature_engineering_cv(X_train: pd.DataFrame, y_train: pd.Series) -> pd.DataFrame:
    """Compare original features against a small engineered-feature experiment."""
    engineered = X_train.copy()
    engineered["assessment_average"] = engineered[["assignment_score", "internal_marks"]].mean(axis=1)
    engineered["performance_trend"] = engineered["internal_marks"] - (engineered["prev_sem_cgpa"] * 10)

    base_model = Pipeline(
        [
            ("preprocess", numeric_pipeline(scale=False)),
            ("model", GradientBoostingRegressor(n_estimators=60, random_state=RANDOM_STATE)),
        ]
    )

    engineered_features = FEATURES + ["assessment_average", "performance_trend"]
    engineered_preprocess = ColumnTransformer(
        [("numeric", Pipeline([("imputer", SimpleImputer(strategy="median"))]), engineered_features)],
        remainder="drop",
    )
    engineered_model = Pipeline(
        [
            ("preprocess", engineered_preprocess),
            ("model", GradientBoostingRegressor(n_estimators=60, random_state=RANDOM_STATE)),
        ]
    )

    cv = KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    rows = []
    for label, data, model in [
        ("Original features", X_train, base_model),
        ("Original + engineered features", engineered, engineered_model),
    ]:
        mae = -cross_validate(
            model,
            data,
            y_train,
            cv=cv,
            scoring="neg_mean_absolute_error",
            n_jobs=1,
        )["test_score"]
        rows.append({"feature_set": label, "cv_mae_mean": mae.mean(), "cv_mae_std": mae.std()})

    return pd.DataFrame(rows)
