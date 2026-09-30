"""
FitConnect — Model Training Script
====================================
Trains a multi-output Scikit-learn pipeline to predict:
  1. rec_activity         (classification — recommended activity type)
  2. rec_duration_minutes (regression   — session duration in minutes)
  3. rec_frequency_days   (regression   — workout days per week)
  4. rec_intensity        (classification — Low / Moderate / High)

Architecture
------------
We use a *MultiOutputClassifier* wrapper around a Random Forest for the
categorical targets and a separate Random Forest regressor for the
numerical targets, combined in a single convenience object.

A Decision Tree variant is also trained for *interpretability* — it can
be exported to text rules so stakeholders can audit the logic.

The trained model is persisted via ``joblib`` to
``backend/app/ai/models/recommendation_model.joblib``.

IMPORTANT
---------
This module does **not** provide medical advice or diagnose health
conditions.  Recommendations are general fitness suggestions for healthy
college students and should not replace professional medical guidance.
"""

import os
import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, mean_absolute_error, classification_report
)

try:
    import joblib
except ImportError:
    from sklearn.externals import joblib  # type: ignore

from app.ai.training_data import generate_dataset

warnings.filterwarnings("ignore", category=UserWarning)

# ──────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────
AI_DIR = Path(__file__).resolve().parent
DATA_DIR = AI_DIR / "data"
MODEL_DIR = AI_DIR / "models"


# ──────────────────────────────────────────────────────────────────────
# Feature / Label columns
# ──────────────────────────────────────────────────────────────────────
NUMERIC_FEATURES = [
    "age", "weight_kg", "height_cm", "bmi",
    "fitness_level",                       # encoded as 0/1/2
    "available_minutes", "available_days_per_week",
    "current_activity_days", "current_avg_duration", "current_streak",
]

CATEGORICAL_FEATURES = [
    "fitness_goal", "preferred_activity",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

ACTIVITY_LABEL   = "rec_activity"
DURATION_LABEL   = "rec_duration_minutes"
FREQUENCY_LABEL  = "rec_frequency_days"
INTENSITY_LABEL  = "rec_intensity"
TAG_LABEL        = "rec_explanation_tag"


# ──────────────────────────────────────────────────────────────────────
# Build preprocessing pipeline
# ──────────────────────────────────────────────────────────────────────
def _build_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False),
             CATEGORICAL_FEATURES),
        ],
        remainder="drop"
    )


