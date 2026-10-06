"""
FitConnect — Complete FastAPI Backend Application
SIH 2026 Campus Fitness Platform
All API endpoints: Auth, Activities, Goals, Challenges, Leaderboard,
Rewards, Analytics, AI Recommendations, Admin Dashboard
"""
from datetime import datetime, date, timedelta
from typing import List, Optional
import math
import json
import os
import secrets
from threading import Lock
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct, and_, or_, desc, asc, extract, inspect as sa_inspect, text
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.core.database import engine, Base, SessionLocal, get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, decode_access_token
)
from app.models.entities import (
    User, FitnessProfile, Activity, Goal, Challenge, ChallengeParticipant,
    Badge, UserBadge, Perk, PerkRedemption, Point, Streak, Notification, Department
)
from app.schemas.all_schemas import (
    UserRegister, UserLogin, Token, UserBasicInfo,
    FitnessProfileUpdate, FitnessProfileResponse,
    ActivityCreate, ActivityResponse, TodaySummaryResponse,
    WeeklySummaryResponse, DailyActivityStat,
    GoalCreate, GoalUpdate, GoalResponse,
    ChallengeResponse, ParticipantProgressResponse,
    StudentLeaderboardEntry, DepartmentLeaderboardEntry,
    BadgeResponse, PointLogResponse, RewardsOverviewResponse,
    AnalyticsWeeklyResponse, AnalyticsMonthlyResponse,
    ActivityDistributionResponse, ActivityDistributionItem,
    RecommendationResponse, RecommendationItem,
    NotificationResponse
)

# ---------------------------------------------------------------------------
# Create tables and perform the existing hostel compatibility migration only
# during local development. On Vercel, each request may cold-start a function;
# repeated DDL against the production database is unsafe. Apply app tables via
# a controlled release/migration step before deploying production traffic.
if os.getenv("APP_ENV", "development").strip().lower() != "production":
    Base.metadata.create_all(bind=engine)
    if "hostel" not in {column["name"] for column in sa_inspect(engine).get_columns("users")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN hostel VARCHAR(100)"))

# ---------------------------------------------------------------------------
# FastAPI Application Instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FitConnect API",
    description="Campus Fitness Gamification Platform — SIH 2026",
    version="1.0.0"
)


def configured_cors_origins():
    configured = os.getenv("CORS_ORIGINS", "").strip()
    if not configured:
        if os.getenv("APP_ENV", "development").strip().lower() == "production":
            raise RuntimeError("Set CORS_ORIGINS to the deployed frontend origin in production.")
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
    origins = [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    if "*" in origins:
        raise RuntimeError("CORS_ORIGINS must list explicit frontend origins; wildcard CORS is not allowed.")
    return origins


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security_scheme = HTTPBearer(auto_error=False)
reward_catalog_lock = Lock()

# ---------------------------------------------------------------------------
# MET values for calorie calculation
# ---------------------------------------------------------------------------
MET_TABLE = {
    "Walking": 3.5, "Running": 9.0, "Cycling": 7.5, "Gym": 6.0,
    "Yoga": 3.2, "Cricket": 5.2, "Football": 8.5, "Basketball": 8.0,
    "Badminton": 5.8, "Other": 4.5
}

ACTIVITY_ICONS = {
    "Walking": "🚶‍♂️", "Running": "🏃‍♂️", "Cycling": "🚴‍♂️",
    "Gym": "🏋️‍♂️", "Yoga": "🧘‍♂️", "Cricket": "🏏",
    "Football": "⚽", "Basketball": "🏀", "Badminton": "🏸", "Other": "⚡"
}

ACTIVITY_COLORS = {
    "Walking": "#10b981", "Running": "#f59e0b", "Cycling": "#06b6d4",
    "Gym": "#8b5cf6", "Yoga": "#ec4899", "Cricket": "#22c55e",
    "Football": "#3b82f6", "Basketball": "#f97316", "Badminton": "#14b8a6",
    "Other": "#64748b"
}

# ---------------------------------------------------------------------------
# Helper: Tier Calculation
# ---------------------------------------------------------------------------
def get_tier(pts: int):
    pts = max(0, int(pts or 0))
    tiers = [
        ("Bronze", 0, 600),
        ("Silver", 600, 1200),
        ("Gold", 1200, 2000),
        ("Platinum", 2000, 3000),
        ("Diamond", 3000, None),
    ]
    for name, threshold, next_threshold in reversed(tiers):
        if pts >= threshold:
            progress = 100 if next_threshold is None else min(
                100, round((pts - threshold) / (next_threshold - threshold) * 100)
            )
            return {
                "name": name,
                "next": next((tier_name for tier_name, tier_threshold, _ in tiers
                              if tier_threshold == next_threshold), None),
                "target": next_threshold or threshold,
                "progress": progress,
            }


def ensure_reward_catalog(db: Session):
    badge_rows = [
        {"name": "First Step", "description": "Log your first activity.", "requirement": "Log 1 activity", "points": 50, "category": "Milestone", "icon_name": "Footprints"},
        {"name": "Flame Keeper", "description": "Maintain a 5-day activity streak.", "requirement": "Reach a 5-day streak", "points": 150, "category": "Streak", "icon_name": "Flame"},
        {"name": "Century Burner", "description": "Burn at least 300 calories in one workout.", "requirement": "Burn 300 kcal in one activity", "points": 100, "category": "Performance", "icon_name": "Zap"},
        {"name": "Weekend Warrior", "description": "Be active on both weekend days in one week.", "requirement": "Log activities on Saturday and Sunday in one week", "points": 80, "category": "Milestone", "icon_name": "Award"},
        {"name": "Campus Sprinter", "description": "Run a cumulative 25 kilometers.", "requirement": "Accumulate 25 km of running", "points": 120, "category": "Performance", "icon_name": "TrendingUp"},
        {"name": "Desk Break Zen Master", "description": "Complete five yoga sessions.", "requirement": "Log 5 yoga sessions", "points": 100, "category": "Wellness", "icon_name": "Compass"},
        {"name": "Department Titan", "description": "Complete a department challenge.", "requirement": "Complete a department challenge", "points": 250, "category": "Community", "icon_name": "Shield"},
        {"name": "Iron Lungs", "description": "Complete a 10 km run or 30 km ride.", "requirement": "Run 10 km or cycle 30 km in one activity", "points": 200, "category": "Performance", "icon_name": "Target"},
    ]
    perk_rows = [
        {"title": "Sports Complex Priority Pass", "category": "Campus Facilities", "description": "Priority booking access to campus sports facilities.", "cost": 500},
        {"title": "Healthy Smoothie Voucher", "category": "Nutrition", "description": "A voucher for a healthy drink at the campus canteen.", "cost": 800},
        {"title": "Certificate of Fitness", "category": "Recognition", "description": "A digital certificate recognizing your fitness progress.", "cost": 1200},
        {"title": "Gym Equipment Locker Access", "category": "Campus Facilities", "description": "Access to a dedicated campus sports equipment locker.", "cost": 1500},
    ]

    with reward_catalog_lock:
        try:
            dialect_name = db.get_bind().dialect.name
            if dialect_name == "postgresql":
                db.execute(postgresql_insert(Badge).values(badge_rows).on_conflict_do_nothing(index_elements=[Badge.name]))
                db.execute(postgresql_insert(Perk).values(perk_rows).on_conflict_do_nothing(index_elements=[Perk.title]))
            elif dialect_name == "sqlite":
                db.execute(sqlite_insert(Badge).values(badge_rows).on_conflict_do_nothing(index_elements=[Badge.name]))
                db.execute(sqlite_insert(Perk).values(perk_rows).on_conflict_do_nothing(index_elements=[Perk.title]))
            else:
                existing_badges = {name for (name,) in db.query(Badge.name).all()}
                existing_perks = {title for (title,) in db.query(Perk.title).all()}
                db.add_all([Badge(**row) for row in badge_rows if row["name"] not in existing_badges])
                db.add_all([Perk(**row) for row in perk_rows if row["title"] not in existing_perks])
            db.commit()
        except Exception:
            db.rollback()
            raise


@app.on_event("startup")
def bootstrap_reward_catalog():
    db = SessionLocal()
    try:
        ensure_reward_catalog(db)
    finally:
        db.close()


def calculate_calories(activity_type: str, duration: int, intensity: str, weight: float = 68.0) -> int:
    base_met = MET_TABLE.get(activity_type, 4.5)
    mult = 1.0
    if intensity == "Low":
        mult = 0.85
    elif intensity == "High":
        mult = 1.25
    met = base_met * mult
    cal = (met * 3.5 * weight / 200) * duration
    return round(cal)


def calculate_points(duration: int, intensity: str, distance: Optional[float]) -> int:
    pts = round(duration * 1.0)
    if intensity == "High":
        pts += 15
    if distance and distance > 5:
        pts += 20
    return pts


# ---------------------------------------------------------------------------
# Auth Dependency
# ---------------------------------------------------------------------------
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ===========================================================================
# AUTH ENDPOINTS
# ===========================================================================
@app.post("/api/auth/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        college=data.college,
        department=data.department,
        hostel=data.hostel,
        year=data.year,
        role="student"
    )
    db.add(user)
    db.flush()

    # Create fitness profile
    profile = FitnessProfile(
        user_id=user.id,
        age=data.age or 20,
        height=data.height or 175.0,
        weight=data.weight or 68.0,
        fitness_level=data.fitness_level or "Intermediate",
        fitness_goal=data.fitness_goal or "Beat Sedentary Routine & Build Stamina",
        preferred_activities=json.dumps(data.preferred_activities or ["Running", "Gym", "Badminton"]),
        available_days=json.dumps(data.available_days or [1, 2, 3, 4, 5, 6]),
        daily_available_minutes=data.daily_available_minutes or 45
    )
    db.add(profile)

    # Create streak record
    streak = Streak(user_id=user.id, current_streak=0, longest_streak=0)
    db.add(streak)

    # Welcome bonus points
    welcome_pts = Point(user_id=user.id, points=50, reason="Welcome bonus for joining FitConnect")
    db.add(welcome_pts)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id, "name": user.name, "email": user.email,
            "college": user.college, "department": user.department,
            "hostel": user.hostel,
            "year": user.year, "role": user.role
        }
    )


@app.post("/api/auth/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=user.id)

    # Get stats
    total_pts = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
        Point.user_id == user.id).scalar()
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()
    tier = get_tier(total_pts)
    has_profile = db.query(FitnessProfile).filter(
        FitnessProfile.user_id == user.id).first() is not None

    return Token(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id, "name": user.name, "email": user.email,
            "college": user.college, "department": user.department,
            "year": user.year, "role": user.role,
            "total_points": total_pts,
            "current_streak": streak_rec.current_streak if streak_rec else 0,
            "tier_name": tier["name"],
            "has_profile": has_profile
        }
    )


