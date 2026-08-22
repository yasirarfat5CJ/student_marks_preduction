from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")


class Settings(BaseSettings):
    database_url: str = Field(
        default="mysql+pymysql://root:1531@localhost:3306/student_prediction",
        alias="DATABASE_URL",
    )
    secret_key: str = Field(
        default="change-this-secret-at-least-32-bytes-long",
        alias="SECRET_KEY",
    )
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    model_path: Path = ROOT_DIR / "artifacts" / "final_model.pkl"
    model_name: str = "Gradient Boosting"
    comparison_path: Path = ROOT_DIR / "artifacts" / "model_comparison.csv"
    importance_path: Path = ROOT_DIR / "artifacts" / "feature_importance.csv"
    plot_dir: Path = ROOT_DIR / "artifacts" / "plots"

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
