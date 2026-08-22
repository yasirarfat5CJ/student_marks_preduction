from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd

from backend.app.core.config import get_settings
from backend.app.core.database import Base, engine
from backend.app.models import Prediction, StudentProfile, User, WhatIfPrediction
from backend.app.routers import admin, auth, predictions, students, what_if
from backend.app.services.prediction_service import prediction_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For hackathon/dev convenience. In production, run Alembic migrations instead.
    Base.metadata.create_all(bind=engine)
    prediction_service.load_model()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="EduPredict AI API",
        description="Secure Student Marks Prediction API with JWT auth and MySQL support.",
        version="2.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(students.router)
    app.include_router(predictions.router)
    app.include_router(what_if.router)
    app.include_router(admin.router)
    app.mount(
        "/visualization-files",
        StaticFiles(directory=settings.plot_dir, check_dir=False),
        name="visualization-files",
    )

    @app.get("/")
    def health_check():
        return {
            "status": "online",
            "app_name": "EduPredict AI",
            "message": "Secure prediction API is running.",
        }

    @app.get("/metrics")
    def public_metrics():
        models = []
        feature_importance = []
        if settings.comparison_path.exists():
            models = pd.read_csv(settings.comparison_path).to_dict(orient="records")
        if settings.importance_path.exists():
            feature_importance = pd.read_csv(settings.importance_path).to_dict(orient="records")
        return {
            "selected_model": settings.model_name,
            "models": models,
            "feature_importance": feature_importance,
        }

    @app.get("/visualizations")
    def public_visualizations():
        if not settings.plot_dir.exists():
            return {"plots": []}

        plots = [
            {
                "name": path.stem.replace("_", " ").title(),
                "url": f"/visualization-files/{path.name}",
            }
            for path in sorted(settings.plot_dir.glob("*.png"))
        ]
        return {"plots": plots}

    return app


app = create_app()
