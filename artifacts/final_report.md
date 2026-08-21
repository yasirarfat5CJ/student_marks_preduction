# Student Final Exam Marks Prediction Report

## Dataset

- Dataset file: `dataset.csv`
- Initial shape: (15446, 8)
- Clean shape: (15143, 8)
- Predictive feature count: 6
- Target variable: `final_exam_marks`
- Identifier retained for traceability but excluded from `X`: `student_id`
- Missing expected columns: []
- Accidental index columns removed: []
- Numeric conversion new missing values: `{'attendance_pct': 0, 'study_hours_week': 0, 'assignment_score': 0, 'internal_marks': 0, 'prev_sem_cgpa': 0, 'activity_score': 0, 'final_exam_marks': 0}`
- Exact duplicate rows removed: 303
- Repeated student IDs retained for review count: 143
- Rows before target cleaning: 15446
- Rows removed for missing target: 0
- Rows remaining after target cleaning: 15446
- Domain-invalid records removed: 0
- Remaining missing values are handled inside training pipelines using median imputation for input features only.

## Initial Inspection

Columns: `['student_id', 'attendance_pct', 'study_hours_week', 'assignment_score', 'internal_marks', 'prev_sem_cgpa', 'activity_score', 'final_exam_marks']`

Data types:

```json
{
  "student_id": "object",
  "attendance_pct": "float64",
  "study_hours_week": "float64",
  "assignment_score": "float64",
  "internal_marks": "float64",
  "prev_sem_cgpa": "float64",
  "activity_score": "float64",
  "final_exam_marks": "float64"
}
```

Initial missing values:

```json
{
  "student_id": 0,
  "attendance_pct": 401,
  "study_hours_week": 601,
  "assignment_score": 671,
  "internal_marks": 341,
  "prev_sem_cgpa": 739,
  "activity_score": 656,
  "final_exam_marks": 0
}
```

First 5 rows:

```text
student_id  attendance_pct  study_hours_week  assignment_score  internal_marks  prev_sem_cgpa  activity_score  final_exam_marks
    S06781            94.5              24.1              70.5           74.10           8.76            53.8             91.22
    S09121            92.4              27.1              76.0           91.80            NaN            84.7             89.68
    S04870            74.2              11.2              71.9           57.80           7.15            76.0             71.08
    S02579            65.1               8.9              52.5           49.81           6.51            25.7             45.56
    S08169            89.0              24.1              85.3           90.40           8.96            74.2             95.55
```

Last 5 rows:

```text
student_id  attendance_pct  study_hours_week  assignment_score  internal_marks  prev_sem_cgpa  activity_score  final_exam_marks
    S12896           100.0              40.0             100.0          100.00          10.00           100.0            100.00
    S12764             NaN              10.3              72.0           73.69           5.60            73.1             63.92
    S10906            72.5               6.8              61.4           63.51           5.99            50.7             54.14
    S13981            88.9              32.5              93.1           94.96           7.79            81.0             90.64
    S10236            99.2              20.8              79.3           78.44           7.73            63.5             67.92
```

## Validation And Cleaning

The expected schema was verified after stripping leading/trailing column whitespace. `student_id` was never used as a predictive feature. Numeric columns were converted with `pd.to_numeric(errors="coerce")` and newly introduced missing values were counted. The target was not imputed; any missing target rows would be removed because supervised training needs observed labels.

Domain validation used valid academic ranges. Invalid values were removed instead of clipped. Prediction-time clipping is reported separately because regressors can occasionally predict slightly outside 0-100.

## Statistical Summary

| feature | count | mean | std | min | 25% | 50% | 75% | max | median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attendance_pct | 14746 | 74.9869 | 12.885 | 40 | 66.3 | 75.3 | 84.2 | 100 | 75.3 |
| study_hours_week | 14551 | 15.7169 | 8.16876 | 1.5 | 9.8 | 15.5 | 21.2 | 40 | 15.5 |
| assignment_score | 14481 | 69.3456 | 15.5128 | 30 | 58.6 | 70 | 80.7 | 100 | 70 |
| internal_marks | 14813 | 65.6462 | 16.4298 | 30 | 54.4 | 66.1 | 77.18 | 100 | 66.1 |
| prev_sem_cgpa | 14421 | 7.0462 | 1.38689 | 4 | 6.07 | 7.02 | 8.08 | 10 | 7.02 |
| activity_score | 14501 | 58.4771 | 17.0435 | 0 | 47.2 | 58.7 | 70.1 | 100 | 58.7 |
| final_exam_marks | 15143 | 68.2566 | 18.3669 | 0 | 56.12 | 69.51 | 81.55 | 100 | 69.51 |

