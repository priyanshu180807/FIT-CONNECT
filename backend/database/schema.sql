-- =============================================================================
-- FitConnect — MySQL Database Schema DDL
-- Smart India Hackathon 2026 Prototype
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS fitconnect_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitconnect_db;

-- Disable foreign key checks during creation/resets
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS perk_redemptions;
DROP TABLE IF EXISTS perks;

-- -----------------------------------------------------------------------------
-- 1. Table: departments
-- Stores official university colleges and academic departments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college VARCHAR(150) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_college_dept UNIQUE (college, department_name),
    INDEX idx_departments_college (college)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: users
-- Core student and administrative identities
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    college VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hostel VARCHAR(100) NULL,
    year VARCHAR(50) NOT NULL,
    role ENUM('student', 'admin', 'coordinator') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    INDEX idx_users_department (department),
    INDEX idx_users_college (college),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: fitness_profiles
-- Baseline fitness, anthropometrics, lifestyle & availability audit
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS fitness_profiles;
CREATE TABLE fitness_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT NOT NULL,
    height DECIMAL(5,2) NOT NULL COMMENT 'Height in centimeters (e.g. 175.00)',
    weight DECIMAL(5,2) NOT NULL COMMENT 'Weight in kilograms (e.g. 68.50)',
    bmi DECIMAL(4,1) GENERATED ALWAYS AS (ROUND(weight / ((height/100) * (height/100)), 1)) STORED COMMENT 'Auto-calculated BMI',
    fitness_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Intermediate',
    fitness_goal VARCHAR(150) NOT NULL,
    preferred_activities JSON NOT NULL COMMENT 'Array of preferred sports: ["Running", "Gym", "Badminton"]',
    available_days JSON NOT NULL COMMENT 'Days of week available: [1,2,3,4,5,6]',
    daily_available_minutes INT NOT NULL DEFAULT 45,
    daily_calorie_target INT NOT NULL DEFAULT 500,
    daily_active_minutes_target INT NOT NULL DEFAULT 45,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_profile_user UNIQUE (user_id),
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profiles_fitness_level (fitness_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: activities
-- Detailed multi-sport workout tracking with MET scientific calorie burn
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS activities;
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT 'Walking, Running, Cycling, Gym, Yoga, Cricket, Football, Basketball, Badminton, Other',
    duration_minutes INT NOT NULL,
    distance DECIMAL(6,2) NULL COMMENT 'Distance in kilometers if applicable',
    intensity ENUM('Low', 'Moderate', 'High') DEFAULT 'Moderate',
    calories INT NOT NULL COMMENT 'Calculated via scientific MET standards',
    activity_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activities_user_date (user_id, activity_date),
    INDEX idx_activities_type (activity_type),
    INDEX idx_activities_date (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: goals
-- Personalized daily, weekly, or monthly student targets
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS goals;
CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type VARCHAR(50) NOT NULL COMMENT 'calories, active_minutes, workouts, distance',
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'completed', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_goals_user_status (user_id, status),
    INDEX idx_goals_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: challenges
-- Campus-wide, Inter-Department and Individual quests
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS challenges;
CREATE TABLE challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    challenge_type ENUM('individual', 'department', 'campus') NOT NULL DEFAULT 'campus',
    metric_type ENUM('km', 'mins', 'kcal', 'sessions') NOT NULL DEFAULT 'km',
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0.00,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    points INT NOT NULL DEFAULT 100,
    badge_reward VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_challenges_type (challenge_type),
    INDEX idx_challenges_active (is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: challenge_participants
-- Students enrolled in challenges & their cumulative contributions
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS challenge_participants;
CREATE TABLE challenge_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    progress DECIMAL(10,2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_participant UNIQUE (challenge_id, user_id),
    CONSTRAINT fk_cp_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cp_user (user_id),
    INDEX idx_cp_challenge (challenge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: badges
-- Achievement milestones & trophy metadata
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS badges;
CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    requirement VARCHAR(255) NOT NULL,
    points INT NOT NULL DEFAULT 50,
    category ENUM('Streak', 'Milestone', 'Performance', 'Community', 'Wellness') DEFAULT 'Milestone',
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Award',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_badge_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Table: user_badges
-- Unlocked student achievements
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS user_badges;
CREATE TABLE user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id),
    CONSTRAINT fk_ub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ub_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    INDEX idx_ub_user (user_id),
    INDEX idx_ub_badge (badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9b. Table: perks and perk_redemptions
-- ----------------------------------------------------------------------------
CREATE TABLE perks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cost INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_perk_title UNIQUE (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE perk_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    perk_id INT NOT NULL,
    points_spent INT NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_perk_redemption UNIQUE (user_id, perk_id),
    CONSTRAINT fk_perk_redemption_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_perk_redemption_perk FOREIGN KEY (perk_id) REFERENCES perks(id) ON DELETE CASCADE,
    INDEX idx_perk_redemptions_user (user_id),
    INDEX idx_perk_redemptions_perk (perk_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Table: points
-- Granular ledger of all earned FitPoints and transactions
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS points;
CREATE TABLE points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL COMMENT 'Points amount (positive for earned, negative for redeemed)',
    reason VARCHAR(255) NOT NULL COMMENT 'e.g. "Logged 35m Running", "Day 5 Streak Bonus", "Redeemed Sports Pass"',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_points_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Table: streaks
-- Tracks daily student workout consistency and habit preservation
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS streaks;
CREATE TABLE streaks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_activity_date DATE NULL,
    freeze_shields_available INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_streak_user UNIQUE (user_id),
    CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_streaks_current (current_streak DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Table: notifications
-- In-app alert system for streak alerts, challenge progress, and AI suggestions
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    notification_type ENUM('streak_alert', 'challenge_update', 'badge_unlocked', 'ai_suggestion', 'system') DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