# ──────────────────────────────────────────────────────────────────────
# Train
# ──────────────────────────────────────────────────────────────────────
def train_model(n_samples: int = 2000):
    """Generates data, trains models, saves artefacts, prints metrics."""

    # 1. Generate data
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = str(DATA_DIR / "training_data.csv")
    generate_dataset(n_samples, csv_path)
    df = pd.read_csv(csv_path)
    print(f"\n[Data] {len(df)} samples loaded — shape {df.shape}")

    # 2. Encode classification labels
    le_activity  = LabelEncoder().fit(df[ACTIVITY_LABEL])
    le_intensity = LabelEncoder().fit(df[INTENSITY_LABEL])
    le_tag       = LabelEncoder().fit(df[TAG_LABEL])

    df["_y_activity"]  = le_activity.transform(df[ACTIVITY_LABEL])
    df["_y_intensity"] = le_intensity.transform(df[INTENSITY_LABEL])
    df["_y_tag"]       = le_tag.transform(df[TAG_LABEL])

    X = df[ALL_FEATURES].copy()
    y_activity  = df["_y_activity"]
    y_intensity = df["_y_intensity"]
    y_tag       = df["_y_tag"]
    y_duration  = df[DURATION_LABEL]
    y_frequency = df[FREQUENCY_LABEL]

    X_train, X_test, idx_train, idx_test = train_test_split(
        X, df.index, test_size=0.2, random_state=42
    )

    # 3. Preprocessor
    preprocessor = _build_preprocessor()

    # ── Activity classifier ──
    activity_pipe = Pipeline([
        ("prep", preprocessor),
        ("clf", RandomForestClassifier(n_estimators=120, max_depth=12, random_state=42))
    ])
    activity_pipe.fit(X_train, y_activity[idx_train])
    y_pred_act = activity_pipe.predict(X_test)
    acc_act = accuracy_score(y_activity[idx_test], y_pred_act)
    print(f"\n[Activity Classifier]  Accuracy: {acc_act:.3f}")

    # ── Intensity classifier ──
    intensity_pipe = Pipeline([
        ("prep", preprocessor),
        ("clf", RandomForestClassifier(n_estimators=80, max_depth=10, random_state=42))
    ])
    intensity_pipe.fit(X_train, y_intensity[idx_train])
    y_pred_int = intensity_pipe.predict(X_test)
    acc_int = accuracy_score(y_intensity[idx_test], y_pred_int)
    print(f"[Intensity Classifier] Accuracy: {acc_int:.3f}")

    # ── Explanation tag classifier ──
    tag_pipe = Pipeline([
        ("prep", preprocessor),
        ("clf", RandomForestClassifier(n_estimators=80, max_depth=10, random_state=42))
    ])
    tag_pipe.fit(X_train, y_tag[idx_train])
    y_pred_tag = tag_pipe.predict(X_test)
    acc_tag = accuracy_score(y_tag[idx_test], y_pred_tag)
    print(f"[Tag Classifier]       Accuracy: {acc_tag:.3f}")

    # ── Duration regressor ──
    duration_pipe = Pipeline([
        ("prep", preprocessor),
        ("reg", RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42))
    ])
    duration_pipe.fit(X_train, y_duration[idx_train])
    y_pred_dur = duration_pipe.predict(X_test)
    mae_dur = mean_absolute_error(y_duration[idx_test], y_pred_dur)
    print(f"[Duration Regressor]   MAE: {mae_dur:.2f} min")

    # ── Frequency regressor ──
    freq_pipe = Pipeline([
        ("prep", preprocessor),
        ("reg", RandomForestRegressor(n_estimators=80, max_depth=8, random_state=42))
    ])
    freq_pipe.fit(X_train, y_frequency[idx_train])
    y_pred_freq = freq_pipe.predict(X_test)
    mae_freq = mean_absolute_error(y_frequency[idx_test], y_pred_freq)
    print(f"[Frequency Regressor]  MAE: {mae_freq:.2f} days")

    # ── Interpretable Decision Tree (for audit) ──
    dt_activity = Pipeline([
        ("prep", preprocessor),
        ("clf", DecisionTreeClassifier(max_depth=8, random_state=42))
    ])
    dt_activity.fit(X_train, y_activity[idx_train])
    dt_acc = accuracy_score(y_activity[idx_test], dt_activity.predict(X_test))
    print(f"\n[Interpretable DT]     Accuracy: {dt_acc:.3f}")

    # Export tree rules to text
    feature_names_out = (
        NUMERIC_FEATURES +
        list(dt_activity.named_steps["prep"]
             .named_transformers_["cat"]
             .get_feature_names_out(CATEGORICAL_FEATURES))
    )
    tree_rules = export_text(
        dt_activity.named_steps["clf"],
        feature_names=feature_names_out,
        max_depth=6
    )
    rules_path = str(MODEL_DIR / "decision_tree_rules.txt")
    with open(rules_path, "w", encoding="utf-8") as f:
        f.write("FitConnect Recommendation — Decision Tree Rules (Interpretable Audit)\n")
        f.write("=" * 72 + "\n\n")
        f.write(tree_rules)
    print(f"[DT Rules] saved → {rules_path}")

    # 4. Persist all artefacts
    model_bundle = {
        "activity_pipe":  activity_pipe,
        "intensity_pipe": intensity_pipe,
        "duration_pipe":  duration_pipe,
        "frequency_pipe": freq_pipe,
        "tag_pipe":       tag_pipe,
        "le_activity":    le_activity,
        "le_intensity":   le_intensity,
        "le_tag":         le_tag,
        "feature_columns": ALL_FEATURES,
        "metrics": {
            "activity_accuracy":  round(acc_act, 4),
            "intensity_accuracy": round(acc_int, 4),
            "tag_accuracy":       round(acc_tag, 4),
            "duration_mae":       round(mae_dur, 2),
            "frequency_mae":      round(mae_freq, 2),
            "dt_activity_accuracy": round(dt_acc, 4),
            "training_samples": n_samples,
        }
    }

    model_path = str(MODEL_DIR / "recommendation_model.joblib")
    joblib.dump(model_bundle, model_path, compress=3)
    print(f"\n[✓] Model bundle saved → {model_path}")

    # Also save metrics as JSON for the API
    metrics_path = str(MODEL_DIR / "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(model_bundle["metrics"], f, indent=2)
    print(f"[✓] Metrics saved    → {metrics_path}")

    return model_bundle


if __name__ == "__main__":
    train_model(2000)
