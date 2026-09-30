"""
FitConnect — AI Recommendation Engine
=======================================
Provides personalised fitness recommendations for campus students using
a **dual-strategy architecture**:

  1. **ML-based** — If a trained Scikit-learn model exists, it predicts
     the best activity, duration, frequency, intensity, and explanation
     tag from the user's profile features.

  2. **Rule-based fallback** — A deterministic heuristic engine that
     produces equally structured recommendations when no trained model
     is available.  This is the **baseline** that ships out of the box.

Both strategies produce the same output schema so the API consumer is
unaware of which strategy was used (other than a ``strategy`` field).

DISCLAIMER
----------
This module does **not** provide medical advice, diagnose health
conditions, or replace professional medical guidance.  All suggestions
are general fitness recommendations for healthy college students.
"""

from __future__ import annotations

import json
import math
import os
import warnings
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import List, Optional

import pandas as pd

warnings.filterwarnings("ignore", category=UserWarning)

# ──────────────────────────────────────────────────────────────────────
# Paths & Lazy Model Loading
# ──────────────────────────────────────────────────────────────────────
AI_DIR = Path(__file__).resolve().parent
MODEL_PATH = AI_DIR / "models" / "recommendation_model.joblib"

_MODEL_BUNDLE = None   # cached after first load