@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_pts = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
        Point.user_id == user.id).scalar()
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()
    tier = get_tier(total_pts)
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()

    profile_data = None
    if profile:
        pa = profile.preferred_activities
        if isinstance(pa, str):
            pa = json.loads(pa)
        ad = profile.available_days
        if isinstance(ad, str):
            ad = json.loads(ad)
        profile_data = {
            "id": profile.id, "user_id": profile.user_id,
            "age": profile.age,
            "height": float(profile.height), "weight": float(profile.weight),
            "bmi": profile.bmi,
            "fitness_level": profile.fitness_level, "fitness_goal": profile.fitness_goal,
            "preferred_activities": pa,
            "available_days": ad,
            "daily_available_minutes": profile.daily_available_minutes,
            "daily_calorie_target": profile.daily_calorie_target,
            "daily_active_minutes_target": profile.daily_active_minutes_target
        }

    return {
        "id": user.id, "name": user.name, "email": user.email,
        "college": user.college, "department": user.department,
        "hostel": user.hostel,
        "year": user.year, "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "total_points": total_pts,
        "current_streak": streak_rec.current_streak if streak_rec else 0,
        "longest_streak": streak_rec.longest_streak if streak_rec else 0,
        "tier_name": tier["name"],
        "profile": profile_data
    }


