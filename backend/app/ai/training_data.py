"""
FitConnect — Synthetic Training Data Generator
================================================
Generates realistic labelled training data for the fitness recommendation
model.  Each row represents a *student profile snapshot* paired with the
"ideal" recommendation a campus sports coach would prescribe.

The generator uses domain-informed heuristics so the labels are not
random — they follow physical activity guidelines adapted for Indian
college students (WHO 2020 + FITT principle).

Output
------
CSV file with columns:
    age, weight_kg, height_cm, bmi, fitness_level, fitness_goal,
    preferred_activity_primary, available_minutes, available_days_per_week,
    current_activity_days, current_avg_duration, current_streak,
    → rec_activity, rec_duration_minutes, rec_frequency_days,
      rec_intensity, rec_weekly_target_minutes, rec_explanation_tag
"""

import csv
import math
import random
import os
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────
ACTIVITIES = [
    "Walking", "Running", "Cycling", "Gym", "Yoga",
    "Cricket", "Football", "Basketball", "Badminton"
]

FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]

FITNESS_GOALS = [
    "Beat Sedentary Routine",
    "Beat Sedentary Routine & Build Stamina",
    "Weight Loss & Active Calorie Deficit",
    "Muscle Building & Strength Conditioning",
    "Prepare for Inter-College Sports Meet",
    "Relieve Study Stress",
    "Improve Overall Fitness",
    "Flexibility & Mobility",
]

INTENSITY_MAP = {
    "Beginner":     {"Low": 0.55, "Moderate": 0.40, "High": 0.05},
    "Intermediate": {"Low": 0.15, "Moderate": 0.60, "High": 0.25},
    "Advanced":     {"Low": 0.05, "Moderate": 0.35, "High": 0.60},
}

# Activity suitability per goal (higher = more suitable)
GOAL_ACTIVITY_AFFINITY = {
    "Beat Sedentary Routine":                  {"Walking": 5, "Cycling": 4, "Yoga": 4, "Badminton": 3},
    "Beat Sedentary Routine & Build Stamina":  {"Running": 5, "Walking": 4, "Cycling": 4, "Badminton": 4, "Gym": 3},
    "Weight Loss & Active Calorie Deficit":    {"Running": 5, "Cycling": 5, "Gym": 4, "Badminton": 4, "Football": 4},
    "Muscle Building & Strength Conditioning": {"Gym": 5, "Running": 3, "Basketball": 3},
    "Prepare for Inter-College Sports Meet":   {"Running": 5, "Football": 5, "Cricket": 5, "Basketball": 5, "Cycling": 4, "Badminton": 4},
    "Relieve Study Stress":                    {"Yoga": 5, "Walking": 5, "Cycling": 3, "Badminton": 3},
    "Improve Overall Fitness":                 {"Running": 4, "Cycling": 4, "Gym": 4, "Badminton": 4, "Walking": 3, "Yoga": 3},
    "Flexibility & Mobility":                  {"Yoga": 5, "Walking": 4},
}

EXPLANATION_TAGS = {
    "ramp_up":          "Gradually increase activity duration and frequency to build habit",
    "maintain":         "Maintain current routine with minor intensity progression",
    "intensity_boost":  "Increase workout intensity while maintaining volume",
    "frequency_boost":  "Add more active days for consistent energy expenditure",
    "recovery_focus":   "Prioritize recovery & low-impact movement to avoid burnout",
    "sport_specific":   "Sport-specific conditioning for competition readiness",
    "stress_relief":    "Mind-body activities to reduce academic stress",
    "variety_mix":      "Mix activity types to prevent monotony and improve adherence",
}

# ──────────────────────────────────────────────────────────────────────
# Helper: weighted random choice from dict
# ──────────────────────────────────────────────────────────────────────
def _weighted_choice(weight_dict: dict) -> str:
    items = list(weight_dict.keys())
    weights = list(weight_dict.values())
    return random.choices(items, weights=weights, k=1)[0]


def _clamp(val, lo, hi):
    return max(lo, min(hi, val))