## EDA

- Plot files generated: 21 in `artifacts/plots`.
- Target mean: 68.257
- Target median: 69.510
- Target standard deviation: 18.367
- Target minimum: 0.000
- Target maximum: 100.000
- Target skewness: -0.338
- Strongest absolute correlations with `final_exam_marks`: {'internal_marks': 0.838, 'assignment_score': 0.806, 'prev_sem_cgpa': 0.804, 'study_hours_week': 0.748, 'attendance_pct': 0.739, 'activity_score': 0.687}
- Signed correlations with `final_exam_marks`: {'internal_marks': 0.838, 'assignment_score': 0.806, 'prev_sem_cgpa': 0.804, 'study_hours_week': 0.748, 'attendance_pct': 0.739, 'activity_score': 0.687}

Correlation describes association only; it does not prove causation.

## Outliers

| feature | lower_bound | upper_bound | iqr_outliers |
| --- | --- | --- | --- |
| attendance_pct | 39.45 | 111.05 | 0 |
| study_hours_week | -7.3 | 38.3 | 63 |
| assignment_score | 25.45 | 113.85 | 0 |
| internal_marks | 20.23 | 111.35 | 0 |
| prev_sem_cgpa | 3.055 | 11.095 | 0 |
| activity_score | 12.85 | 104.45 | 83 |
| final_exam_marks | 17.975 | 119.695 | 57 |

Outliers identified by IQR were treated as rare-but-possible observations unless they violated domain ranges. They were not removed simply to improve model performance.

## Leakage Prevention

The model uses only information plausibly available before the final exam. `final_exam_marks` is separated before modeling and is never included in preprocessing for input features. All imputers and scalers are fitted inside Scikit-learn pipelines using training folds only.

## Models

- Dummy Regressor: baseline that predicts the training-set mean.
- Linear Regression: interpretable linear benchmark.
- Decision Tree: nonlinear baseline, but can overfit.
- Random Forest: bagged tree ensemble suitable for tabular data.
- Gradient Boosting: sequential ensemble that can model nonlinear structure.
- XGBoost was skipped because `xgboost` is not installed. Install with `pip install xgboost` to include it.

## Test Results

| model | mae | mse | rmse | r2 | train_r2 |
| --- | --- | --- | --- | --- | --- |
| Gradient Boosting | 5.511 | 50.504 | 7.107 | 0.855 | 0.858 |
| Random Forest | 5.604 | 52.444 | 7.242 | 0.850 | 0.977 |
| Linear Regression | 5.631 | 51.787 | 7.196 | 0.852 | 0.841 |
| Decision Tree | 7.812 | 100.883 | 10.044 | 0.711 | 1.000 |
| Dummy Regressor | 15.159 | 348.893 | 18.679 | -0.000 | 0.000 |

### How To Read The Metrics

- MAE means Mean Absolute Error. It is the average prediction mistake in marks. Lower is better. MAE = 6 means the model is usually off by about 6 marks.
- MSE means Mean Squared Error. It squares mistakes, so big mistakes are punished more strongly. Lower is better.
- RMSE means Root Mean Squared Error. It is also in marks, like MAE, but it reacts more to large errors. Lower is better.
- R2 explains how much target variation the model captures compared with predicting the average mark. Higher is better, but R2 is not an accuracy percentage.
- train_r2 shows performance on training data. If train_r2 is much higher than test R2, the model may be overfitting.

### Why Models Performed Differently

- Best test model: Gradient Boosting with MAE 5.511, RMSE 7.107, and R2 0.855. It gives the lowest error on unseen test data.
- Highest-error model: Dummy Regressor with MAE 15.159. This is expected when the model is too simple or ignores useful feature patterns.
- Gradient Boosting performs well because it builds many small trees one after another. Each tree tries to fix previous mistakes, so it captures nonlinear patterns without memorizing the data too much. Here its train R2 (0.858) and test R2 (0.855) are close, which is a good sign.
- Random Forest has low test error, but its train R2 (0.977) is much higher than test R2 (0.850). That means it learned training data very strongly and may overfit a little.
- Linear Regression is strong because the features have clear positive relationships with final marks. Its MAE (5.631) is close to the best model, so much of the dataset pattern is approximately linear.
- Decision Tree has train R2 (1.000) but weaker test R2 (0.711). A single deep tree can memorize training rows, so it often gives higher error on new students.
- Dummy Regressor predicts the average mark for everyone. Its high MAE (15.159) shows the real ML models are learning useful information from the features.

