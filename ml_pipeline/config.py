from pathlib import Path

RANDOM_STATE = 42
TEST_SIZE = 0.20
CV_FOLDS = 5
GB_TUNING_ITERATIONS = 6
RF_TUNING_ITERATIONS = 2

TARGET = "final_exam_marks"
ID_COLUMN = "student_id"

FEATURES = [
    "attendance_pct",
    "study_hours_week",
    "assignment_score",
    "internal_marks",
    "prev_sem_cgpa",
    "activity_score",
]

EXPECTED_COLUMNS = [ID_COLUMN, *FEATURES, TARGET]

DOMAIN_RANGES = {
    "attendance_pct": (0, 100),
    "study_hours_week": (0, None),
    "assignment_score": (0, 100),
    "internal_marks": (0, 100),
    "prev_sem_cgpa": (0, 10),
    "activity_score": (0, 100),
    "final_exam_marks": (0, 100),
}

DATASET_CANDIDATES = [
    "dataset.csv",
    "student_marks_dataset_dirty.csv",
    "student_marks_dataset_1.csv",
    "student_marks.csv",
]

ARTIFACT_DIR = Path("artifacts")
PLOT_DIR = ARTIFACT_DIR / "plots"
MODEL_PATH = ARTIFACT_DIR / "final_model.pkl"
REPORT_PATH = ARTIFACT_DIR / "final_report.md"
