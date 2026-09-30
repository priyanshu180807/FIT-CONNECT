from datetime import datetime, date
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field

# -----------------------------------------------------------------------------
# Auth & User Schemas
# -----------------------------------------------------------------------------
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    college: str = Field(default="National Institute of Technology")
    department: str = Field(default="Computer Science & Engineering")
    hostel: Optional[str] = Field(default=None, max_length=100)
    year: str = Field(default="3rd Year")
    # Optional baseline profile metrics during registration
    age: Optional[int] = Field(default=20, ge=15, le=60)
    height: Optional[float] = Field(default=175.0, ge=100.0, le=250.0)
    weight: Optional[float] = Field(default=68.0, ge=30.0, le=200.0)
    fitness_level: Optional[str] = Field(default="Intermediate")
    fitness_goal: Optional[str] = Field(default="Beat Sedentary Routine & Build Stamina")
    preferred_activities: Optional[List[str]] = Field(default=["Running", "Gym", "Badminton"])
    available_days: Optional[List[int]] = Field(default=[1, 2, 3, 4, 5, 6])
    daily_available_minutes: Optional[int] = Field(default=45, ge=10, le=180)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Any

class UserBasicInfo(BaseModel):
    id: int
    name: str
    email: str
    college: str
    department: str
    year: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserFullResponse(BaseModel):
    id: int
    name: str
    email: str
    college: str
    department: str
    year: str
    role: str
    created_at: datetime
    current_streak: int = 0
    total_points: int = 0
    tier_name: str = "Bronze Starter"
    profile: Optional[Any] = None

# -----------------------------------------------------------------------------
# Fitness Profile Schemas
# -----------------------------------------------------------------------------
class FitnessProfileUpdate(BaseModel):
    hostel: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=15, le=60)
    height: Optional[float] = Field(None, ge=100.0, le=250.0)
    weight: Optional[float] = Field(None, ge=30.0, le=200.0)
    fitness_level: Optional[str] = None
    fitness_goal: Optional[str] = None
    preferred_activities: Optional[List[str]] = None
    available_days: Optional[List[int]] = None
    daily_available_minutes: Optional[int] = None

class FitnessProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    height: float
    weight: float
    bmi: float
    fitness_level: str
    fitness_goal: str
    preferred_activities: List[str]
    available_days: List[int]
    daily_available_minutes: int
    daily_calorie_target: int
    daily_active_minutes_target: int
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Activity Schemas
# -----------------------------------------------------------------------------
class ActivityCreate(BaseModel):
    activity_type: str
    duration_minutes: int = Field(..., ge=1, le=480)
    distance: Optional[float] = Field(None, ge=0.0, le=200.0)
    intensity: Optional[str] = Field(default="Moderate")  # Low, Moderate, High
    activity_date: Optional[date] = None
    notes: Optional[str] = None

class ActivityResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    duration_minutes: int
    distance: Optional[float] = None
    intensity: str
    calories: int
    activity_date: date
    notes: Optional[str] = None
    created_at: datetime
    points_earned: int = 0

    class Config:
        from_attributes = True

class TodaySummaryResponse(BaseModel):
    date: date
    today_calories: int
    today_minutes: int
    calorie_target: int
    minute_target: int
    calorie_percent: int
    minute_percent: int
    workout_count: int
    activities: List[ActivityResponse]

class DailyActivityStat(BaseModel):
    day: str
    date: date
    calories: int
    minutes: int
    workout_count: int

class WeeklySummaryResponse(BaseModel):
    total_calories: int
    total_minutes: int
    total_workouts: int
    days: List[DailyActivityStat]

# -----------------------------------------------------------------------------
# Goal Schemas
# -----------------------------------------------------------------------------
class GoalCreate(BaseModel):
    goal_type: str  # calories, active_minutes, workouts, distance
    target_value: float = Field(..., gt=0)
    start_date: date
    end_date: date

class GoalUpdate(BaseModel):
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    status: Optional[str] = None  # active, completed, expired

class GoalResponse(BaseModel):
    id: int
    user_id: int
    goal_type: str
    target_value: float
    current_value: float
    start_date: date
    end_date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Challenge Schemas
# -----------------------------------------------------------------------------
class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    challenge_type: str
    metric_type: str
    target_value: float
    current_value: float
    start_date: datetime
    end_date: datetime
    points: int
    badge_reward: Optional[str] = None
    is_active: bool
    participants_count: int = 0
    is_joined: bool = False
    user_contribution: float = 0.0

    class Config:
        from_attributes = True

class ParticipantProgressResponse(BaseModel):
    challenge_id: int
    user_id: int
    user_progress: float
    target_value: float
    metric_type: str
    is_completed: bool
    is_joined: bool

# -----------------------------------------------------------------------------
# Leaderboard Schemas
# -----------------------------------------------------------------------------
class StudentLeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    department: str
    year: str
    points: int
    streak: int
    avatar: str
    is_current_user: bool = False

class DepartmentLeaderboardEntry(BaseModel):
    rank: int
    department_name: str
    department_code: str
    points: int
    active_students: int
    avg_calories: int
    top_performer: str

class CampusLeaderboardEntry(BaseModel):
    rank: int
    hostel_name: str
    description: str
    active_residents: int
    points: int

# -----------------------------------------------------------------------------
# Rewards & Badges Schemas
# -----------------------------------------------------------------------------
class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    requirement: str
    points: int
    category: str
    icon_name: str
    is_unlocked: bool = False
    earned_at: Optional[datetime] = None

class PointLogResponse(BaseModel):
    id: int
    points: int
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

class RewardsOverviewResponse(BaseModel):
    total_points: int
    tier_name: str
    next_tier: Optional[str] = None
    tier_progress_percent: int
    current_streak: int
    longest_streak: int
    freeze_shields: int
    badges_count: int
    total_badges: int

# -----------------------------------------------------------------------------
# Analytics Schemas
# -----------------------------------------------------------------------------
class AnalyticsWeeklyResponse(BaseModel):
    daily_stats: List[DailyActivityStat]
    total_calories: int
    total_minutes: int
    goal_completion_percent: int
    consistency_score: float

class AnalyticsMonthlyResponse(BaseModel):
    weeks: List[dict]
    monthly_calories: int
    monthly_minutes: int
    active_days_count: int

class ActivityDistributionItem(BaseModel):
    name: str
    percent: int
    calories: int
    minutes: int
    icon: str
    color: str

class ActivityDistributionResponse(BaseModel):
    distribution: List[ActivityDistributionItem]
    total_calories: int
    sedentary_study_hours: float
    active_exercise_hours: float

# -----------------------------------------------------------------------------
# Recommendation Schemas
# -----------------------------------------------------------------------------
class RecommendationItem(BaseModel):
    title: str
    activity_type: str
    suggested_duration_minutes: int
    estimated_calories: int
    intensity: str
    rationale: str

class RecommendationResponse(BaseModel):
    sedentary_risk_level: str  # Low, Moderate, High
    daily_deficit_minutes: int
    message: str
    recommendations: List[RecommendationItem]

# -----------------------------------------------------------------------------
# Notification Schemas
# -----------------------------------------------------------------------------
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    notification_type: str
    created_at: datetime

    class Config:
        from_attributes = True