# ===========================================================================
# PROFILE ENDPOINTS
# ===========================================================================
@app.get("/api/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    if not profile:
        return None
    pa = profile.preferred_activities
    if isinstance(pa, str):
        pa = json.loads(pa)
    ad = profile.available_days
    if isinstance(ad, str):
        ad = json.loads(ad)
    return {
        "id": profile.id, "user_id": profile.user_id,
        "age": profile.age,
        "height": float(profile.height), "weight": float(profile.weight),
        "bmi": profile.bmi,
        "fitness_level": profile.fitness_level, "fitness_goal": profile.fitness_goal,
        "preferred_activities": pa,
        "available_days": ad,
        "daily_available_minutes": profile.daily_available_minutes,
        "daily_calorie_target": profile.daily_calorie_target,
        "daily_active_minutes_target": profile.daily_active_minutes_target
    }


@app.put("/api/profile")
def update_profile(data: FitnessProfileUpdate, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    if data.hostel is not None:
        user.hostel = data.hostel.strip() or None
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    if not profile:
        profile = FitnessProfile(
            user_id=user.id,
            age=data.age or 20,
            height=data.height or 175.0,
            weight=data.weight or 68.0,
            fitness_level=data.fitness_level or "Intermediate",
            fitness_goal=data.fitness_goal or "Beat Sedentary Routine & Build Stamina",
            preferred_activities=json.dumps(data.preferred_activities or ["Running"]),
            available_days=json.dumps(data.available_days or [1, 2, 3, 4, 5]),
            daily_available_minutes=data.daily_available_minutes or 45
        )
        db.add(profile)
    else:
        if data.age is not None:
            profile.age = data.age
        if data.height is not None:
            profile.height = data.height
        if data.weight is not None:
            profile.weight = data.weight
        if data.fitness_level is not None:
            profile.fitness_level = data.fitness_level
        if data.fitness_goal is not None:
            profile.fitness_goal = data.fitness_goal
        if data.preferred_activities is not None:
            profile.preferred_activities = json.dumps(data.preferred_activities)
        if data.available_days is not None:
            profile.available_days = json.dumps(data.available_days)
        if data.daily_available_minutes is not None:
            profile.daily_available_minutes = data.daily_available_minutes

    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated", "profile_id": profile.id}


# ===========================================================================
# ACTIVITY ENDPOINTS
# ===========================================================================
@app.post("/api/activities")
def log_activity(data: ActivityCreate, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    weight = float(profile.weight) if profile else 68.0

    act_date = data.activity_date or date.today()
    intensity = data.intensity or "Moderate"
    calories = calculate_calories(data.activity_type, data.duration_minutes, intensity, weight)
    pts_earned = calculate_points(data.duration_minutes, intensity, data.distance)

    activity = Activity(
        user_id=user.id,
        activity_type=data.activity_type,
        duration_minutes=data.duration_minutes,
        distance=data.distance,
        intensity=intensity,
        calories=calories,
        activity_date=act_date,
        notes=data.notes
    )
    db.add(activity)

    # Award points
    pt = Point(
        user_id=user.id,
        points=pts_earned,
        reason=f"Logged {data.duration_minutes}m {data.activity_type}"
    )
    db.add(pt)

    # Update streak
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()
    if not streak_rec:
        streak_rec = Streak(user_id=user.id, current_streak=1, longest_streak=1,
                            last_activity_date=act_date)
        db.add(streak_rec)
    else:
        if streak_rec.last_activity_date:
            last = streak_rec.last_activity_date
            if isinstance(last, datetime):
                last = last.date()
            diff = (act_date - last).days
            if diff == 1:
                streak_rec.current_streak += 1
            elif diff == 0:
                pass  # Same day, no change
            else:
                streak_rec.current_streak = 1
        else:
            streak_rec.current_streak = 1
        streak_rec.last_activity_date = act_date
        if streak_rec.current_streak > streak_rec.longest_streak:
            streak_rec.longest_streak = streak_rec.current_streak

    # Update active goals
    active_goals = db.query(Goal).filter(
        Goal.user_id == user.id, Goal.status == "active",
        Goal.start_date <= act_date, Goal.end_date >= act_date
    ).all()
    for g in active_goals:
        if g.goal_type == "calories":
            g.current_value = float(g.current_value or 0) + calories
        elif g.goal_type == "active_minutes":
            g.current_value = float(g.current_value or 0) + data.duration_minutes
        elif g.goal_type == "workouts":
            g.current_value = float(g.current_value or 0) + 1
        elif g.goal_type == "distance" and data.distance:
            g.current_value = float(g.current_value or 0) + float(data.distance)
        if float(g.current_value) >= float(g.target_value):
            g.status = "completed"

    db.flush()

    # Recompute active challenge progress from the activity ledger.
    participations = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.user_id == user.id
    ).all()
    for cp in participations:
        ch = db.query(Challenge).filter(Challenge.id == cp.challenge_id, Challenge.is_active == True).first()
        if not ch:
            continue
        _sync_challenge_progress(db, ch)

    # Auto-award badges
    _check_and_award_badges(user.id, db, activity, streak_rec)

    db.commit()
    db.refresh(activity)

    return {
        "id": activity.id,
        "user_id": activity.user_id,
        "activity_type": activity.activity_type,
        "duration_minutes": activity.duration_minutes,
        "distance": float(activity.distance) if activity.distance else None,
        "intensity": activity.intensity,
        "calories": activity.calories,
        "activity_date": str(activity.activity_date),
        "notes": activity.notes,
        "points_earned": pts_earned,
        "created_at": activity.created_at.isoformat() if activity.created_at else None
    }


def _check_and_award_badges(user_id: int, db: Session, activity: Activity, streak: Streak):
    """Auto-award badges based on activity and streak milestones."""
    earned_badge_ids = set(
        r[0] for r in db.query(UserBadge.badge_id).filter(UserBadge.user_id == user_id).all()
    )
    all_badges = db.query(Badge).all()
    total_activities = db.query(func.count(Activity.id)).filter(Activity.user_id == user_id).scalar()
    total_running_km = db.query(func.coalesce(func.sum(Activity.distance), 0)).filter(
        Activity.user_id == user_id, Activity.activity_type == "Running").scalar()
    total_yoga = db.query(func.count(Activity.id)).filter(
        Activity.user_id == user_id, Activity.activity_type == "Yoga").scalar()
    active_dates = db.query(Activity.activity_date).filter(
        Activity.user_id == user_id
    ).distinct().all()
    weekend_weeks = {}
    for (activity_date,) in active_dates:
        if activity_date.weekday() >= 5:
            year, week, _ = activity_date.isocalendar()
            weekend_weeks.setdefault((year, week), set()).add(activity_date.weekday())
    has_weekend_pair = any(days == {5, 6} for days in weekend_weeks.values())

    for badge in all_badges:
        if badge.id in earned_badge_ids:
            continue
        awarded = False
        # First Step — 1 activity
        if badge.name == "First Step" and total_activities >= 1:
            awarded = True
        # Flame Keeper — 5 day streak
        elif badge.name == "Flame Keeper" and streak and streak.current_streak >= 5:
            awarded = True
        # Century Burner — 300+ kcal single workout
        elif badge.name == "Century Burner" and activity.calories >= 300:
            awarded = True
        # Weekend Warrior — check if any weekend activity exists
        elif badge.name == "Weekend Warrior":
            awarded = has_weekend_pair
        # Campus Sprinter — 25km cumulative running
        elif badge.name == "Campus Sprinter" and float(total_running_km) >= 25:
            awarded = True
        # Desk Break Zen Master — 5 yoga sessions
        elif badge.name == "Desk Break Zen Master" and total_yoga >= 5:
            awarded = True
        # Iron Lungs — 10km single run
        elif badge.name == "Iron Lungs" and activity.distance and (
                (activity.activity_type == "Running" and float(activity.distance) >= 10) or
                (activity.activity_type == "Cycling" and float(activity.distance) >= 30)):
            awarded = True

        if awarded:
            _grant_badge(db, user_id, badge)


def _sync_user_badges(user_id: int, db: Session):
    """Award eligible badges from the user's complete persisted activity history."""
    ensure_reward_catalog(db)
    activities = db.query(Activity).filter(Activity.user_id == user_id).all()
    if not activities:
        return
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    active_weekends = {}
    for activity in activities:
        if activity.activity_date.weekday() >= 5:
            year, week, _ = activity.activity_date.isocalendar()
            active_weekends.setdefault((year, week), set()).add(activity.activity_date.weekday())
    has_weekend_pair = any(days == {5, 6} for days in active_weekends.values())
    running_distance = sum(
        float(activity.distance or 0) for activity in activities if activity.activity_type == "Running"
    )
    yoga_sessions = sum(activity.activity_type == "Yoga" for activity in activities)
    has_department_completion = db.query(ChallengeParticipant.id).join(
        Challenge, Challenge.id == ChallengeParticipant.challenge_id
    ).filter(
        ChallengeParticipant.user_id == user_id,
        ChallengeParticipant.is_completed == True,
        Challenge.challenge_type == "department",
    ).first() is not None

    for badge in db.query(Badge).all():
        eligible = (
            (badge.name == "First Step" and len(activities) >= 1) or
            (badge.name == "Flame Keeper" and streak and streak.current_streak >= 5) or
            (badge.name == "Century Burner" and any(a.calories >= 300 for a in activities)) or
            (badge.name == "Weekend Warrior" and has_weekend_pair) or
            (badge.name == "Campus Sprinter" and running_distance >= 25) or
            (badge.name == "Desk Break Zen Master" and yoga_sessions >= 5) or
            (badge.name == "Department Titan" and has_department_completion) or
            (badge.name == "Iron Lungs" and any(
                a.distance and ((a.activity_type == "Running" and float(a.distance) >= 10) or
                                (a.activity_type == "Cycling" and float(a.distance) >= 30))
                for a in activities
            ))
        )
        if eligible:
            _grant_badge(db, user_id, badge)


@app.get("/api/activities")
def get_activities(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    activity_type: Optional[str] = None
):
    q = db.query(Activity).filter(Activity.user_id == user.id)
    if activity_type and activity_type != "All":
        q = q.filter(Activity.activity_type == activity_type)
    activities = q.order_by(desc(Activity.activity_date), desc(Activity.id)).offset(offset).limit(limit).all()

    result = []
    for a in activities:
        result.append({
            "id": a.id, "user_id": a.user_id,
            "activity_type": a.activity_type,
            "duration_minutes": a.duration_minutes,
            "distance": float(a.distance) if a.distance else None,
            "intensity": a.intensity,
            "calories": a.calories,
            "activity_date": str(a.activity_date),
            "notes": a.notes,
            "points_earned": calculate_points(a.duration_minutes, a.intensity, float(a.distance) if a.distance else None),
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return result


@app.get("/api/activities/today")
def get_today_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    activities = db.query(Activity).filter(
        Activity.user_id == user.id, Activity.activity_date == today
    ).all()

    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    cal_target = profile.daily_calorie_target if profile else 500
    min_target = profile.daily_active_minutes_target if profile else 45

    today_cal = sum(a.calories for a in activities)
    today_min = sum(a.duration_minutes for a in activities)

    return {
        "date": str(today),
        "today_calories": today_cal,
        "today_minutes": today_min,
        "calorie_target": cal_target,
        "minute_target": min_target,
        "calorie_percent": min(100, round((today_cal / cal_target * 100)) if cal_target else 0),
        "minute_percent": min(100, round((today_min / min_target * 100)) if min_target else 0),
        "workout_count": len(activities),
        "activities": [
            {
                "id": a.id, "activity_type": a.activity_type,
                "duration_minutes": a.duration_minutes,
                "distance": float(a.distance) if a.distance else None,
                "intensity": a.intensity, "calories": a.calories,
                "notes": a.notes,
                "points_earned": calculate_points(a.duration_minutes, a.intensity, float(a.distance) if a.distance else None)
            }
            for a in activities
        ]
    }


@app.get("/api/activities/weekly")
def get_weekly_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=6)
    days = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for i in range(7):
        d = week_start + timedelta(days=i)
        day_acts = db.query(Activity).filter(
            Activity.user_id == user.id, Activity.activity_date == d
        ).all()
        cal = sum(a.calories for a in day_acts)
        mins = sum(a.duration_minutes for a in day_acts)
        days.append({
            "day": day_names[d.weekday()],
            "date": str(d),
            "calories": cal,
            "minutes": mins,
            "workout_count": len(day_acts),
            "is_today": d == today
        })

    total_cal = sum(d["calories"] for d in days)
    total_min = sum(d["minutes"] for d in days)
    total_work = sum(d["workout_count"] for d in days)

    return {
        "total_calories": total_cal,
        "total_minutes": total_min,
        "total_workouts": total_work,
        "days": days
    }


# ===========================================================================
# GOALS ENDPOINTS
# ===========================================================================
@app.get("/api/goals")
def get_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.user_id == user.id).order_by(
        desc(Goal.created_at)).all()
    return [
        {
            "id": g.id, "user_id": g.user_id, "goal_type": g.goal_type,
            "target_value": float(g.target_value), "current_value": float(g.current_value),
            "start_date": str(g.start_date), "end_date": str(g.end_date),
            "status": g.status,
            "progress_percent": min(100, round(float(g.current_value) / float(g.target_value) * 100)) if float(g.target_value) > 0 else 0,
            "created_at": g.created_at.isoformat() if g.created_at else None
        }
        for g in goals
    ]


@app.post("/api/goals")
def create_goal(data: GoalCreate, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    goal = Goal(
        user_id=user.id,
        goal_type=data.goal_type,
        target_value=data.target_value,
        current_value=0,
        start_date=data.start_date,
        end_date=data.end_date,
        status="active"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"message": "Goal created", "goal_id": goal.id}


@app.put("/api/goals/{goal_id}")
def update_goal(goal_id: int, data: GoalUpdate, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if data.target_value is not None:
        goal.target_value = data.target_value
    if data.current_value is not None:
        goal.current_value = data.current_value
    if data.status is not None:
        goal.status = data.status
    db.commit()
    return {"message": "Goal updated"}


# ===========================================================================
# CHALLENGES ENDPOINTS
# ===========================================================================
def _activity_contribution(db: Session, challenge: Challenge, user_id: int) -> float:
    query = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.activity_date >= challenge.start_date.date(),
        Activity.activity_date <= challenge.end_date.date(),
    )
    if challenge.metric_type == "km":
        return float(query.with_entities(func.coalesce(func.sum(Activity.distance), 0)).scalar() or 0)
    if challenge.metric_type == "mins":
        return float(query.with_entities(func.coalesce(func.sum(Activity.duration_minutes), 0)).scalar() or 0)
    if challenge.metric_type == "kcal":
        return float(query.with_entities(func.coalesce(func.sum(Activity.calories), 0)).scalar() or 0)
    return float(query.with_entities(func.count(Activity.id)).scalar() or 0)


def _grant_badge(db: Session, user_id: int, badge: Badge):
    existing = db.query(UserBadge).filter(
        UserBadge.user_id == user_id, UserBadge.badge_id == badge.id
    ).first()
    if existing:
        return
    db.add(UserBadge(user_id=user_id, badge_id=badge.id))
    db.add(Point(user_id=user_id, points=badge.points,
                 reason=f"Earned badge: {badge.name}"))
    db.add(Notification(
        user_id=user_id,
        title=f"Badge unlocked: {badge.name}",
        message=f"You earned {badge.points} FitPoints for {badge.description}",
        notification_type="badge_unlocked",
    ))


def _sync_challenge_progress(db: Session, challenge: Challenge):
    participants = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge.id
    ).all()
    for participant in participants:
        participant.progress = _activity_contribution(
            db, challenge, participant.user_id
        )

    total_progress = sum(float(participant.progress or 0) for participant in participants)
    challenge.current_value = (
        max((float(participant.progress or 0) for participant in participants), default=0)
        if challenge.challenge_type == "individual" else total_progress
    )

    challenge_reached = challenge.challenge_type != "individual" and total_progress >= float(challenge.target_value)
    badge = db.query(Badge).filter(Badge.name == challenge.badge_reward).first() if challenge.badge_reward else None
    now = datetime.utcnow()
    for participant in participants:
        reached = (
            float(participant.progress or 0) >= float(challenge.target_value)
            if challenge.challenge_type == "individual" else
            challenge_reached and float(participant.progress or 0) > 0
        )
        if not reached or participant.is_completed:
            continue
        participant.is_completed = True
        participant.completed_at = now
        db.add(Point(
            user_id=participant.user_id,
            points=challenge.points,
            reason=f"Completed challenge: {challenge.title}",
        ))
        db.add(Notification(
            user_id=participant.user_id,
            title=f"Challenge completed: {challenge.title}",
            message=f"You earned {challenge.points} FitPoints for completing this challenge.",
            notification_type="challenge_update",
        ))
        if badge:
            _grant_badge(db, participant.user_id, badge)
    return participants


def _department_standings(participants):
    contributions = {}
    for participant in participants:
        department = participant.user.department if participant.user else "Unknown"
        contributions[department] = contributions.get(department, 0.0) + float(participant.progress or 0)
    return [
        {"rank": rank, "department": department, "progress": progress}
        for rank, (department, progress) in enumerate(
            sorted(contributions.items(), key=lambda item: item[1], reverse=True), start=1
        )
    ]


@app.get("/api/challenges")
def get_challenges(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    challenges = db.query(Challenge).filter(Challenge.is_active == True).order_by(
        desc(Challenge.created_at)).all()
    result = []
    for ch in challenges:
        participants = _sync_challenge_progress(db, ch)
        participant_count = db.query(func.count(ChallengeParticipant.id)).filter(
            ChallengeParticipant.challenge_id == ch.id).scalar()
        user_cp = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == ch.id,
            ChallengeParticipant.user_id == user.id
        ).first()

        days_left = (ch.end_date - datetime.utcnow()).days if ch.end_date else 0
        duration_text = f"{max(0, days_left)} Days Left" if days_left > 0 else "Ended"

        result.append({
            "id": ch.id, "title": ch.title, "description": ch.description,
            "challenge_type": ch.challenge_type, "metric_type": ch.metric_type,
            "target_value": float(ch.target_value),
            "current_value": float(ch.current_value or 0),
            "start_date": ch.start_date.isoformat() if ch.start_date else None,
            "end_date": ch.end_date.isoformat() if ch.end_date else None,
            "points": ch.points,
            "badge_reward": ch.badge_reward,
            "is_active": ch.is_active,
            "participants_count": participant_count,
            "is_joined": user_cp is not None,
            "user_contribution": float(user_cp.progress) if user_cp else 0,
            "user_completed": user_cp.is_completed if user_cp else False,
            "duration": duration_text,
            "department_standings": _department_standings(participants)
                if ch.challenge_type == "department" else [],
        })
    db.commit()
    return result


@app.post("/api/challenges/{challenge_id}/join")
def join_challenge(challenge_id: int, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    ch = db.query(Challenge).filter(Challenge.id == challenge_id, Challenge.is_active == True).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if ch.end_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Challenge has ended")
    existing = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.user_id == user.id
    ).first()
    if existing:
        return {"message": "Already joined"}
    cp = ChallengeParticipant(challenge_id=challenge_id, user_id=user.id, progress=0)
    db.add(cp)
    db.commit()
    return {"message": "Joined challenge"}


@app.post("/api/challenges/{challenge_id}/leave")
def leave_challenge(challenge_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    cp = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.user_id == user.id
    ).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Not a participant")
    if cp.is_completed:
        raise HTTPException(status_code=400, detail="Completed challenges cannot be left")
    db.delete(cp)
    db.commit()
    return {"message": "Left challenge"}


# ===========================================================================
# LEADERBOARD ENDPOINTS
# ===========================================================================
@app.get("/api/leaderboard/students")
def student_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Sum points per user
    results = db.query(
        User.id, User.name, User.department, User.year,
        func.coalesce(func.sum(Point.points), 0).label("total_points")
    ).outerjoin(Point, Point.user_id == User.id).filter(
        User.role == "student", User.college == user.college
    ).group_by(User.id).order_by(desc("total_points"), User.id).all()

    leaderboard = []
    for idx, r in enumerate(results[:50]):
        streak_rec = db.query(Streak).filter(Streak.user_id == r.id).first()
        leaderboard.append({
            "rank": idx + 1,
            "user_id": r.id,
            "name": r.name,
            "department": r.department,
            "year": r.year,
            "points": r.total_points,
            "streak": streak_rec.current_streak if streak_rec else 0,
            "workouts": db.query(func.count(Activity.id)).filter(Activity.user_id == r.id).scalar(),
            "avatar": r.name[0] if r.name else "?",
            "is_current_user": r.id == user.id
        })
    if user.role == "student" and not any(row["is_current_user"] for row in leaderboard):
        own_points = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
            Point.user_id == user.id
        ).scalar()
        own_streak = db.query(Streak).filter(Streak.user_id == user.id).first()
        rank = next((idx + 1 for idx, row in enumerate(results) if row.id == user.id), len(results) + 1)
        leaderboard.append({
            "rank": rank, "user_id": user.id, "name": user.name,
            "department": user.department, "year": user.year,
            "points": own_points, "streak": own_streak.current_streak if own_streak else 0,
            "workouts": db.query(func.count(Activity.id)).filter(Activity.user_id == user.id).scalar(),
            "avatar": user.name[0] if user.name else "?", "is_current_user": True,
        })
    return leaderboard


@app.get("/api/leaderboard/departments")
def department_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Aggregate points by department
    results = db.query(
        User.department,
        func.coalesce(func.sum(Point.points), 0).label("total_points"),
        func.count(distinct(User.id)).label("student_count")
    ).outerjoin(Point, Point.user_id == User.id).filter(
        User.role == "student", User.college == user.college
    ).group_by(User.department).order_by(desc("total_points")).all()

    leaderboard = []
    dept_codes = {"Computer Science & Engineering": "CSE", "Electronics & Communication": "ECE",
                  "Mechanical Engineering": "MECH", "Civil Engineering": "CIVIL",
                  "Biotechnology & Life Sciences": "BIOTECH", "School of Management": "MBA",
                  "Electrical Engineering": "EE", "Campus Administration": "ADMIN"}
    for idx, r in enumerate(results):
        # Get average logged calories per student in this department.
        total_calories = db.query(func.coalesce(func.sum(Activity.calories), 0)).join(
            User, User.id == Activity.user_id
        ).filter(User.department == r.department, User.college == user.college).scalar()
        active_students = db.query(func.count(distinct(Activity.user_id))).join(
            User, User.id == Activity.user_id
        ).filter(
            User.department == r.department, User.college == user.college,
            User.role == "student", Activity.activity_date >= date.today() - timedelta(days=29)
        ).scalar()

        # Top performer
        top = db.query(User.name, func.coalesce(func.sum(Point.points), 0).label("pts")).outerjoin(
            Point, Point.user_id == User.id
        ).filter(User.department == r.department, User.college == user.college,
             User.role == "student").group_by(
            User.id).order_by(desc("pts")).first()

        leaderboard.append({
            "rank": idx + 1,
            "department_name": r.department,
            "department_code": dept_codes.get(r.department, r.department[:3].upper()),
            "points": r.total_points,
            "active_students": active_students,
            "student_count": r.student_count,
            "avg_calories": round(total_calories / r.student_count) if r.student_count else 0,
            "top_performer": top.name if top else "—"
        })
    return leaderboard


@app.get("/api/leaderboard/hostels")
def hostel_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_points = db.query(
        Point.user_id.label("user_id"),
        func.coalesce(func.sum(Point.points), 0).label("points"),
    ).group_by(Point.user_id).subquery()
    active_users = db.query(Activity.user_id.label("user_id")).filter(
        Activity.activity_date >= date.today() - timedelta(days=29)
    ).distinct().subquery()
    rows = db.query(
        User.hostel.label("hostel_name"),
        func.count(distinct(User.id)).label("resident_count"),
        func.sum(case((active_users.c.user_id.isnot(None), 1), else_=0)).label("active_residents"),
        func.coalesce(func.sum(user_points.c.points), 0).label("points"),
    ).outerjoin(user_points, user_points.c.user_id == User.id).outerjoin(
        active_users, active_users.c.user_id == User.id
    ).filter(
        User.role == "student", User.college == user.college,
        User.hostel.isnot(None), User.hostel != "",
    ).group_by(User.hostel).order_by(desc("points"), User.hostel).all()

    return [{
        "rank": rank,
        "hostel_name": row.hostel_name,
        "resident_count": row.resident_count,
        "active_residents": row.active_residents,
        "points": row.points,
        "is_current_hostel": bool(user.hostel and row.hostel_name == user.hostel),
    } for rank, row in enumerate(rows, start=1)]


@app.get("/api/leaderboard/challenges/{challenge_id}")
def challenge_leaderboard(challenge_id: int, user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id, Challenge.is_active == True
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    participants = _sync_challenge_progress(db, challenge)
    participants.sort(key=lambda participant: float(participant.progress or 0), reverse=True)
    result = [{
        "rank": rank,
        "user_id": participant.user_id,
        "name": participant.user.name if participant.user else "Unknown",
        "department": participant.user.department if participant.user else "",
        "progress": float(participant.progress or 0),
        "metric_type": challenge.metric_type,
        "points": challenge.points if participant.is_completed else 0,
        "is_completed": participant.is_completed,
        "is_current_user": participant.user_id == user.id,
        "is_joined": True,
    } for rank, participant in enumerate(participants, start=1)]
    if not any(entry["is_current_user"] for entry in result):
        result.append({
            "rank": len(result) + 1, "user_id": user.id, "name": user.name,
            "department": user.department, "progress": 0,
            "metric_type": challenge.metric_type, "points": 0,
            "is_completed": False, "is_current_user": True, "is_joined": False,
        })
    db.commit()
    return {"challenge": {"id": challenge.id, "title": challenge.title,
                           "metric_type": challenge.metric_type,
                           "target_value": float(challenge.target_value)},
            "participants": result}


# ===========================================================================
# REWARDS / BADGES ENDPOINTS
# ===========================================================================
@app.get("/api/rewards/overview")
def rewards_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _sync_user_badges(user.id, db)
    db.flush()
    total_pts = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
        Point.user_id == user.id).scalar()
    tier = get_tier(total_pts)
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()
    badges_earned = db.query(func.count(UserBadge.id)).filter(UserBadge.user_id == user.id).scalar()
    total_badges = db.query(func.count(Badge.id)).scalar()

    db.commit()

    return {
        "total_points": total_pts,
        "tier_name": tier["name"],
        "next_tier": tier.get("next"),
        "tier_progress_percent": tier["progress"],
        "current_streak": streak_rec.current_streak if streak_rec else 0,
        "longest_streak": streak_rec.longest_streak if streak_rec else 0,
        "freeze_shields": streak_rec.freeze_shields_available if streak_rec else 0,
        "badges_count": badges_earned,
        "total_badges": total_badges
    }


@app.get("/api/rewards/badges")
def get_badges(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _sync_user_badges(user.id, db)
    all_badges = db.query(Badge).all()
    earned = {r.badge_id: r.earned_at for r in db.query(UserBadge).filter(
        UserBadge.user_id == user.id).all()}

    result = []
    for b in all_badges:
        result.append({
            "id": b.id, "name": b.name, "description": b.description,
            "requirement": b.requirement, "points": b.points,
            "category": b.category, "icon_name": b.icon_name,
            "is_unlocked": b.id in earned,
            "earned_at": earned[b.id].isoformat() if b.id in earned and earned[b.id] else None
        })
    db.commit()
    return result


@app.get("/api/rewards/perks")
def get_perks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    redeemed_ids = {
        redemption.perk_id for redemption in db.query(PerkRedemption).filter(
            PerkRedemption.user_id == user.id
        ).all()
    }
    db.commit()
    return [{
        "id": perk.id,
        "title": perk.title,
        "category": perk.category,
        "description": perk.description,
        "cost": perk.cost,
        "is_redeemed": perk.id in redeemed_ids,
    } for perk in db.query(Perk).filter(Perk.is_active == True).order_by(Perk.cost).all()]


@app.post("/api/rewards/perks/{perk_id}/redeem")
def redeem_perk(perk_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    perk = db.query(Perk).filter(Perk.id == perk_id, Perk.is_active == True).first()
    if not perk:
        raise HTTPException(status_code=404, detail="Reward not found")
    existing = db.query(PerkRedemption).filter(
        PerkRedemption.user_id == user.id, PerkRedemption.perk_id == perk.id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Reward already redeemed")
    total_points = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
        Point.user_id == user.id
    ).scalar()
    if total_points < perk.cost:
        raise HTTPException(status_code=400, detail="Not enough FitPoints")

    db.add(PerkRedemption(user_id=user.id, perk_id=perk.id, points_spent=perk.cost))
    db.add(Point(user_id=user.id, points=-perk.cost,
                 reason=f"Redeemed reward: {perk.title}"))
    db.commit()
    return {"message": "Reward redeemed", "points_spent": perk.cost,
            "total_points": total_points - perk.cost}


@app.get("/api/rewards/points-history")
def points_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pts = db.query(Point).filter(Point.user_id == user.id).order_by(
        desc(Point.created_at)).limit(50).all()
    return [
        {"id": p.id, "points": p.points, "reason": p.reason,
         "created_at": p.created_at.isoformat() if p.created_at else None}
        for p in pts
    ]


# ===========================================================================
# ANALYTICS ENDPOINTS
# ===========================================================================
@app.get("/api/analytics/weekly")
def analytics_weekly(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=6)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    daily_stats = []
    active_days = 0
    total_cal = 0
    total_min = 0

    for i in range(7):
        d = week_start + timedelta(days=i)
        acts = db.query(Activity).filter(
            Activity.user_id == user.id, Activity.activity_date == d).all()
        cal = sum(a.calories for a in acts)
        mins = sum(a.duration_minutes for a in acts)
        if len(acts) > 0:
            active_days += 1
        total_cal += cal
        total_min += mins
        daily_stats.append({
            "day": day_names[d.weekday()],
            "date": str(d),
            "calories": cal,
            "minutes": mins,
            "workout_count": len(acts)
        })

    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    weekly_cal_target = (profile.daily_calorie_target if profile else 500) * 7
    goal_pct = min(100, round(total_cal / weekly_cal_target * 100)) if weekly_cal_target else 0

    return {
        "daily_stats": daily_stats,
        "total_calories": total_cal,
        "total_minutes": total_min,
        "goal_completion_percent": goal_pct,
        "consistency_score": round(active_days / 7 * 100, 1)
    }


@app.get("/api/analytics/monthly")
def analytics_monthly(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    month_start = today.replace(day=1)
    total_days = (today - month_start).days + 1

    weeks = []
    week_data = {"week": 1, "calories": 0, "minutes": 0, "workouts": 0}
    weekly_idx = 1
    active_days = 0

    for i in range(total_days):
        d = month_start + timedelta(days=i)
        acts = db.query(Activity).filter(
            Activity.user_id == user.id, Activity.activity_date == d).all()
        cal = sum(a.calories for a in acts)
        mins = sum(a.duration_minutes for a in acts)
        wk_count = len(acts)
        if wk_count > 0:
            active_days += 1
        week_data["calories"] += cal
        week_data["minutes"] += mins
        week_data["workouts"] += wk_count
        if d.weekday() == 6 or i == total_days - 1:
            weeks.append(week_data)
            weekly_idx += 1
            week_data = {"week": weekly_idx, "calories": 0, "minutes": 0, "workouts": 0}

    monthly_cal = sum(w["calories"] for w in weeks)
    monthly_min = sum(w["minutes"] for w in weeks)

    return {
        "weeks": weeks,
        "monthly_calories": monthly_cal,
        "monthly_minutes": monthly_min,
        "active_days_count": active_days
    }


@app.get("/api/analytics/distribution")
def activity_distribution(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = db.query(
        Activity.activity_type,
        func.sum(Activity.calories).label("total_cal"),
        func.sum(Activity.duration_minutes).label("total_min"),
        func.count(Activity.id).label("count")
    ).filter(Activity.user_id == user.id).group_by(Activity.activity_type).all()

    grand_cal = sum(r.total_cal or 0 for r in results) or 1
    grand_min = sum(r.total_min or 0 for r in results) or 1

    distribution = []
    for r in results:
        distribution.append({
            "name": r.activity_type,
            "percent": round((r.total_cal or 0) / grand_cal * 100),
            "calories": r.total_cal or 0,
            "minutes": r.total_min or 0,
            "icon": ACTIVITY_ICONS.get(r.activity_type, "⚡"),
            "color": ACTIVITY_COLORS.get(r.activity_type, "#64748b")
        })

    distribution.sort(key=lambda x: x["calories"], reverse=True)

    return {
        "distribution": distribution,
        "total_calories": grand_cal,
        "sedentary_study_hours": round(max(0, 12 - grand_min / 60), 1),
        "active_exercise_hours": round(grand_min / 60, 1)
    }


# ===========================================================================
# AI RECOMMENDATIONS ENDPOINT
# ===========================================================================
@app.get("/api/recommendations")
def get_recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    today = date.today()

    today_acts = db.query(Activity).filter(
        Activity.user_id == user.id, Activity.activity_date == today).all()
    today_min = sum(a.duration_minutes for a in today_acts)
    today_cal = sum(a.calories for a in today_acts)

    target_min = profile.daily_active_minutes_target if profile else 45
    target_cal = profile.daily_calorie_target if profile else 500
    deficit_min = max(0, target_min - today_min)

    weight = float(profile.weight) if profile else 68.0
    preferred = []
    if profile:
        pa = profile.preferred_activities
        if isinstance(pa, str):
            pa = json.loads(pa)
        preferred = pa

    # Determine sedentary risk
    if today_min >= target_min:
        risk = "Low"
    elif today_min >= target_min * 0.5:
        risk = "Moderate"
    else:
        risk = "High"

    recs = []
    if deficit_min > 0 and preferred:
        for act_type in preferred[:3]:
            dur = min(deficit_min, 30)
            cal = calculate_calories(act_type, dur, "Moderate", weight)
            recs.append({
                "title": f"{act_type} Session",
                "activity_type": act_type,
                "suggested_duration_minutes": dur,
                "estimated_calories": cal,
                "intensity": "Moderate",
                "rationale": f"A {dur}-minute {act_type.lower()} session can help close your daily {deficit_min}-minute movement gap. "
                             f"Calibrated for {user.department} students with sedentary study patterns."
            })
    else:
        recs.append({
            "title": "Recovery & Posture",
            "activity_type": "Yoga",
            "suggested_duration_minutes": 15,
            "estimated_calories": calculate_calories("Yoga", 15, "Low", weight),
            "intensity": "Low",
            "rationale": "You've met your daily targets! A gentle recovery stretch can help relieve tension from prolonged desk work."
        })

    msg = (f"You've logged {today_min} minutes today out of your {target_min}-minute target. "
           f"{'Great progress!' if today_min > 0 else 'Time to get moving!'}")

    return {
        "sedentary_risk_level": risk,
        "daily_deficit_minutes": deficit_min,
        "message": msg,
        "recommendations": recs
    }


# ===========================================================================
# NOTIFICATIONS ENDPOINTS
# ===========================================================================
@app.get("/api/notifications")
def get_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == user.id).order_by(
        desc(Notification.created_at)).limit(20).all()
    return [
        {"id": n.id, "title": n.title, "message": n.message,
         "is_read": n.is_read, "notification_type": n.notification_type,
         "created_at": n.created_at.isoformat() if n.created_at else None}
        for n in notifs
    ]


@app.put("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, user: User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id,
                                       Notification.user_id == user.id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "ok"}


# ===========================================================================
# DASHBOARD SUMMARY ENDPOINT
# ===========================================================================
@app.get("/api/dashboard")
def dashboard_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Single endpoint returning all data needed for the student dashboard."""
    today = date.today()

    # Today's stats
    today_acts = db.query(Activity).filter(
        Activity.user_id == user.id, Activity.activity_date == today).all()
    today_cal = sum(a.calories for a in today_acts)
    today_min = sum(a.duration_minutes for a in today_acts)

    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    cal_target = profile.daily_calorie_target if profile else 500
    min_target = profile.daily_active_minutes_target if profile else 45

    # Points & Streak
    total_pts = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
        Point.user_id == user.id).scalar()
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()
    tier = get_tier(total_pts)

    # Leaderboard rank
    all_pts = db.query(
        User.id, func.coalesce(func.sum(Point.points), 0).label("pts")
    ).outerjoin(Point, Point.user_id == User.id).filter(
        User.role == "student"
    ).group_by(User.id).order_by(desc("pts")).all()
    user_rank = next((i + 1 for i, r in enumerate(all_pts) if r.id == user.id), 0)

    # Weekly chart data
    week_start = today - timedelta(days=6)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_chart = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        acts = db.query(Activity).filter(
            Activity.user_id == user.id, Activity.activity_date == d).all()
        weekly_chart.append({
            "day": day_names[d.weekday()] + (" (Today)" if d == today else ""),
            "calories": sum(a.calories for a in acts),
            "minutes": sum(a.duration_minutes for a in acts),
            "is_today": d == today
        })

    # Active challenge
    active_ch = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.user_id == user.id).all()
    first_challenge = None
    if active_ch:
        ch = db.query(Challenge).filter(
            Challenge.id == active_ch[0].challenge_id, Challenge.is_active == True).first()
        if ch:
            pcount = db.query(func.count(ChallengeParticipant.id)).filter(
                ChallengeParticipant.challenge_id == ch.id).scalar()
            days_left = (ch.end_date - datetime.utcnow()).days if ch.end_date else 0
            first_challenge = {
                "id": ch.id, "title": ch.title, "description": ch.description,
                "challenge_type": ch.challenge_type, "metric_type": ch.metric_type,
                "target_value": float(ch.target_value),
                "current_value": float(ch.current_value or 0),
                "points": ch.points, "participants": pcount,
                "duration": f"{max(0, days_left)} Days Left",
                "user_contribution": float(active_ch[0].progress or 0)
            }

    # Badges
    all_badges = db.query(Badge).all()
    earned_ids = set(r.badge_id for r in db.query(UserBadge).filter(
        UserBadge.user_id == user.id).all())
    badges_summary = [
        {"id": b.id, "name": b.name, "icon_name": b.icon_name,
         "is_unlocked": b.id in earned_ids, "description": b.description}
        for b in all_badges
    ]

    # Today's activity list
    today_activities_list = [
        {
            "id": a.id, "type": a.activity_type,
            "duration": a.duration_minutes,
            "distance": float(a.distance) if a.distance else None,
            "intensity": a.intensity, "calories": a.calories,
            "notes": a.notes,
            "points_earned": calculate_points(a.duration_minutes, a.intensity,
                                              float(a.distance) if a.distance else None)
        }
        for a in today_acts
    ]

    return {
        "user": {
            "name": user.name, "department": user.department,
            "college": user.college, "year": user.year
        },
        "today": {
            "calories": today_cal, "minutes": today_min,
            "calorie_target": cal_target, "minute_target": min_target,
            "calorie_percent": min(100, round(today_cal / cal_target * 100)) if cal_target else 0,
            "minute_percent": min(100, round(today_min / min_target * 100)) if min_target else 0,
            "activities": today_activities_list
        },
        "streak": streak_rec.current_streak if streak_rec else 0,
        "longest_streak": streak_rec.longest_streak if streak_rec else 0,
        "points": total_pts,
        "tier": tier,
        "rank": user_rank,
        "weekly_chart": weekly_chart,
        "active_challenge": first_challenge,
        "badges": badges_summary,
        "earned_badges_count": len(earned_ids),
        "total_badges_count": len(all_badges)
    }


# ===========================================================================
# ADMIN ENDPOINTS
# ===========================================================================
@app.get("/api/admin/overview")
def admin_overview(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar()

    # Active students: those with activity in last 7 days
    week_ago = date.today() - timedelta(days=7)
    active_students = db.query(func.count(distinct(Activity.user_id))).filter(
        Activity.activity_date >= week_ago).scalar()

    total_activities = db.query(func.count(Activity.id)).scalar()
    total_minutes = db.query(func.coalesce(func.sum(Activity.duration_minutes), 0)).scalar()
    active_challenges = db.query(func.count(Challenge.id)).filter(Challenge.is_active == True).scalar()
    total_points = db.query(func.coalesce(func.sum(Point.points), 0)).scalar()

    return {
        "total_students": total_students,
        "active_students": active_students,
        "total_activities": total_activities,
        "total_minutes": total_minutes,
        "active_challenges": active_challenges,
        "total_points_awarded": total_points
    }


@app.get("/api/admin/students")
def admin_students(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == "student").all()
    week_ago = date.today() - timedelta(days=7)

    result = []
    for s in students:
        pts = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
            Point.user_id == s.id).scalar()
        streak_rec = db.query(Streak).filter(Streak.user_id == s.id).first()
        act_count = db.query(func.count(Activity.id)).filter(Activity.user_id == s.id).scalar()
        recent = db.query(func.count(Activity.id)).filter(
            Activity.user_id == s.id, Activity.activity_date >= week_ago).scalar()
        result.append({
            "id": s.id, "name": s.name, "email": s.email,
            "department": s.department, "year": s.year,
            "total_points": pts,
            "streak": streak_rec.current_streak if streak_rec else 0,
            "total_activities": act_count,
            "is_active": recent > 0,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result


@app.get("/api/admin/student-analytics")
def admin_student_analytics(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Students by department
    dept_counts = db.query(
        User.department, func.count(User.id).label("count")
    ).filter(User.role == "student").group_by(User.department).all()

    week_ago = date.today() - timedelta(days=7)
    active_ids = set(r[0] for r in db.query(distinct(Activity.user_id)).filter(
        Activity.activity_date >= week_ago).all())
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar()
    inactive = total_students - len(active_ids)

    # Activity frequency (per day of week)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    freq = []
    for i in range(7):
        d = date.today() - timedelta(days=6) + timedelta(days=i)
        cnt = db.query(func.count(Activity.id)).filter(Activity.activity_date == d).scalar()
        freq.append({"day": day_names[d.weekday()], "count": cnt})

    # Goal completion
    total_goals = db.query(func.count(Goal.id)).scalar()
    completed_goals = db.query(func.count(Goal.id)).filter(Goal.status == "completed").scalar()

    # Participation
    students_with_activity = db.query(func.count(distinct(Activity.user_id))).scalar()
    participation_pct = round(students_with_activity / total_students * 100) if total_students else 0

    return {
        "by_department": [{"department": d, "count": c} for d, c in dept_counts],
        "active_students": len(active_ids),
        "inactive_students": inactive,
        "activity_frequency": freq,
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "goal_completion_percent": round(completed_goals / total_goals * 100) if total_goals else 0,
        "participation_percent": participation_pct
    }


@app.get("/api/admin/department-analytics")
def admin_department_analytics(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    depts = db.query(distinct(User.department)).filter(User.role == "student").all()
    week_ago = date.today() - timedelta(days=7)
    result = []

    for (dept,) in depts:
        student_ids = [r[0] for r in db.query(User.id).filter(
            User.department == dept, User.role == "student").all()]
        if not student_ids:
            continue
        total_pts = db.query(func.coalesce(func.sum(Point.points), 0)).filter(
            Point.user_id.in_(student_ids)).scalar()
        total_min = db.query(func.coalesce(func.sum(Activity.duration_minutes), 0)).filter(
            Activity.user_id.in_(student_ids)).scalar()
        active = db.query(func.count(distinct(Activity.user_id))).filter(
            Activity.user_id.in_(student_ids), Activity.activity_date >= week_ago).scalar()
        ch_joined = db.query(func.count(ChallengeParticipant.id)).filter(
            ChallengeParticipant.user_id.in_(student_ids)).scalar()
        ch_completed = db.query(func.count(ChallengeParticipant.id)).filter(
            ChallengeParticipant.user_id.in_(student_ids),
            ChallengeParticipant.is_completed == True).scalar()

        result.append({
            "department": dept,
            "total_students": len(student_ids),
            "active_students": active,
            "total_points": total_pts,
            "total_minutes": total_min,
            "challenges_joined": ch_joined,
            "challenges_completed": ch_completed,
            "participation_percent": round(active / len(student_ids) * 100) if student_ids else 0
        })

    result.sort(key=lambda x: x["total_points"], reverse=True)
    return result


# Admin challenge CRUD
@app.post("/api/admin/challenges")
def admin_create_challenge(
    title: str, description: str, challenge_type: str = "campus",
    metric_type: str = "km", target_value: float = 100,
    start_date: str = None, end_date: str = None,
    points: int = 100, badge_reward: str = None,
    admin: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    start = datetime.fromisoformat(start_date) if start_date else datetime.utcnow()
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow() + timedelta(days=7)
    ch = Challenge(
        title=title, description=description, challenge_type=challenge_type,
        metric_type=metric_type, target_value=target_value,
        current_value=0, start_date=start, end_date=end,
        points=points, badge_reward=badge_reward, is_active=True
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return {"message": "Challenge created", "challenge_id": ch.id}


@app.put("/api/admin/challenges/{challenge_id}")
def admin_update_challenge(
    challenge_id: int, title: str = None, description: str = None,
    target_value: float = None, points: int = None,
    start_date: str = None, end_date: str = None,
    is_active: bool = None,
    admin: User = Depends(get_current_admin), db: Session = Depends(get_db)
):
    ch = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if title:
        ch.title = title
    if description:
        ch.description = description
    if target_value is not None:
        ch.target_value = target_value
    if points is not None:
        ch.points = points
    if start_date:
        ch.start_date = datetime.fromisoformat(start_date)
    if end_date:
        ch.end_date = datetime.fromisoformat(end_date)
    if is_active is not None:
        ch.is_active = is_active
    db.commit()
    return {"message": "Challenge updated"}


@app.delete("/api/admin/challenges/{challenge_id}")
def admin_delete_challenge(challenge_id: int,
                           admin: User = Depends(get_current_admin),
                           db: Session = Depends(get_db)):
    ch = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")
    db.delete(ch)
    db.commit()
    return {"message": "Challenge deleted"}


@app.get("/api/admin/challenges/{challenge_id}/participants")
def admin_challenge_participants(challenge_id: int,
                                  admin: User = Depends(get_current_admin),
                                  db: Session = Depends(get_db)):
    participants = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id).all()
    result = []
    for p in participants:
        u = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "user_id": p.user_id,
            "name": u.name if u else "Unknown",
            "department": u.department if u else "",
            "progress": float(p.progress or 0),
            "is_completed": p.is_completed,
            "joined_at": p.joined_at.isoformat() if p.joined_at else None
        })
    return result


@app.get("/api/admin/challenges")
def admin_get_challenges(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    challenges = db.query(Challenge).order_by(desc(Challenge.created_at)).all()
    result = []
    for ch in challenges:
        pcount = db.query(func.count(ChallengeParticipant.id)).filter(
            ChallengeParticipant.challenge_id == ch.id).scalar()
        result.append({
            "id": ch.id, "title": ch.title, "description": ch.description,
            "challenge_type": ch.challenge_type, "metric_type": ch.metric_type,
            "target_value": float(ch.target_value),
            "current_value": float(ch.current_value or 0),
            "start_date": ch.start_date.isoformat() if ch.start_date else None,
            "end_date": ch.end_date.isoformat() if ch.end_date else None,
            "points": ch.points, "badge_reward": ch.badge_reward,
            "is_active": ch.is_active,
            "participants_count": pcount
        })
    return result


@app.get("/api/admin/reports/weekly")
def admin_weekly_report(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=6)

    daily_data = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(7):
        d = week_start + timedelta(days=i)
        acts = db.query(func.count(Activity.id)).filter(Activity.activity_date == d).scalar()
        cal = db.query(func.coalesce(func.sum(Activity.calories), 0)).filter(
            Activity.activity_date == d).scalar()
        mins = db.query(func.coalesce(func.sum(Activity.duration_minutes), 0)).filter(
            Activity.activity_date == d).scalar()
        users = db.query(func.count(distinct(Activity.user_id))).filter(
            Activity.activity_date == d).scalar()
        daily_data.append({
            "day": day_names[d.weekday()], "date": str(d),
            "activities": acts, "calories": cal, "minutes": mins,
            "active_users": users
        })

    return {
        "period": f"{week_start} to {today}",
        "daily_data": daily_data,
        "total_activities": sum(d["activities"] for d in daily_data),
        "total_calories": sum(d["calories"] for d in daily_data),
        "total_minutes": sum(d["minutes"] for d in daily_data)
    }


@app.get("/api/admin/reports/monthly")
def admin_monthly_report(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    today = date.today()
    month_start = today.replace(day=1)

    total_acts = db.query(func.count(Activity.id)).filter(
        Activity.activity_date >= month_start).scalar()
    total_cal = db.query(func.coalesce(func.sum(Activity.calories), 0)).filter(
        Activity.activity_date >= month_start).scalar()
    total_min = db.query(func.coalesce(func.sum(Activity.duration_minutes), 0)).filter(
        Activity.activity_date >= month_start).scalar()
    active_users = db.query(func.count(distinct(Activity.user_id))).filter(
        Activity.activity_date >= month_start).scalar()
    new_users = db.query(func.count(User.id)).filter(
        User.created_at >= month_start, User.role == "student").scalar()
    badges_awarded = db.query(func.count(UserBadge.id)).filter(
        UserBadge.earned_at >= month_start).scalar()

    return {
        "period": f"{month_start} to {today}",
        "total_activities": total_acts,
        "total_calories": total_cal,
        "total_minutes": total_min,
        "active_users": active_users,
        "new_users": new_users,
        "badges_awarded": badges_awarded
    }


@app.get("/api/admin/reports/departments")
def admin_department_report(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    depts = db.query(distinct(User.department)).filter(User.role == "student").all()
    result = []
    for (dept,) in depts:
        student_count = db.query(func.count(User.id)).filter(
            User.department == dept, User.role == "student").scalar()
        student_ids = [r[0] for r in db.query(User.id).filter(
            User.department == dept, User.role == "student").all()]
        if not student_ids:
            continue
        total_acts = db.query(func.count(Activity.id)).filter(
            Activity.user_id.in_(student_ids)).scalar()
        total_min = db.query(func.coalesce(func.sum(Activity.duration_minutes), 0)).filter(
            Activity.user_id.in_(student_ids)).scalar()
        total_cal = db.query(func.coalesce(func.sum(Activity.calories), 0)).filter(
            Activity.user_id.in_(student_ids)).scalar()
        active = db.query(func.count(distinct(Activity.user_id))).filter(
            Activity.user_id.in_(student_ids),
            Activity.activity_date >= date.today() - timedelta(days=7)).scalar()
        result.append({
            "department": dept,
            "total_students": student_count,
            "active_students": active,
            "total_activities": total_acts,
            "total_minutes": total_min,
            "total_calories": total_cal,
            "participation_percent": round(active / student_count * 100) if student_count else 0
        })
    result.sort(key=lambda x: x["total_calories"], reverse=True)
    return result


# ===========================================================================
# SEED ENDPOINT (for demo setup without MySQL)
# ===========================================================================
@app.post("/api/seed", include_in_schema=False)
def seed_database(db: Session = Depends(get_db)):
    """Seeds demo data into the database (for SQLite testing)."""
    if (os.getenv("APP_ENV", "development").strip().lower() != "development"
            or os.getenv("DEV_SEED_ENABLED", "false").strip().lower() != "true"):
        raise HTTPException(status_code=404, detail="Not found")
    # Check if already seeded
    if db.query(User).first():
        return {"message": "Database already has data"}

    # Departments
    departments = [
        Department(college="National Institute of Technology", department_name="Computer Science & Engineering", department_code="CSE"),
        Department(college="National Institute of Technology", department_name="Electronics & Communication", department_code="ECE"),
        Department(college="National Institute of Technology", department_name="Mechanical Engineering", department_code="MECH"),
        Department(college="National Institute of Technology", department_name="Civil Engineering", department_code="CIVIL"),
        Department(college="National Institute of Technology", department_name="Biotechnology & Life Sciences", department_code="BIOTECH"),
        Department(college="National Institute of Technology", department_name="School of Management", department_code="MBA"),
    ]
    db.add_all(departments)

    # Seeded accounts receive an unshared, temporary credential.
    hashed = get_password_hash(secrets.token_urlsafe(48))
    users = [
        User(name="Aarav Sharma", email="aarav.cse@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Computer Science & Engineering",
               hostel="Hostel Block 4", year="3rd Year", role="student"),
        User(name="Priya Patel", email="priya.ece@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Electronics & Communication",
               hostel="Hostel Block 2", year="4th Year", role="student"),
        User(name="Vikram Singh", email="vikram.mech@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Mechanical Engineering",
               hostel="Hostel Block 4", year="3rd Year", role="student"),
        User(name="Ananya Roy", email="ananya.biotech@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Biotechnology & Life Sciences",
               hostel="Hostel Block 1", year="2nd Year", role="student"),
        User(name="Rohan Gupta", email="rohan.cse@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Computer Science & Engineering",
               hostel="Hostel Block 2", year="1st Year", role="student"),
        User(name="Meera Nair", email="meera.civil@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Civil Engineering",
               hostel="Hostel Block 1", year="3rd Year", role="student"),
        User(name="Devendra K.", email="devendra.ece@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Electronics & Communication",
               hostel="Hostel Block 3", year="2nd Year", role="student"),
        User(name="Tanvi Joshi", email="tanvi.mba@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="School of Management",
               hostel="Hostel Block 3", year="1st Year", role="student"),
        User(name="Dr. Rajesh Sharma", email="admin@campus.edu", password_hash=hashed,
             college="National Institute of Technology", department="Campus Administration",
             year="Staff", role="admin"),
    ]
    db.add_all(users)
    db.flush()

    # Fitness profiles
    profiles = [
        FitnessProfile(user_id=1, age=20, height=175, weight=68, fitness_level="Intermediate",
                        fitness_goal="Beat Sedentary Routine & Build Stamina",
                        preferred_activities='["Running","Gym","Badminton","Walking"]',
                        available_days='[1,2,3,4,5,6]', daily_available_minutes=45,
                        daily_calorie_target=500, daily_active_minutes_target=45),
        FitnessProfile(user_id=2, age=21, height=163, weight=54, fitness_level="Advanced",
                        fitness_goal="Prepare for Inter-College Sports Meet",
                        preferred_activities='["Running","Cycling","Football","Yoga"]',
                        available_days='[1,2,3,4,5,6,7]', daily_available_minutes=60,
                        daily_calorie_target=600, daily_active_minutes_target=60),
        FitnessProfile(user_id=3, age=20, height=180, weight=78, fitness_level="Advanced",
                        fitness_goal="Muscle Building & Strength Conditioning",
                        preferred_activities='["Gym","Basketball","Running"]',
                        available_days='[1,2,3,4,5]', daily_available_minutes=60,
                        daily_calorie_target=650, daily_active_minutes_target=60),
        FitnessProfile(user_id=4, age=19, height=160, weight=52, fitness_level="Intermediate",
                        fitness_goal="Relieve Study Stress",
                        preferred_activities='["Yoga","Walking","Badminton"]',
                        available_days='[1,2,3,4,6]', daily_available_minutes=30,
                        daily_calorie_target=400, daily_active_minutes_target=35),
        FitnessProfile(user_id=5, age=18, height=172, weight=64, fitness_level="Beginner",
                        fitness_goal="Beat Sedentary Routine",
                        preferred_activities='["Cycling","Walking","Cricket"]',
                        available_days='[1,3,5,6]', daily_available_minutes=30,
                        daily_calorie_target=350, daily_active_minutes_target=30),
        FitnessProfile(user_id=6, age=20, height=166, weight=58, fitness_level="Intermediate",
                        fitness_goal="Weight Loss & Active Calorie Deficit",
                        preferred_activities='["Badminton","Gym","Running"]',
                        available_days='[2,3,4,5,6]', daily_available_minutes=45,
                        daily_calorie_target=450, daily_active_minutes_target=45),
    ]
    db.add_all(profiles)

    # Activities (use today and recent dates for demo)
    today = date.today()
    activities = [
        Activity(user_id=1, activity_type="Running", duration_minutes=35, distance=5.2,
                 intensity="High", calories=330, activity_date=today - timedelta(days=1),
                 notes="Morning perimeter campus run before Data Structures class"),
        Activity(user_id=1, activity_type="Badminton", duration_minutes=45, distance=None,
                 intensity="Moderate", calories=290, activity_date=today - timedelta(days=2),
                 notes="Evening doubles match at Hostel 4 court with batchmates"),
        Activity(user_id=1, activity_type="Gym", duration_minutes=50, distance=None,
                 intensity="High", calories=360, activity_date=today - timedelta(days=3),
                 notes="Upper body hypertrophy + core circuit at campus gym"),
        Activity(user_id=1, activity_type="Cycling", duration_minutes=30, distance=8.4,
                 intensity="Moderate", calories=240, activity_date=today - timedelta(days=4),
                 notes="Cycled between academic block and university lake trail"),
        Activity(user_id=1, activity_type="Yoga", duration_minutes=25, distance=None,
                 intensity="Low", calories=95, activity_date=today - timedelta(days=5),
                 notes="Post-hackathon desk stretch & breathing relaxation"),
        Activity(user_id=1, activity_type="Walking", duration_minutes=40, distance=3.1,
                 intensity="Moderate", calories=160, activity_date=today - timedelta(days=6),
                 notes="Brisk walk around student activity center lake"),
        Activity(user_id=2, activity_type="Running", duration_minutes=45, distance=7.5,
                 intensity="High", calories=460, activity_date=today - timedelta(days=1),
                 notes="Fast tempo track workout"),
        Activity(user_id=2, activity_type="Cycling", duration_minutes=40, distance=12.0,
                 intensity="Moderate", calories=320, activity_date=today - timedelta(days=2),
                 notes="Weekend campus perimeter exploration"),
        Activity(user_id=3, activity_type="Gym", duration_minutes=60, distance=None,
                 intensity="High", calories=440, activity_date=today - timedelta(days=1),
                 notes="Heavy squats and deadlift strength session"),
        Activity(user_id=4, activity_type="Yoga", duration_minutes=35, distance=None,
                 intensity="Low", calories=120, activity_date=today - timedelta(days=1),
                 notes="Dorm study-break stretching"),
        Activity(user_id=5, activity_type="Cycling", duration_minutes=35, distance=9.2,
                 intensity="Moderate", calories=250, activity_date=today - timedelta(days=1),
                 notes="Commute from hostel to labs"),
        Activity(user_id=6, activity_type="Badminton", duration_minutes=50, distance=None,
                 intensity="Moderate", calories=310, activity_date=today - timedelta(days=1),
                 notes="Singles practice match"),
    ]
    db.add_all(activities)

    # Goals
    goals = [
        Goal(user_id=1, goal_type="calories", target_value=500, current_value=330,
             start_date=today, end_date=today, status="active"),
        Goal(user_id=1, goal_type="active_minutes", target_value=45, current_value=35,
             start_date=today, end_date=today, status="active"),
        Goal(user_id=1, goal_type="distance", target_value=25, current_value=16.7,
             start_date=today - timedelta(days=6), end_date=today, status="active"),
    ]
    db.add_all(goals)

    # Challenges
    challenges = [
        Challenge(title="Inter-Dept Movement Clash: CSE vs ECE",
                  description="CSE vs ECE: 500km active kilometers this week.",
                  challenge_type="department", metric_type="km",
                  target_value=500, current_value=346.6,
                  start_date=datetime.utcnow() - timedelta(days=5),
                  end_date=datetime.utcnow() + timedelta(days=4),
                  points=300, badge_reward="Department Titan", is_active=True),
        Challenge(title="Campus 10,000 Active Minutes Quest",
                  description="University-wide mission: 10,000 combined active minutes.",
                  challenge_type="campus", metric_type="mins",
                  target_value=10000, current_value=7840,
                  start_date=datetime.utcnow() - timedelta(days=9),
                  end_date=datetime.utcnow() + timedelta(days=6),
                  points=250, badge_reward="Campus Movement Icon", is_active=True),
        Challenge(title="7-Day Dorm Study-Stretch Habit",
                  description="20 min stretching/yoga/walking 7 days in a row.",
                  challenge_type="individual", metric_type="sessions",
                  target_value=7, current_value=6,
                  start_date=datetime.utcnow() - timedelta(days=6),
                  end_date=datetime.utcnow() + timedelta(days=1),
                  points=150, badge_reward="Flame Keeper", is_active=True),
        Challenge(title="Weekend 15km Cycling & Running Derby",
                  description="Cover 15km cycling/running this weekend.",
                  challenge_type="individual", metric_type="km",
                  target_value=15, current_value=0,
                  start_date=datetime.utcnow() + timedelta(days=3),
                  end_date=datetime.utcnow() + timedelta(days=5),
                  points=180, badge_reward="Weekend Warrior", is_active=True),
        Challenge(title="Mechanical vs Civil Tug-of-Stamina",
                  description="Mech vs Civil calorie burning challenge.",
                  challenge_type="department", metric_type="kcal",
                  target_value=100000, current_value=64200,
                  start_date=datetime.utcnow() - timedelta(days=4),
                  end_date=datetime.utcnow() + timedelta(days=3),
                  points=250, badge_reward="Stamina Hero", is_active=True),
    ]
    db.add_all(challenges)
    db.flush()

    # Challenge participants
    participants = [
        ChallengeParticipant(challenge_id=1, user_id=1, progress=22.4),
        ChallengeParticipant(challenge_id=1, user_id=2, progress=28.5),
        ChallengeParticipant(challenge_id=1, user_id=5, progress=14.2),
        ChallengeParticipant(challenge_id=2, user_id=1, progress=160),
        ChallengeParticipant(challenge_id=2, user_id=2, progress=210),
        ChallengeParticipant(challenge_id=2, user_id=3, progress=180),
        ChallengeParticipant(challenge_id=3, user_id=1, progress=6),
    ]
    db.add_all(participants)

    # Badges
    badges = [
        Badge(name="First Step", description="Logged your very first workout", requirement="Log 1 activity",
              points=50, category="Milestone", icon_name="Footprints"),
        Badge(name="Flame Keeper", description="Maintained a 5-day active streak", requirement="5-day streak",
              points=150, category="Streak", icon_name="Flame"),
        Badge(name="Century Burner", description="Burned 300+ kcal in a single workout", requirement="300+ kcal single workout",
              points=100, category="Performance", icon_name="Zap"),
        Badge(name="Weekend Warrior", description="Worked out on both weekend days", requirement="Weekend activities",
              points=80, category="Milestone", icon_name="Award"),
        Badge(name="Campus Sprinter", description="25km+ cumulative running distance", requirement="25km total running",
              points=120, category="Performance", icon_name="TrendingUp"),
        Badge(name="Desk Break Zen Master", description="5 yoga/stretch sessions completed", requirement="5 yoga sessions",
              points=100, category="Wellness", icon_name="Compass"),
        Badge(name="Department Titan", description="500+ points in department challenges", requirement="500 dept challenge pts",
              points=250, category="Community", icon_name="Shield"),
        Badge(name="Iron Lungs", description="10km+ single run or 30km cycling", requirement="10km run or 30km ride",
              points=200, category="Performance", icon_name="Target"),
    ]
    db.add_all(badges)
    db.flush()

    # User badges
    user_badges = [
        UserBadge(user_id=1, badge_id=1), UserBadge(user_id=1, badge_id=2),
        UserBadge(user_id=1, badge_id=3), UserBadge(user_id=1, badge_id=4),
        UserBadge(user_id=1, badge_id=5),
        UserBadge(user_id=2, badge_id=1), UserBadge(user_id=2, badge_id=2),
        UserBadge(user_id=2, badge_id=5),
        UserBadge(user_id=3, badge_id=1), UserBadge(user_id=3, badge_id=3),
    ]
    db.add_all(user_badges)

    # Points
    points = [
        Point(user_id=1, points=50, reason="Welcome bonus"),
        Point(user_id=1, points=50, reason="Earned badge: First Step"),
        Point(user_id=1, points=45, reason="Logged 35m Running"),
        Point(user_id=1, points=40, reason="Logged 45m Badminton"),
        Point(user_id=1, points=50, reason="Logged 50m Gym workout"),
        Point(user_id=1, points=150, reason="Earned badge: Flame Keeper"),
        Point(user_id=1, points=100, reason="Earned badge: Century Burner"),
        Point(user_id=1, points=120, reason="Earned badge: Campus Sprinter"),
        Point(user_id=1, points=80, reason="Earned badge: Weekend Warrior"),
        Point(user_id=1, points=735, reason="Historical workout points"),
        Point(user_id=2, points=2180, reason="Cumulative points"),
        Point(user_id=3, points=1940, reason="Cumulative points"),
        Point(user_id=4, points=680, reason="Cumulative points"),
        Point(user_id=5, points=520, reason="Cumulative points"),
        Point(user_id=6, points=450, reason="Cumulative points"),
        Point(user_id=7, points=380, reason="Cumulative points"),
        Point(user_id=8, points=290, reason="Cumulative points"),
    ]
    db.add_all(points)

    # Streaks
    streaks = [
        Streak(user_id=1, current_streak=6, longest_streak=14,
               last_activity_date=today - timedelta(days=1), freeze_shields_available=1),
        Streak(user_id=2, current_streak=19, longest_streak=19,
               last_activity_date=today - timedelta(days=1), freeze_shields_available=2),
        Streak(user_id=3, current_streak=14, longest_streak=14,
               last_activity_date=today - timedelta(days=1)),
        Streak(user_id=4, current_streak=8, longest_streak=10,
               last_activity_date=today - timedelta(days=1)),
        Streak(user_id=5, current_streak=11, longest_streak=11,
               last_activity_date=today - timedelta(days=1)),
        Streak(user_id=6, current_streak=5, longest_streak=7,
               last_activity_date=today - timedelta(days=1)),
        Streak(user_id=7, current_streak=7, longest_streak=9,
               last_activity_date=today - timedelta(days=2)),
        Streak(user_id=8, current_streak=4, longest_streak=6,
               last_activity_date=today - timedelta(days=3)),
    ]
    db.add_all(streaks)

    # Notifications
    notifs = [
        Notification(user_id=1, title="🔥 6-Day Streak!", message="1 day from 7-Day Titan badge!",
                     notification_type="streak_alert"),
        Notification(user_id=1, title="⚔️ CSE Leads!", message="CSE leading ECE by 18km",
                     notification_type="challenge_update"),
    ]
    db.add_all(notifs)

    db.commit()
    return {"message": "Database seeded with demo data", "users": 9, "activities": 12}


# ===========================================================================
# AI RECOMMENDATION ENDPOINTS (Scikit-learn + Rule-Based)
# ===========================================================================
from app.ai.recommendation import (
    get_recommendation as ai_get_recommendation,
    get_model_info as ai_get_model_info,
    UserProfile as AIUserProfile,
)


@app.get("/api/ai/recommend")
def ai_recommend(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Full AI-powered fitness recommendation.

    Uses a trained Scikit-learn model if available, otherwise falls back
    to a deterministic rule-based engine.  Both strategies produce the
    same output schema.

    The recommendation considers: age, BMI, fitness level, goal,
    preferred activities, available time, current activity frequency,
    average session duration, and active streak.

    **This does not provide medical advice or diagnose health conditions.**
    """
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()

    # Compute current behaviour stats from last 7 days
    today = date.today()
    week_ago = today - timedelta(days=6)
    recent_acts = db.query(Activity).filter(
        Activity.user_id == user.id,
        Activity.activity_date >= week_ago
    ).all()

    active_dates = set(a.activity_date for a in recent_acts)
    current_days = len(active_dates)
    avg_dur = round(sum(a.duration_minutes for a in recent_acts) / max(len(recent_acts), 1))

    # Parse preferred activities
    preferred = ["Walking", "Gym"]
    if profile:
        pa = profile.preferred_activities
        if isinstance(pa, str):
            pa = json.loads(pa)
        if pa:
            preferred = pa

    # Available days
    avail_days = 5
    if profile:
        ad = profile.available_days
        if isinstance(ad, str):
            ad = json.loads(ad)
        if ad:
            avail_days = len(ad)

    user_profile = AIUserProfile(
        age=profile.age if profile else 20,
        weight_kg=float(profile.weight) if profile else 68.0,
        height_cm=float(profile.height) if profile else 175.0,
        fitness_level=profile.fitness_level if profile else "Intermediate",
        fitness_goal=profile.fitness_goal if profile else "Improve Overall Fitness",
        preferred_activities=preferred,
        available_minutes=profile.daily_available_minutes if profile else 45,
        available_days_per_week=avail_days,
        current_activity_days=current_days,
        current_avg_duration=avg_dur,
        current_streak=streak_rec.current_streak if streak_rec else 0,
    )

    result = ai_get_recommendation(user_profile)
    return result.to_dict()


@app.get("/api/ai/model-info")
def ai_model_info():
    """Returns metadata about the currently loaded AI model."""
    return ai_get_model_info()


@app.post("/api/ai/train")
def ai_train_model(n_samples: int = Query(2000, ge=100, le=10000)):
    """
    Triggers model training (generates synthetic data + trains Scikit-learn
    pipelines).  Useful during development and demo setup.
    """
    try:
        from app.ai.train_model import train_model
        bundle = train_model(n_samples)
        return {
            "message": "Model trained successfully",
            "metrics": bundle.get("metrics", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


# Legacy-compatible simple recommendation endpoint (for existing frontend)
@app.get("/api/recommendations")
def get_recommendations_legacy(user: User = Depends(get_current_user),
                                db: Session = Depends(get_db)):
    """
    Simplified recommendation endpoint that wraps the AI engine and
    returns the format expected by the existing frontend.
    """
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == user.id).first()
    streak_rec = db.query(Streak).filter(Streak.user_id == user.id).first()

    today = date.today()
    week_ago = today - timedelta(days=6)
    recent_acts = db.query(Activity).filter(
        Activity.user_id == user.id,
        Activity.activity_date >= week_ago
    ).all()
    today_acts = [a for a in recent_acts if a.activity_date == today]

    active_dates = set(a.activity_date for a in recent_acts)
    current_days = len(active_dates)
    avg_dur = round(sum(a.duration_minutes for a in recent_acts) / max(len(recent_acts), 1))

    preferred = ["Walking", "Gym"]
    if profile:
        pa = profile.preferred_activities
        if isinstance(pa, str):
            pa = json.loads(pa)
        if pa:
            preferred = pa

    avail_days = 5
    if profile:
        ad = profile.available_days
        if isinstance(ad, str):
            ad = json.loads(ad)
        if ad:
            avail_days = len(ad)

    user_profile = AIUserProfile(
        age=profile.age if profile else 20,
        weight_kg=float(profile.weight) if profile else 68.0,
        height_cm=float(profile.height) if profile else 175.0,
        fitness_level=profile.fitness_level if profile else "Intermediate",
        fitness_goal=profile.fitness_goal if profile else "Improve Overall Fitness",
        preferred_activities=preferred,
        available_minutes=profile.daily_available_minutes if profile else 45,
        available_days_per_week=avail_days,
        current_activity_days=current_days,
        current_avg_duration=avg_dur,
        current_streak=streak_rec.current_streak if streak_rec else 0,
    )

    result = ai_get_recommendation(user_profile)

    today_min = sum(a.duration_minutes for a in today_acts)
    target_min = profile.daily_active_minutes_target if profile else 45

    # Convert to legacy format
    legacy_recs = []
    for rec in result.recommendations:
        legacy_recs.append({
            "title": f"{rec.activity} Session",
            "activity_type": rec.activity,
            "suggested_duration_minutes": rec.duration_minutes,
            "estimated_calories": rec.estimated_calories_per_session,
            "intensity": rec.intensity,
            "frequency": f"{rec.frequency_days_per_week} days/week",
            "weekly_target": f"{rec.weekly_target_minutes} min/week",
            "gradual_target": rec.gradual_target,
            "rationale": rec.explanation,
        })

    return {
        "sedentary_risk_level": result.sedentary_risk,
        "daily_deficit_minutes": result.daily_deficit_minutes,
        "message": result.message,
        "strategy": result.strategy,
        "model_confidence": result.model_confidence,
        "recommendations": legacy_recs,
        "disclaimer": result.disclaimer,
    }


# ===========================================================================
# Health check
# ===========================================================================
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "FitConnect", "version": "1.0.0"}
