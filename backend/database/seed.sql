-- =============================================================================
-- FitConnect — Sample Seed Data for MySQL
-- Smart India Hackathon 2026 Prototype
-- Realistic Campus Dataset for Testing & Evaluation
-- =============================================================================

USE fitconnect_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE notifications;
TRUNCATE TABLE perk_redemptions;
TRUNCATE TABLE perks;
TRUNCATE TABLE streaks;
TRUNCATE TABLE points;
TRUNCATE TABLE user_badges;
TRUNCATE TABLE badges;
TRUNCATE TABLE challenge_participants;
TRUNCATE TABLE challenges;
TRUNCATE TABLE goals;
TRUNCATE TABLE activities;
TRUNCATE TABLE fitness_profiles;
TRUNCATE TABLE users;
TRUNCATE TABLE departments;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Seed: departments
-- -----------------------------------------------------------------------------
INSERT INTO departments (id, college, department_name, department_code) VALUES
(1, 'National Institute of Technology', 'Computer Science & Engineering', 'CSE'),
(2, 'National Institute of Technology', 'Electronics & Communication', 'ECE'),
(3, 'National Institute of Technology', 'Mechanical Engineering', 'MECH'),
(4, 'National Institute of Technology', 'Civil Engineering', 'CIVIL'),
(5, 'National Institute of Technology', 'Biotechnology & Life Sciences', 'BIOTECH'),
(6, 'National Institute of Technology', 'School of Management', 'MBA');