def _load_model():
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is not None:
        return _MODEL_BUNDLE
    if not MODEL_PATH.exists():
        return None
    try:
        import joblib
        _MODEL_BUNDLE = joblib.load(str(MODEL_PATH))
        return _MODEL_BUNDLE
    except Exception as e:
        print(f"[AI] Failed to load model: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────
# MET table for calorie estimation
# ──────────────────────────────────────────────────────────────────────
MET = {
    "Walking": 3.5, "Running": 9.0, "Cycling": 7.5, "Gym": 6.0,
    "Yoga": 3.2, "Cricket": 5.2, "Football": 8.5, "Basketball": 8.0,
    "Badminton": 5.8, "Other": 4.5,
}


def _est_calories(activity: str, duration: int, intensity: str,
                  weight: float = 68.0) -> int:
    base = MET.get(activity, 4.5)
    mult = {"Low": 0.85, "Moderate": 1.0, "High": 1.25}.get(intensity, 1.0)
    met = base * mult
    return round((met * 3.5 * weight / 200) * duration)


# ──────────────────────────────────────────────────────────────────────
# Output data classes
# ──────────────────────────────────────────────────────────────────────
@dataclass
class RecommendationItem:
    """A single actionable fitness recommendation."""
    activity: str
    duration_minutes: int
    frequency_days_per_week: int
    intensity: str                          # Low / Moderate / High
    weekly_target_minutes: int
    estimated_calories_per_session: int
    explanation: str
    gradual_target: str                     # short progressive goal text


@dataclass
class RecommendationResult:
    """Full recommendation payload returned to the API."""
    strategy: str                           # "ml" | "rule_based"
    sedentary_risk: str                     # Low / Moderate / High
    daily_deficit_minutes: int
    message: str
    recommendations: List[RecommendationItem]
    model_confidence: Optional[float] = None
    disclaimer: str = (
        "These are general fitness suggestions and do not constitute "
        "medical advice.  Consult a healthcare professional before "
        "starting any new exercise programme."
    )

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


# ──────────────────────────────────────────────────────────────────────
# User profile input (what we receive from the DB / API)
# ──────────────────────────────────────────────────────────────────────
@dataclass
class UserProfile:
    age: int = 20
    weight_kg: float = 68.0
    height_cm: float = 175.0
    bmi: float = 0.0
    fitness_level: str = "Intermediate"     # Beginner / Intermediate / Advanced
    fitness_goal: str = "Improve Overall Fitness"
    preferred_activities: list = field(default_factory=lambda: ["Running", "Gym"])
    available_minutes: int = 45
    available_days_per_week: int = 5
    current_activity_days: int = 0          # how many days active in last 7d
    current_avg_duration: int = 0           # avg session duration last 7d
    current_streak: int = 0

    def __post_init__(self):
        if self.bmi <= 0 and self.height_cm > 0:
            h = self.height_cm / 100
            self.bmi = round(self.weight_kg / (h * h), 1)


# ──────────────────────────────────────────────────────────────────────
# Explanation templates (human-readable)
# ──────────────────────────────────────────────────────────────────────
EXPLANATION_TEXT = {
    "ramp_up": (
        "You're getting started — the best strategy is to gradually "
        "increase both session length and weekly frequency so the habit "
        "sticks without overwhelming you."
    ),
    "maintain": (
        "You've built a solid routine.  Keep your current volume steady "
        "and consider small intensity progressions to keep improving."
    ),
    "intensity_boost": (
        "Your consistency is excellent!  Now focus on increasing workout "
        "intensity — add intervals, heavier weights, or faster tempo."
    ),
    "frequency_boost": (
        "Adding more active days will spread your training load evenly "
        "and improve weekly calorie expenditure."
    ),
    "recovery_focus": (
        "Balance is key — include low-impact recovery sessions like "
        "yoga or brisk walking to avoid overtraining."
    ),
    "sport_specific": (
        "Competition-focused training: combine sport-specific drills "
        "with endurance and strength conditioning."
    ),
    "stress_relief": (
        "Mind-body activities such as yoga, walking, and stretching are "
        "effective at reducing academic stress and improving focus."
    ),
    "variety_mix": (
        "Mixing different activity types prevents monotony, reduces "
        "injury risk, and keeps motivation high."
    ),
}

GRADUAL_TARGET_TEXT = {
    "ramp_up":         "Add 5 minutes to each session and 1 extra active day every 2 weeks",
    "maintain":        "Sustain current routine; try increasing intensity by one level this month",
    "intensity_boost": "Introduce interval training or increase resistance by 10 % biweekly",
    "frequency_boost": "Add 1 active day per week until you reach your availability target",
    "recovery_focus":  "Include 1–2 low-intensity recovery sessions per week",
    "sport_specific":  "Add sport drills 2× per week alongside general conditioning",
    "stress_relief":   "Schedule 15–20 min mind-body activity daily as a study break",
    "variety_mix":     "Rotate between 2–3 activity types throughout the week",
}


# ──────────────────────────────────────────────────────────────────────
# GOAL → ACTIVITY AFFINITY (used by rule-based engine)
# ──────────────────────────────────────────────────────────────────────
_GOAL_AFFINITY = {
    "Beat Sedentary Routine":                  ["Walking", "Cycling", "Yoga", "Badminton"],
    "Beat Sedentary Routine & Build Stamina":  ["Running", "Walking", "Cycling", "Badminton", "Gym"],
    "Weight Loss & Active Calorie Deficit":    ["Running", "Cycling", "Gym", "Badminton", "Football"],
    "Muscle Building & Strength Conditioning": ["Gym", "Running", "Basketball"],
    "Prepare for Inter-College Sports Meet":   ["Running", "Football", "Cricket", "Basketball", "Cycling"],
    "Relieve Study Stress":                    ["Yoga", "Walking", "Cycling", "Badminton"],
    "Improve Overall Fitness":                 ["Running", "Cycling", "Gym", "Badminton", "Walking", "Yoga"],
    "Flexibility & Mobility":                  ["Yoga", "Walking"],
}


# ══════════════════════════════════════════════════════════════════════
#  STRATEGY 1 — Rule-Based Baseline
# ══════════════════════════════════════════════════════════════════════
def _rule_based_recommend(profile: UserProfile) -> RecommendationResult:
    """Deterministic rule engine.  No ML required."""

    # ── Sedentary risk ──
    target_min = profile.available_minutes
    today_min = profile.current_avg_duration * min(profile.current_activity_days, 1)
    deficit = max(0, target_min - today_min)

    if profile.current_activity_days >= 4 and profile.current_avg_duration >= target_min * 0.7:
        risk = "Low"
    elif profile.current_activity_days >= 2:
        risk = "Moderate"
    else:
        risk = "High"

    # ── Choose activities ──
    goal_acts = _GOAL_AFFINITY.get(profile.fitness_goal, ["Walking", "Gym", "Running"])
    preferred = profile.preferred_activities or ["Walking"]
    # Prioritise overlap between preferred & goal-aligned
    overlap = [a for a in preferred if a in goal_acts]
    candidates = (overlap or goal_acts)[:3]

    # ── Determine recommended tag ──
    level = profile.fitness_level
    if level == "Beginner" and profile.current_activity_days <= 2:
        tag = "ramp_up"
    elif profile.fitness_goal in ("Relieve Study Stress", "Flexibility & Mobility"):
        tag = "stress_relief"
    elif profile.fitness_goal == "Prepare for Inter-College Sports Meet":
        tag = "sport_specific"
    elif profile.current_streak >= 14 and level == "Advanced":
        tag = "intensity_boost"
    elif profile.current_activity_days < profile.available_days_per_week - 1:
        tag = "frequency_boost"
    elif profile.current_avg_duration >= profile.available_minutes * 0.85:
        tag = "maintain"
    else:
        tag = "ramp_up"

    # ── Duration ──
    if level == "Beginner":
        base_dur = min(25, profile.available_minutes)
    elif level == "Intermediate":
        base_dur = min(35, profile.available_minutes)
    else:
        base_dur = min(50, profile.available_minutes)
    # If already training longer, push slightly
    if profile.current_avg_duration >= base_dur:
        base_dur = min(base_dur + 5, profile.available_minutes)

    # ── Frequency ──
    if level == "Beginner":
        freq = min(max(profile.current_activity_days + 1, 3), profile.available_days_per_week)
    elif level == "Intermediate":
        freq = min(max(profile.current_activity_days + 1, 4), profile.available_days_per_week)
    else:
        freq = min(max(profile.current_activity_days, 5), profile.available_days_per_week)

    # ── Intensity ──
    intensity_map = {"Beginner": "Low", "Intermediate": "Moderate", "Advanced": "High"}
    base_intensity = intensity_map.get(level, "Moderate")
    if tag == "intensity_boost" and base_intensity != "High":
        base_intensity = "High" if level == "Advanced" else "Moderate"

    # ── Build recommendation items ──
    recs: List[RecommendationItem] = []
    for act in candidates:
        dur = base_dur
        # Yoga / Walking get slightly shorter recommendations
        if act in ("Yoga", "Walking") and dur > 30:
            dur = min(dur, 30)
        cal = _est_calories(act, dur, base_intensity, profile.weight_kg)
        recs.append(RecommendationItem(
            activity=act,
            duration_minutes=dur,
            frequency_days_per_week=freq,
            intensity=base_intensity,
            weekly_target_minutes=dur * freq,
            estimated_calories_per_session=cal,
            explanation=EXPLANATION_TEXT.get(tag, EXPLANATION_TEXT["ramp_up"]),
            gradual_target=GRADUAL_TARGET_TEXT.get(tag, GRADUAL_TARGET_TEXT["ramp_up"]),
        ))

    msg = _build_message(profile, risk, deficit, tag)

    return RecommendationResult(
        strategy="rule_based",
        sedentary_risk=risk,
        daily_deficit_minutes=deficit,
        message=msg,
        recommendations=recs,
    )


# ══════════════════════════════════════════════════════════════════════
#  STRATEGY 2 — ML-Based Recommendation
# ══════════════════════════════════════════════════════════════════════
def _ml_recommend(profile: UserProfile, bundle: dict) -> RecommendationResult:
    """Uses trained Scikit-learn pipelines for prediction."""

    FITNESS_LEVEL_MAP = {"Beginner": 0, "Intermediate": 1, "Advanced": 2}
    primary_pref = (profile.preferred_activities or ["Walking"])[0]

    feature_row = pd.DataFrame([{
        "age":                    profile.age,
        "weight_kg":              profile.weight_kg,
        "height_cm":              profile.height_cm,
        "bmi":                    profile.bmi,
        "fitness_level":          FITNESS_LEVEL_MAP.get(profile.fitness_level, 1),
        "fitness_goal":           profile.fitness_goal,
        "preferred_activity":     primary_pref,
        "available_minutes":      profile.available_minutes,
        "available_days_per_week": profile.available_days_per_week,
        "current_activity_days":  profile.current_activity_days,
        "current_avg_duration":   profile.current_avg_duration,
        "current_streak":         profile.current_streak,
    }])

    # Predictions
    act_idx  = bundle["activity_pipe"].predict(feature_row)[0]
    int_idx  = bundle["intensity_pipe"].predict(feature_row)[0]
    tag_idx  = bundle["tag_pipe"].predict(feature_row)[0]
    duration = max(10, round(bundle["duration_pipe"].predict(feature_row)[0]))
    freq     = max(2, min(7, round(bundle["frequency_pipe"].predict(feature_row)[0])))

    act_name = bundle["le_activity"].inverse_transform([act_idx])[0]
    intensity = bundle["le_intensity"].inverse_transform([int_idx])[0]
    tag       = bundle["le_tag"].inverse_transform([tag_idx])[0]

    # Confidence (Random Forest probability)
    try:
        proba = bundle["activity_pipe"].predict_proba(feature_row)[0]
        confidence = round(float(max(proba)), 3)
    except Exception:
        confidence = None

    # Clamp duration to available time
    duration = min(duration, profile.available_minutes)
    freq = min(freq, profile.available_days_per_week)

    cal = _est_calories(act_name, duration, intensity, profile.weight_kg)

    # Sedentary risk
    target_min = profile.available_minutes
    today_min = profile.current_avg_duration * min(profile.current_activity_days, 1)
    deficit = max(0, target_min - today_min)
    if profile.current_activity_days >= 4 and profile.current_avg_duration >= target_min * 0.7:
        risk = "Low"
    elif profile.current_activity_days >= 2:
        risk = "Moderate"
    else:
        risk = "High"

    rec_item = RecommendationItem(
        activity=act_name,
        duration_minutes=duration,
        frequency_days_per_week=freq,
        intensity=intensity,
        weekly_target_minutes=duration * freq,
        estimated_calories_per_session=cal,
        explanation=EXPLANATION_TEXT.get(tag, EXPLANATION_TEXT["ramp_up"]),
        gradual_target=GRADUAL_TARGET_TEXT.get(tag, GRADUAL_TARGET_TEXT["ramp_up"]),
    )

    # Also add a secondary recommendation from preferred activities
    secondary_recs = []
    for pref in (profile.preferred_activities or [])[:2]:
        if pref == act_name:
            continue
        sec_dur = min(max(duration - 5, 15), profile.available_minutes)
        sec_cal = _est_calories(pref, sec_dur, intensity, profile.weight_kg)
        secondary_recs.append(RecommendationItem(
            activity=pref,
            duration_minutes=sec_dur,
            frequency_days_per_week=max(2, freq - 1),
            intensity=intensity,
            weekly_target_minutes=sec_dur * max(2, freq - 1),
            estimated_calories_per_session=sec_cal,
            explanation=EXPLANATION_TEXT.get(tag, EXPLANATION_TEXT["ramp_up"]),
            gradual_target=GRADUAL_TARGET_TEXT.get(tag, GRADUAL_TARGET_TEXT["ramp_up"]),
        ))
        if len(secondary_recs) >= 2:
            break

    msg = _build_message(profile, risk, deficit, tag)

    return RecommendationResult(
        strategy="ml",
        sedentary_risk=risk,
        daily_deficit_minutes=deficit,
        message=msg,
        recommendations=[rec_item] + secondary_recs,
        model_confidence=confidence,
    )


# ──────────────────────────────────────────────────────────────────────
# Helper: human-readable message
# ──────────────────────────────────────────────────────────────────────
def _build_message(profile: UserProfile, risk: str, deficit: int, tag: str) -> str:
    name_parts = {
        "ramp_up": "building up your routine",
        "maintain": "maintaining your strong routine",
        "intensity_boost": "pushing your limits",
        "frequency_boost": "adding more active days",
        "recovery_focus": "balancing exertion with recovery",
        "sport_specific": "competition-focused training",
        "stress_relief": "relieving study stress",
        "variety_mix": "mixing up your activities",
    }
    focus = name_parts.get(tag, "improving your fitness")

    if risk == "High":
        opener = "⚠️ Your recent activity level is quite low."
    elif risk == "Moderate":
        opener = "📊 You have some room to increase your movement."
    else:
        opener = "✅ Great consistency — keep it going!"

    if deficit > 0:
        return (f"{opener}  We recommend focusing on {focus}.  "
                f"You have a ~{deficit}-minute daily movement gap to close.")
    return (f"{opener}  We recommend focusing on {focus}.  "
            f"Your daily targets are being met — consider progressive overload.")


# ══════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════════════════
def get_recommendation(profile: UserProfile) -> RecommendationResult:
    """
    Main entry point.  Tries ML model first, falls back to rule-based.

    Parameters
    ----------
    profile : UserProfile
        Aggregated user data from the database.

    Returns
    -------
    RecommendationResult
        Structured recommendation with strategy label.
    """
    bundle = _load_model()
    if bundle is not None:
        try:
            return _ml_recommend(profile, bundle)
        except Exception as e:
            print(f"[AI] ML prediction failed ({e}), falling back to rules")
    return _rule_based_recommend(profile)


def get_model_info() -> dict:
    """Returns metadata about the loaded model (or None)."""
    bundle = _load_model()
    if bundle is None:
        return {"loaded": False, "strategy": "rule_based"}
    return {
        "loaded": True,
        "strategy": "ml",
        "metrics": bundle.get("metrics", {}),
        "features": bundle.get("feature_columns", []),
    }
