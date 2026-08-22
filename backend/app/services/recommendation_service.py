from typing import Any


def get_risk_level(score: float) -> str:
    if score < 50:
        return "High"
    if score < 75:
        return "Moderate"
    return "Low"


def generate_detailed_recommendations(features: dict[str, float], predicted_score: float) -> dict[str, Any]:
    lagging_areas = []
    actionable_steps = []

    checks = [
        ("internal_marks", "Internal Assessment Marks", features["internal_marks"], 75, "/100"),
        ("attendance_pct", "Classroom Attendance", features["attendance_pct"], 90, "%"),
        ("study_hours_week", "Weekly Study Commitment", features["study_hours_week"], 15, " hrs/week"),
        ("assignment_score", "Assignment Grades", features["assignment_score"], 80, "/100"),
        ("activity_score", "Academic Activity", features["activity_score"], 60, "/100"),
        ("prev_sem_cgpa", "Prior CGPA Foundation", features["prev_sem_cgpa"], 6, "/10"),
    ]

    for feature, label, value, target, unit in checks:
        if value < target:
            priority = "High" if feature in {"internal_marks", "attendance_pct", "study_hours_week"} else "Medium"
            lagging_areas.append(
                {
                    "feature": feature,
                    "label": label,
                    "status": "Needs Improvement",
                    "current_value": f"{value}{unit}",
                    "detail": f"{label} is below the configured intervention target of {target}{unit}.",
                    "priority": priority,
                }
            )
            actionable_steps.append(
                {
                    "title": f"Improve {label}",
                    "action": f"Work toward {target}{unit} through consistent academic planning.",
                    "impact": priority,
                    "tip": "Use this as a mentoring target, not as a guaranteed causal improvement.",
                }
            )

    if not lagging_areas:
        lagging_areas.append(
            {
                "feature": "none",
                "label": "Overall Performance",
                "status": "Excellent",
                "current_value": "Strong",
                "detail": "All tracked indicators are in a strong range.",
                "priority": "None",
            }
        )
        actionable_steps.append(
            {
                "title": "Maintain Momentum",
                "action": "Continue the current academic routine and review weekly progress.",
                "impact": "Medium",
                "tip": "Consistency is the main recommendation for this profile.",
            }
        )

    return {
        "flat_recommendations": [
            f"{step['title']}: {step['action']} (Tip: {step['tip']})"
            for step in actionable_steps[:3]
        ],
        "lagging_areas": lagging_areas,
        "actionable_steps": actionable_steps,
        "overall_summary": (
            f"Predicted score {predicted_score:.2f}. Recommendations are rule-based "
            "intervention prompts, not causal guarantees."
        ),
    }