-- -----------------------------------------------------------------------------
-- 2. Seed: users
-- Development fixture credential hashes; do not use these accounts in production.
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, college, department, hostel, year, role, created_at) VALUES
(1, 'Aarav Sharma', 'aarav.cse@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Computer Science & Engineering', 'Hostel Block 4', '3rd Year', 'student', '2026-09-01 10:00:00'),
(2, 'Priya Patel', 'priya.ece@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Electronics & Communication', 'Hostel Block 2', '4th Year', 'student', '2026-09-01 10:30:00'),
(3, 'Vikram Singh', 'vikram.mech@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Mechanical Engineering', 'Hostel Block 4', '3rd Year', 'student', '2026-09-02 11:00:00'),
(4, 'Ananya Roy', 'ananya.biotech@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Biotechnology & Life Sciences', 'Hostel Block 1', '2nd Year', 'student', '2026-09-02 14:00:00'),
(5, 'Rohan Gupta', 'rohan.cse@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Computer Science & Engineering', 'Hostel Block 2', '1st Year', 'student', '2026-09-03 09:00:00'),
(6, 'Meera Nair', 'meera.civil@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Civil Engineering', 'Hostel Block 1', '3rd Year', 'student', '2026-09-03 16:00:00'),
(7, 'Devendra K.', 'devendra.ece@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Electronics & Communication', 'Hostel Block 3', '2nd Year', 'student', '2026-09-04 12:00:00'),
(8, 'Tanvi Joshi', 'tanvi.mba@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'School of Management', 'Hostel Block 3', '1st Year', 'student', '2026-09-04 15:00:00'),
(9, 'Dr. Rajesh Sharma (Dean)', 'sports.dean@campus.edu', '$2b$12$3C8sYgQ7YjsYPjwE/EL0G.dqabTgQ4s37sTgo6ktUWJaUIe5UgYCm', 'National Institute of Technology', 'Campus Administration', NULL, 'Staff', 'admin', '2026-08-15 08:00:00');

INSERT INTO perks (title, category, description, cost, is_active) VALUES
('Sports Complex Priority Pass', 'Campus Facilities', 'Priority booking access to campus sports facilities.', 500, 1),
('Healthy Smoothie Voucher', 'Nutrition', 'A voucher for a healthy drink at the campus canteen.', 800, 1),
('Certificate of Fitness', 'Recognition', 'A digital certificate recognizing your fitness progress.', 1200, 1),
('Gym Equipment Locker Access', 'Campus Facilities', 'Access to a dedicated campus sports equipment locker.', 1500, 1);

-- -----------------------------------------------------------------------------
-- 3. Seed: fitness_profiles
-- -----------------------------------------------------------------------------
INSERT INTO fitness_profiles (id, user_id, age, height, weight, fitness_level, fitness_goal, preferred_activities, available_days, daily_available_minutes, daily_calorie_target, daily_active_minutes_target) VALUES
(1, 1, 20, 175.00, 68.00, 'Intermediate', 'Beat Sedentary Routine & Build Stamina', '["Running", "Gym", "Badminton", "Walking"]', '[1, 2, 3, 4, 5, 6]', 45, 500, 45),
(2, 2, 21, 163.00, 54.00, 'Advanced', 'Prepare for Inter-College Sports Meet', '["Running", "Cycling", "Football", "Yoga"]', '[1, 2, 3, 4, 5, 6, 7]', 60, 600, 60),
(3, 3, 20, 180.00, 78.00, 'Advanced', 'Muscle Building & Strength Conditioning', '["Gym", "Basketball", "Running"]', '[1, 2, 3, 4, 5]', 60, 650, 60),
(4, 4, 19, 160.00, 52.00, 'Intermediate', 'Relieve Study Stress & Academic Burnout', '["Yoga", "Walking", "Badminton"]', '[1, 2, 3, 4, 6]', 30, 400, 35),
(5, 5, 18, 172.00, 64.00, 'Beginner', 'Beat Sedentary Routine & Build Stamina', '["Cycling", "Walking", "Cricket"]', '[1, 3, 5, 6]', 30, 350, 30),
(6, 6, 20, 166.00, 58.00, 'Intermediate', 'Weight Loss & Active Calorie Deficit', '["Badminton", "Gym", "Running"]', '[2, 3, 4, 5, 6]', 45, 450, 45);

-- -----------------------------------------------------------------------------
-- 4. Seed: activities
-- Realistic logged workouts for testing aggregation and queries
-- -----------------------------------------------------------------------------
INSERT INTO activities (id, user_id, activity_type, duration_minutes, distance, intensity, calories, activity_date, notes, created_at) VALUES
(1, 1, 'Running', 35, 5.20, 'High', 330, '2026-09-28', 'Morning perimeter campus run before Data Structures class', '2026-09-28 07:15:00'),
(2, 1, 'Badminton', 45, NULL, 'Moderate', 290, '2026-09-27', 'Evening doubles match at Hostel 4 court with batchmates', '2026-09-27 18:30:00'),
(3, 1, 'Gym', 50, NULL, 'High', 360, '2026-09-26', 'Upper body hypertrophy + core circuit at campus gym', '2026-09-26 17:45:00'),
(4, 1, 'Cycling', 30, 8.40, 'Moderate', 240, '2026-09-25', 'Cycled between academic block and university lake trail', '2026-09-25 16:30:00'),
(5, 1, 'Yoga', 25, NULL, 'Low', 95, '2026-09-24', 'Post-hackathon desk stretch & breathing relaxation', '2026-09-24 21:00:00'),
(6, 1, 'Walking', 40, 3.10, 'Moderate', 160, '2026-09-23', 'Brisk walk around student activity center lake', '2026-09-23 19:15:00'),
(7, 2, 'Running', 45, 7.50, 'High', 460, '2026-09-28', 'Fast tempo track workout with college athletics squad', '2026-09-28 06:45:00'),
(8, 2, 'Cycling', 40, 12.00, 'Moderate', 320, '2026-09-27', 'Weekend campus perimeter exploration', '2026-09-27 08:00:00'),
(9, 3, 'Gym', 60, NULL, 'High', 440, '2026-09-28', 'Heavy squats and deadlift strength session', '2026-09-28 17:00:00'),
(10, 4, 'Yoga', 35, NULL, 'Low', 120, '2026-09-28', 'Dorm study-break stretching and posture relief', '2026-09-28 19:30:00'),
(11, 5, 'Cycling', 35, 9.20, 'Moderate', 250, '2026-09-28', 'Commute from hostel to computer labs', '2026-09-28 08:30:00'),
(12, 6, 'Badminton', 50, NULL, 'Moderate', 310, '2026-09-28', 'Singles practice match at sports complex', '2026-09-28 18:00:00');

-- -----------------------------------------------------------------------------
-- 5. Seed: goals
-- -----------------------------------------------------------------------------
INSERT INTO goals (id, user_id, goal_type, target_value, current_value, start_date, end_date, status) VALUES
(1, 1, 'calories', 500.00, 330.00, '2026-09-28', '2026-09-28', 'active'),
(2, 1, 'active_minutes', 45.00, 35.00, '2026-09-28', '2026-09-28', 'active'),
(3, 1, 'distance', 25.00, 16.70, '2026-09-22', '2026-09-28', 'active'),
(4, 2, 'calories', 600.00, 460.00, '2026-09-28', '2026-09-28', 'active'),
(5, 3, 'workouts', 5.00, 5.00, '2026-09-22', '2026-09-28', 'completed');

-- -----------------------------------------------------------------------------
-- 6. Seed: challenges
-- -----------------------------------------------------------------------------
INSERT INTO challenges (id, title, description, challenge_type, metric_type, target_value, current_value, start_date, end_date, points, badge_reward, is_active) VALUES
(1, 'Inter-Dept Movement Clash: CSE vs ECE', 'Departmental battle! CSE students vs ECE students to reach 500 cumulative active kilometers this week.', 'department', 'km', 500.00, 346.60, '2026-09-24 00:00:00', '2026-10-01 23:59:59', 300, 'Department Titan', 1),
(2, 'Campus 10,000 Active Minutes Quest', 'University-wide mission to beat sedentary exam habits by logging 10,000 combined active exercise minutes.', 'campus', 'mins', 10000.00, 7840.00, '2026-09-20 00:00:00', '2026-10-05 23:59:59', 250, 'Campus Movement Icon', 1),
(3, '7-Day Dorm Study-Stretch Habit', 'Defeat sedentary posture! Complete at least 20 minutes of stretching, yoga, or walking 7 days in a row.', 'individual', 'sessions', 7.00, 6.00, '2026-09-22 00:00:00', '2026-09-29 23:59:59', 150, 'Flame Keeper', 1),
(4, 'Weekend 15km Cycling & Running Derby', 'Cover 15km total cycling or running this coming weekend around the campus perimeter trail.', 'individual', 'km', 15.00, 0.00, '2026-10-03 06:00:00', '2026-10-04 22:00:00', 180, 'Weekend Warrior', 1),
(5, 'Mechanical vs Civil Tug-of-Stamina', 'Mechanical vs Civil engineering branches head-to-head calorie burning challenge.', 'department', 'kcal', 100000.00, 64200.00, '2026-09-25 00:00:00', '2026-10-02 23:59:59', 250, 'Stamina Hero', 1);

-- -----------------------------------------------------------------------------
-- 7. Seed: challenge_participants
-- -----------------------------------------------------------------------------
INSERT INTO challenge_participants (id, challenge_id, user_id, progress, is_completed, completed_at, joined_at) VALUES
(1, 1, 1, 22.40, 0, NULL, '2026-09-24 09:00:00'),
(2, 1, 2, 28.50, 0, NULL, '2026-09-24 10:15:00'),
(3, 1, 5, 14.20, 0, NULL, '2026-09-25 11:30:00'),
(4, 2, 1, 160.00, 0, NULL, '2026-09-20 12:00:00'),
(5, 2, 2, 210.00, 0, NULL, '2026-09-20 12:30:00'),
(6, 2, 3, 180.00, 0, NULL, '2026-09-21 08:00:00'),
(7, 3, 1, 6.00, 0, NULL, '2026-09-22 08:00:00');

-- -----------------------------------------------------------------------------
-- 8. Seed: badges
-- -----------------------------------------------------------------------------
INSERT INTO badges (id, name, description, requirement, points, category, icon_name) VALUES
(1, 'First Step', 'Logged your very first workout on FitConnect', 'Log 1 activity of any sport', 50, 'Milestone', 'Footprints'),
(2, 'Flame Keeper', 'Maintained a 5-day active workout streak', 'Maintain 5-day consecutive activity streak', 150, 'Streak', 'Flame'),
(3, 'Century Burner', 'Burned 300+ kcal in a single workout session', 'Log a workout with >= 300 kcal burned', 100, 'Performance', 'Zap'),
(4, 'Weekend Warrior', 'Crushed physical fitness goals on Saturday & Sunday', 'Log activities on both weekend days', 80, 'Milestone', 'Award'),
(5, 'Campus Sprinter', 'Logged over 25km cumulative running distance', 'Accumulate 25km of total running distance', 120, 'Performance', 'TrendingUp'),
(6, 'Desk Break Zen Master', 'Completed 5 study-break yoga or posture sessions', 'Log 5 yoga or flexibility sessions', 100, 'Wellness', 'Compass'),
(7, 'Department Titan', 'Contributed 500+ points to your department clash', 'Accumulate 500 pts in department challenges', 250, 'Community', 'Shield'),
(8, 'Iron Lungs', 'Log a 10km+ single run or 30km cycling journey', 'Complete a single 10km run or 30km ride', 200, 'Performance', 'Target');

-- -----------------------------------------------------------------------------
-- 9. Seed: user_badges
-- -----------------------------------------------------------------------------
INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES
(1, 1, 1, '2026-09-10 18:30:00'),
(2, 1, 2, '2026-09-26 19:00:00'),
(3, 1, 3, '2026-09-28 07:50:00'),
(4, 1, 4, '2026-09-27 20:00:00'),
(5, 1, 5, '2026-09-28 07:50:00'),
(6, 2, 1, '2026-09-05 08:00:00'),
(7, 2, 2, '2026-09-18 09:00:00'),
(8, 2, 5, '2026-09-25 10:00:00'),
(9, 3, 1, '2026-09-08 17:00:00'),
(10, 3, 3, '2026-09-20 18:00:00');

-- -----------------------------------------------------------------------------
-- 10. Seed: points
-- -----------------------------------------------------------------------------
INSERT INTO points (id, user_id, points, reason, created_at) VALUES
(1, 1, 50, 'Welcome bonus for joining FitConnect', '2026-09-01 10:00:00'),
(2, 1, 50, 'Earned badge: First Step', '2026-09-10 18:30:00'),
(3, 1, 45, 'Logged 35m Running (Morning campus run)', '2026-09-28 07:50:00'),
(4, 1, 40, 'Logged 45m Badminton (Hostel 4 match)', '2026-09-27 19:15:00'),
(5, 1, 50, 'Logged 50m Gym workout session', '2026-09-26 18:35:00'),
(6, 1, 150, 'Earned badge: Flame Keeper (5-Day Streak)', '2026-09-26 19:00:00'),
(7, 1, 100, 'Earned badge: Century Burner', '2026-09-28 07:50:00'),
(8, 1, 120, 'Earned badge: Campus Sprinter', '2026-09-28 07:50:00'),
(9, 1, 80, 'Earned badge: Weekend Warrior', '2026-09-27 20:00:00'),
(10, 1, 735, 'Historical campus workout sessions accumulation', '2026-09-25 12:00:00'),
(11, 2, 2180, 'Cumulative running, cycling and streak points', '2026-09-28 08:00:00'),
(12, 3, 1940, 'Strength workouts and campus league contributor', '2026-09-28 17:30:00');

-- -----------------------------------------------------------------------------
-- 11. Seed: streaks
-- -----------------------------------------------------------------------------
INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_activity_date, freeze_shields_available) VALUES
(1, 1, 6, 14, '2026-09-28', 1),
(2, 2, 19, 19, '2026-09-28', 2),
(3, 3, 14, 14, '2026-09-28', 1),
(4, 4, 8, 10, '2026-09-28', 0),
(5, 5, 11, 11, '2026-09-28', 1),
(6, 6, 5, 7, '2026-09-28', 0),
(7, 7, 7, 9, '2026-09-27', 0),
(8, 8, 4, 6, '2026-09-26', 0);

-- -----------------------------------------------------------------------------
-- 12. Seed: notifications
-- -----------------------------------------------------------------------------
INSERT INTO notifications (id, user_id, title, message, is_read, notification_type, created_at) VALUES
(1, 1, '🔥 6-Day Streak Burning!', 'You are only 1 day away from unlocking your 7-Day Titan Streak Freeze Shield!', 0, 'streak_alert', '2026-09-28 08:00:00'),
(2, 1, '⚔️ CSE Leads Department Clash!', 'Your branch is currently leading ECE by 18.2 km in the 500km Movement Derby.', 0, 'challenge_update', '2026-09-28 09:30:00'),
(3, 1, '🎖️ New Badge Unlocked: Century Burner', 'Congratulations! Burning 330 kcal in your morning run earned you +100 FitPoints.', 1, 'badge_unlocked', '2026-09-28 07:51:00'),
(4, 1, '🧘 AI Sedentary Alert', 'You have been seated for 4.5 hours in lectures. Time for a 5-min dorm desk stretch!', 0, 'ai_suggestion', '2026-09-28 14:00:00');
