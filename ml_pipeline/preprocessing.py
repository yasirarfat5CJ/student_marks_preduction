from pathlib import Path
from typing import Any

import pandas as pd

from ml_pipeline.config import DATASET_CANDIDATES, DOMAIN_RANGES, EXPECTED_COLUMNS, FEATURES, ID_COLUMN, TARGET


def find_dataset() -> Path:
    """Find the expected student marks CSV in the current project folder."""
    for candidate in DATASET_CANDIDATES:
        path = Path(candidate)
        if path.exists():
            return path
    raise FileNotFoundError(
        "No dataset found. Expected one of: " + ", ".join(DATASET_CANDIDATES)
    )


def clean_and_validate(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Clean the raw data and return both the cleaned data and an audit log."""
    audit: dict[str, Any] = inspect_raw_data(df)

    df = df.copy()
    df.columns = df.columns.str.strip()

    unnamed_columns = [col for col in df.columns if col.startswith("Unnamed:")]
    if unnamed_columns:
        df = df.drop(columns=unnamed_columns)
    audit["removed_unnamed_columns"] = unnamed_columns

    missing_columns = [col for col in EXPECTED_COLUMNS if col not in df.columns]
    audit["missing_expected_columns"] = missing_columns
    if missing_columns:
        raise ValueError(f"Missing expected columns: {missing_columns}")

    audit["numeric_conversion_new_missing"] = convert_numeric_columns(df)

    rows_before_target_cleaning = len(df)
    df = df.dropna(subset=[TARGET])
    audit["target_rows_before_cleaning"] = rows_before_target_cleaning
    audit["target_rows_removed"] = rows_before_target_cleaning - len(df)
    audit["target_rows_remaining"] = len(df)
    audit["target_removal_reason"] = (
        "Rows with missing target were removed because supervised learning requires "
        "known final_exam_marks."
    )

    duplicate_count = int(df.duplicated().sum())
    df = df.drop_duplicates()
    audit["exact_duplicates_removed"] = duplicate_count
    audit["repeated_student_id_count"] = int(df[ID_COLUMN].duplicated().sum())

    df, domain_audit = remove_domain_invalid_rows(df)
    audit.update(domain_audit)

    audit["clean_shape"] = df.shape
    audit["clean_missing_count"] = df.isnull().sum().to_dict()
    audit["clean_missing_pct"] = (df.isnull().mean() * 100).round(2).to_dict()
    audit["describe"] = df[FEATURES + [TARGET]].describe().T
    audit["median"] = df[FEATURES + [TARGET]].median(numeric_only=True).to_dict()
    audit["skewness"] = df[FEATURES + [TARGET]].skew(numeric_only=True).to_dict()
    audit["correlation"] = df[FEATURES + [TARGET]].corr(numeric_only=True)
    return df, audit


def inspect_raw_data(df: pd.DataFrame) -> dict[str, Any]:
    """Capture the required first-look dataset inspection details."""
    return {
        "initial_shape": df.shape,
        "initial_columns": list(df.columns),
        "head": df.head().to_string(index=False),
        "tail": df.tail().to_string(index=False),
        "initial_dtypes": df.dtypes.astype(str).to_dict(),
        "initial_missing": df.isnull().sum().to_dict(),
        "initial_duplicate_count": int(df.duplicated().sum()),
    }


def convert_numeric_columns(df: pd.DataFrame) -> dict[str, int]:
    """Convert numeric fields and report how many missing values were introduced."""
    conversion_missing: dict[str, int] = {}
    for col in FEATURES + [TARGET]:
        before = int(df[col].isna().sum())
        df[col] = pd.to_numeric(df[col], errors="coerce")
        after = int(df[col].isna().sum())
        conversion_missing[col] = after - before
    return conversion_missing


def remove_domain_invalid_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Remove rows with impossible values instead of clipping them."""
    invalid_masks: dict[str, pd.Series] = {}
    invalid_counts: dict[str, int] = {}

    for col, (lower, upper) in DOMAIN_RANGES.items():
        mask = pd.Series(False, index=df.index)
        if lower is not None:
            mask = mask | (df[col] < lower)
        if upper is not None:
            mask = mask | (df[col] > upper)
        invalid_masks[col] = mask.fillna(False)
        invalid_counts[col] = int(invalid_masks[col].sum())

    invalid_any = pd.concat(invalid_masks.values(), axis=1).any(axis=1)
    audit = {
        "domain_invalid_counts": invalid_counts,
        "domain_invalid_records": int(invalid_any.sum()),
        "domain_invalid_student_ids": df.loc[invalid_any, ID_COLUMN].head(20).tolist(),
        "domain_invalid_rows_removed": int(invalid_any.sum()),
    }
    return df.loc[~invalid_any].copy(), audit


def iqr_outlier_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Summarize possible outliers without automatically removing them."""
    records = []
    for col in FEATURES + [TARGET]:
        series = df[col].dropna()
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        count = int(((series < lower) | (series > upper)).sum())
        records.append(
            {
                "feature": col,
                "lower_bound": lower,
                "upper_bound": upper,
                "iqr_outliers": count,
            }
        )
    return pd.DataFrame(records)
