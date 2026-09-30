from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Numeric, Date, DateTime, Boolean, Text,
    ForeignKey, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# -----------------------------------------------------------------------------
# 1. Department Entity
# -----------------------------------------------------------------------------
class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    college = Column(String(150), nullable=False)
    department_name = Column(String(100), nullable=False)
    department_code = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("college", "department_name", name="uq_college_dept"),
        Index("idx_departments_college", "college"),
    )

    def __repr__(self):
        return f"<Department(code='{self.department_code}', name='{self.department_name}')>"

# -----------------------------------------------------------------------------
# 2. User Entity
# -----------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    college = Column(String(150), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    hostel = Column(String(100), nullable=True)
    year = Column(String(50), nullable=False)
    role = Column(Enum("student", "admin", "coordinator"), default="student", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    fitness_profile = relationship("FitnessProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan", order_by="desc(Activity.activity_date)")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    challenge_participations = relationship("ChallengeParticipant", back_populates="user", cascade="all, delete-orphan")
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    point_logs = relationship("Point", back_populates="user", cascade="all, delete-orphan")
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="desc(Notification.created_at)")
    perk_redemptions = relationship("PerkRedemption", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', dept='{self.department}')>"

# -----------------------------------------------------------------------------
# 3. FitnessProfile Entity
# -----------------------------------------------------------------------------
class FitnessProfile(Base):
    __tablename__ = "fitness_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    age = Column(Integer, nullable=False)
    height = Column(Numeric(5, 2), nullable=False)  # cm
    weight = Column(Numeric(5, 2), nullable=False)  # kg
    fitness_level = Column(Enum("Beginner", "Intermediate", "Advanced"), default="Intermediate", index=True)
    fitness_goal = Column(String(150), nullable=False)
    preferred_activities = Column(JSON, nullable=False)  # ['Running', 'Gym', 'Badminton']
    available_days = Column(JSON, nullable=False)        # [1, 2, 3, 4, 5, 6]
    daily_available_minutes = Column(Integer, default=45, nullable=False)
    daily_calorie_target = Column(Integer, default=500, nullable=False)
    daily_active_minutes_target = Column(Integer, default=45, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="fitness_profile")

    @property
    def bmi(self):
        if self.height and self.weight:
            h_meters = float(self.height) / 100.0
            return round(float(self.weight) / (h_meters * h_meters), 1)
        return 0.0

    def __repr__(self):
        return f"<FitnessProfile(user_id={self.user_id}, goal='{self.fitness_goal}', level='{self.fitness_level}')>"

# -----------------------------------------------------------------------------
# 4. Activity Entity
# -----------------------------------------------------------------------------
class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False)
    distance = Column(Numeric(6, 2), nullable=True)  # km
    intensity = Column(Enum("Low", "Moderate", "High"), default="Moderate")
    calories = Column(Integer, nullable=False)
    activity_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Composite Index for fast user timeline range queries
    __table_args__ = (
        Index("idx_activities_user_date", "user_id", "activity_date"),
    )

    # Relationships
    user = relationship("User", back_populates="activities")

    def __repr__(self):
        return f"<Activity(user_id={self.user_id}, type='{self.activity_type}', duration={self.duration_minutes}m, date={self.activity_date})>"

# -----------------------------------------------------------------------------
# 5. Goal Entity
# -----------------------------------------------------------------------------
class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_type = Column(String(50), nullable=False)  # calories, active_minutes, workouts, distance
    target_value = Column(Numeric(10, 2), nullable=False)
    current_value = Column(Numeric(10, 2), default=0.00)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum("active", "completed", "expired"), default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_goals_user_status", "user_id", "status"),
        Index("idx_goals_date_range", "start_date", "end_date"),
    )

    user = relationship("User", back_populates="goals")

    def __repr__(self):
        return f"<Goal(user_id={self.user_id}, type='{self.goal_type}', target={self.target_value}, status='{self.status}')>"

# -----------------------------------------------------------------------------
# 6. Challenge & ChallengeParticipant Entities
# -----------------------------------------------------------------------------
class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    challenge_type = Column(Enum("individual", "department", "campus"), default="campus", nullable=False, index=True)
    metric_type = Column(Enum("km", "mins", "kcal", "sessions"), default="km", nullable=False)
    target_value = Column(Numeric(10, 2), nullable=False)
    current_value = Column(Numeric(10, 2), default=0.00)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    points = Column(Integer, default=100, nullable=False)
    badge_reward = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_challenges_active", "is_active", "start_date", "end_date"),
    )

    participants = relationship("ChallengeParticipant", back_populates="challenge", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Challenge(id={self.id}, title='{self.title}', type='{self.challenge_type}')>"

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    progress = Column(Numeric(10, 2), default=0.00)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("challenge_id", "user_id", name="uq_participant"),
    )

    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", back_populates="challenge_participations")

    def __repr__(self):
        return f"<ChallengeParticipant(challenge_id={self.challenge_id}, user_id={self.user_id}, progress={self.progress})>"

# -----------------------------------------------------------------------------
# 7. Badge & UserBadge Entities
# -----------------------------------------------------------------------------
class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    requirement = Column(String(255), nullable=False)
    points = Column(Integer, default=50, nullable=False)
    category = Column(Enum("Streak", "Milestone", "Performance", "Community", "Wellness"), default="Milestone")
    icon_name = Column(String(50), default="Award", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Badge(name='{self.name}', points={self.points})>"

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")

    def __repr__(self):
        return f"<UserBadge(user_id={self.user_id}, badge_id={self.badge_id})>"

# -----------------------------------------------------------------------------
# 7b. Campus Perks & Redemptions
# -----------------------------------------------------------------------------
class Perk(Base):
    __tablename__ = "perks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(150), nullable=False, unique=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    redemptions = relationship("PerkRedemption", back_populates="perk", cascade="all, delete-orphan")


class PerkRedemption(Base):
    __tablename__ = "perk_redemptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    perk_id = Column(Integer, ForeignKey("perks.id", ondelete="CASCADE"), nullable=False, index=True)
    points_spent = Column(Integer, nullable=False)
    redeemed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "perk_id", name="uq_user_perk_redemption"),)

    user = relationship("User", back_populates="perk_redemptions")
    perk = relationship("Perk", back_populates="redemptions")

# -----------------------------------------------------------------------------
# 8. Point Entity (FitPoints Ledger)
# -----------------------------------------------------------------------------
class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="point_logs")

    def __repr__(self):
        return f"<Point(user_id={self.user_id}, points={self.points}, reason='{self.reason}')>"

# -----------------------------------------------------------------------------
# 9. Streak Entity
# -----------------------------------------------------------------------------
class Streak(Base):
    __tablename__ = "streaks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    current_streak = Column(Integer, default=0, nullable=False, index=True)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(Date, nullable=True)
    freeze_shields_available = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="streak")

    def __repr__(self):
        return f"<Streak(user_id={self.user_id}, current={self.current_streak}, longest={self.longest_streak})>"

# -----------------------------------------------------------------------------
# 10. Notification Entity
# -----------------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    notification_type = Column(
        Enum("streak_alert", "challenge_update", "badge_unlocked", "ai_suggestion", "system"),
        default="system"
    )
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(user_id={self.user_id}, title='{self.title}', is_read={self.is_read})>"
