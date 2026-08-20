import os
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path("/tmp/matplotlib-codex")))

import matplotlib.pyplot as plt
import pandas as pd

from src.config import FEATURES, PLOT_DIR, TARGET


def make_plots(df: pd.DataFrame) -> list[str]:
    """Create EDA plots and return the saved plot paths."""
    PLOT_DIR.mkdir(parents=True, exist_ok=True)
    plot_paths: list[str] = []

    for col in FEATURES + [TARGET]:
        plot_paths.append(make_distribution_plot(df, col))
        plot_paths.append(make_boxplot(df, col))

    for col in FEATURES:
        plot_paths.append(make_scatter_plot(df, col))

    plot_paths.append(make_correlation_heatmap(df))
    return plot_paths


def make_distribution_plot(df: pd.DataFrame, column: str) -> str:
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(df[column].dropna(), bins=30, color="#3b82f6", edgecolor="white")
    ax.set_title(f"Distribution: {column}")
    ax.set_xlabel(column)
    ax.set_ylabel("Count")
    return save_plot(fig, PLOT_DIR / f"distribution_{column}.png")


def make_boxplot(df: pd.DataFrame, column: str) -> str:
    fig, ax = plt.subplots(figsize=(8, 2.8))
    ax.boxplot(df[column].dropna(), vert=False)
    ax.set_title(f"Boxplot: {column}")
    ax.set_xlabel(column)
    return save_plot(fig, PLOT_DIR / f"boxplot_{column}.png")


def make_scatter_plot(df: pd.DataFrame, feature: str) -> str:
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.scatter(df[feature], df[TARGET], alpha=0.35, s=14, color="#0f766e")
    ax.set_title(f"{feature} vs {TARGET}")
    ax.set_xlabel(feature)
    ax.set_ylabel(TARGET)
    return save_plot(fig, PLOT_DIR / f"scatter_{feature}_vs_final_exam_marks.png")


def make_correlation_heatmap(df: pd.DataFrame) -> str:
    corr = df[FEATURES + [TARGET]].corr(numeric_only=True)
    fig, ax = plt.subplots(figsize=(9, 7))
    image = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)

    ax.set_xticks(range(len(corr.columns)))
    ax.set_yticks(range(len(corr.index)))
    ax.set_xticklabels(corr.columns, rotation=45, ha="right")
    ax.set_yticklabels(corr.index)

    for row in range(len(corr.index)):
        for col in range(len(corr.columns)):
            ax.text(col, row, f"{corr.iloc[row, col]:.2f}", ha="center", va="center", fontsize=8)

    fig.colorbar(image, ax=ax, fraction=0.046, pad=0.04)
    ax.set_title("Correlation heatmap")
    return save_plot(fig, PLOT_DIR / "correlation_heatmap.png")


def save_plot(fig: plt.Figure, path: Path) -> str:
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return str(path)