## Cross Validation

| model | cv_mae_mean | cv_mae_std | cv_rmse_mean | cv_rmse_std | cv_r2_mean | cv_r2_std |
| --- | --- | --- | --- | --- | --- | --- |
| Gradient Boosting | 5.592 | 0.100 | 7.198 | 0.138 | 0.845 | 0.005 |
| Linear Regression | 5.683 | 0.107 | 7.306 | 0.145 | 0.840 | 0.005 |
| Random Forest | 5.695 | 0.089 | 7.325 | 0.100 | 0.839 | 0.004 |
| Decision Tree | 7.977 | 0.130 | 10.308 | 0.132 | 0.682 | 0.009 |
| Dummy Regressor | 14.760 | 0.158 | 18.290 | 0.141 | -0.001 | 0.001 |

Five-fold cross-validation trains and validates the model five times using different splits of the training data. This is more reliable than trusting one split only. The best average CV model was Gradient Boosting with CV MAE 5.592 +/- 0.100. A small standard deviation means performance is stable across folds. The final test set was still kept separate until final evaluation.

## Hyperparameter Tuning

RandomizedSearchCV tested 6 Gradient Boosting combinations and 2 Random Forest combinations using cross-validation on the training data only.

| model | best_cv_mae | best_params |
| --- | --- | --- |
| Random Forest Tuned | 5.55791 | {'model__n_estimators': 60, 'model__min_samples_split': 10, 'model__min_samples_leaf': 1, 'model__max_features': 'sqrt', 'model__max_depth': 10} |
| Gradient Boosting Tuned | 5.58594 | {'model__subsample': 1.0, 'model__n_estimators': 80, 'model__min_samples_split': 2, 'model__min_samples_leaf': 2, 'model__max_depth': 4, 'model__learning_rate': 0.1} |

Tuned model test performance:

| model | mae | mse | rmse | r2 | train_r2 |
| --- | --- | --- | --- | --- | --- |
| Gradient Boosting Tuned | 5.478 | 49.878 | 7.062 | 0.857 | 0.865 |
| Random Forest Tuned | 5.492 | 49.818 | 7.058 | 0.857 | 0.895 |

## Feature Engineering Experiment

| feature_set | cv_mae_mean | cv_mae_std |
| --- | --- | --- |
| Original features | 5.630 | 0.098 |
| Original + engineered features | 5.574 | 0.085 |

Engineered features were not automatically added to the final model.

## Final Model

- Selected model: Gradient Boosting Tuned
- Saved pipeline: `artifacts/final_model.pkl`
- Selection rationale: Gradient Boosting Tuned had the best balanced final-test ranking by MAE/RMSE/R2 among the evaluated candidates. Cross-validation was used before final test evaluation to reduce reliance on a single split. Its untuned family CV MAE was 5.592 +/- 0.100.

Overfitting was checked by comparing train R2 and test R2. Selection did not rely on training score alone.

## Explainability

Model-native feature importance from the final tree-based estimator.

| feature | importance |
| --- | --- |
| internal_marks | 0.556255 |
| prev_sem_cgpa | 0.188163 |
| assignment_score | 0.137459 |
| study_hours_week | 0.0616397 |
| attendance_pct | 0.0356548 |
| activity_score | 0.0208282 |

SHAP values were computed for the example prediction.

| feature | contribution | direction |
| --- | --- | --- |
| internal_marks | 5.1056 | positive |
| assignment_score | 3.05103 | positive |
| prev_sem_cgpa | 2.63783 | positive |
| activity_score | 2.5847 | positive |
| attendance_pct | 2.40833 | positive |
| study_hours_week | -0.855143 | negative |

Feature importance and SHAP-style contributions describe model behavior, not causal effects.

## Prediction Example

Input: attendance=90, study hours=15, assignment=85, internal=80, previous CGPA=8.2, activity=84.

```json
{
  "raw_prediction": 83.22343042385359,
  "predicted_final_marks": 83.22343042385359,
  "was_clipped_to_valid_range": false
}
```

If a raw regression prediction falls outside 0-100, the returned prediction is clipped to the valid range and `was_clipped_to_valid_range` is set to true.

## Reproducibility

- Dataset version: `dataset.csv` loaded from the working directory.
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