# ──────────────────────────────────────────────────────────────────────
# Core: generate one labelled sample
# ──────────────────────────────────────────────────────────────────────
def generate_sample() -> dict:
    # ── Student profile features ──
    age = random.randint(17, 28)
    height = round(random.gauss(168, 9), 1)                  # cm
    weight = round(random.gauss(65, 12), 1)                   # kg
    weight = _clamp(weight, 40, 120)
    height = _clamp(height, 145, 200)
    bmi = round(weight / ((height / 100) ** 2), 1)

    fitness_level = random.choice(FITNESS_LEVELS)
    fitness_goal = random.choice(FITNESS_GOALS)
    preferred_activity = random.choice(ACTIVITIES)

    available_minutes = random.choice([20, 25, 30, 35, 40, 45, 50, 60, 75, 90])
    available_days = random.randint(2, 7)

    # Current behaviour (simulated)
    if fitness_level == "Beginner":
        current_days = random.randint(0, min(3, available_days))
        current_avg_dur = random.randint(10, 25)
        current_streak = random.randint(0, 7)
    elif fitness_level == "Intermediate":
        current_days = random.randint(2, min(5, available_days))
        current_avg_dur = random.randint(20, 40)
        current_streak = random.randint(2, 20)
    else:  # Advanced
        current_days = random.randint(3, available_days)
        current_avg_dur = random.randint(30, 60)
        current_streak = random.randint(5, 30)

    # ── Generate the "ideal" label ──
    # 1. Recommended activity
    affinities = GOAL_ACTIVITY_AFFINITY.get(fitness_goal, {})
    if preferred_activity in affinities:
        affinities[preferred_activity] += 2  # boost user preference
    if affinities:
        rec_activity = _weighted_choice(affinities)
    else:
        rec_activity = preferred_activity

    # 2. Recommended intensity
    rec_intensity = _weighted_choice(INTENSITY_MAP[fitness_level])

    # 3. Recommended duration — bounded by available time
    if fitness_level == "Beginner":
        base_dur = random.randint(15, 30)
    elif fitness_level == "Intermediate":
        base_dur = random.randint(25, 45)
    else:
        base_dur = random.randint(35, 60)
    # Never exceed available time
    rec_duration = min(base_dur, available_minutes)
    # Slight uplift if current duration is already close
    if current_avg_dur >= rec_duration and rec_duration < available_minutes:
        rec_duration = min(rec_duration + 5, available_minutes)

    # 4. Recommended frequency
    if fitness_level == "Beginner":
        rec_freq = _clamp(current_days + random.randint(1, 2), 3, min(5, available_days))
    elif fitness_level == "Intermediate":
        rec_freq = _clamp(current_days + random.randint(0, 2), 3, min(6, available_days))
    else:
        rec_freq = _clamp(current_days + random.randint(0, 1), 4, available_days)

    # 5. Weekly target minutes
    rec_weekly_target = rec_duration * rec_freq

    # 6. Explanation tag
    if fitness_level == "Beginner" and current_days <= 2:
        tag = "ramp_up"
    elif fitness_goal == "Relieve Study Stress":
        tag = "stress_relief"
    elif fitness_goal == "Prepare for Inter-College Sports Meet":
        tag = "sport_specific"
    elif current_streak >= 14 and fitness_level == "Advanced":
        tag = "intensity_boost"
    elif current_days < rec_freq:
        tag = "frequency_boost"
    elif current_avg_dur >= rec_duration - 5:
        tag = "maintain"
    else:
        tag = "ramp_up"

    return {
        # Features
        "age": age,
        "weight_kg": weight,
        "height_cm": height,
        "bmi": bmi,
        "fitness_level": FITNESS_LEVELS.index(fitness_level),   # 0/1/2
        "fitness_level_str": fitness_level,
        "fitness_goal": fitness_goal,
        "preferred_activity": preferred_activity,
        "available_minutes": available_minutes,
        "available_days_per_week": available_days,
        "current_activity_days": current_days,
        "current_avg_duration": current_avg_dur,
        "current_streak": current_streak,
        # Labels
        "rec_activity": rec_activity,
        "rec_duration_minutes": rec_duration,
        "rec_frequency_days": rec_freq,
        "rec_intensity": rec_intensity,
        "rec_weekly_target_minutes": rec_weekly_target,
        "rec_explanation_tag": tag,
    }


# ──────────────────────────────────────────────────────────────────────
# Generate full dataset
# ──────────────────────────────────────────────────────────────────────
def generate_dataset(n: int = 2000, output_path: str = None) -> str:
    """Generate *n* labelled samples and write to CSV.

    Returns the absolute path of the generated CSV file.
    """
    if output_path is None:
        data_dir = Path(__file__).resolve().parent / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(data_dir / "training_data.csv")

    fieldnames = [
        "age", "weight_kg", "height_cm", "bmi",
        "fitness_level", "fitness_level_str", "fitness_goal",
        "preferred_activity", "available_minutes",
        "available_days_per_week", "current_activity_days",
        "current_avg_duration", "current_streak",
        "rec_activity", "rec_duration_minutes", "rec_frequency_days",
        "rec_intensity", "rec_weekly_target_minutes", "rec_explanation_tag",
    ]

    random.seed(42)  # reproducibility
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for _ in range(n):
            writer.writerow(generate_sample())

    print(f"[✓] Generated {n} samples → {output_path}")
    return output_path


if __name__ == "__main__":
    generate_dataset(2000)
