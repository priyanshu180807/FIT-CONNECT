import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  getToken, setToken, clearToken,
  apiLogin, apiRegister, apiGetMe,
  apiUpdateProfile, apiLogActivity, apiGetActivities,
  apiGetDashboard, apiGetRecommendations,
  apiGetChallenges, apiJoinChallenge, apiLeaveChallenge, apiCreateChallenge,
  apiGetStudentLeaderboard, apiGetDepartmentLeaderboard, apiGetHostelLeaderboard,
  apiGetChallengeLeaderboard, apiGetRewardsOverview, apiGetBadges, apiGetPerks,
  apiRedeemPerk,
} from '../api';

const FitnessContext = createContext();

// MET values for real-time front-end calorie preview (mirrors backend)
const MET_TABLE = {
  Walking: 3.5, Running: 9.0, Cycling: 7.5, Gym: 6.0,
  Yoga: 3.2, Cricket: 5.2, Football: 8.5, Basketball: 8.0,
  Badminton: 5.8, Other: 4.5,
};

const DEPARTMENT_CODES = {
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication': 'ECE',
  'Mechanical Engineering': 'MECH',
  'Civil Engineering': 'CIVIL',
  'Biotechnology & Life Sciences': 'BIOTECH',
  'School of Management': 'MBA',
  'Electrical Engineering': 'EE',
};

const mapChallenge = (challenge) => ({
  id: challenge.id,
  title: challenge.title,
  description: challenge.description,
  category: challenge.challenge_type[0].toUpperCase() + challenge.challenge_type.slice(1),
  metric: challenge.metric_type,
  targetValue: Number(challenge.target_value),
  target: `${Number(challenge.target_value).toLocaleString()} ${challenge.metric_type}`,
  currentValue: Number(challenge.current_value || 0),
  duration: challenge.duration,
  participants: challenge.participants_count,
  pointsReward: challenge.points,
  badgeReward: challenge.badge_reward || 'Challenge completion',
  isJoined: challenge.is_joined,
  isCompleted: challenge.user_completed,
  userContribution: Number(challenge.user_contribution || 0),
  departmentStandings: challenge.department_standings || [],
});

// ─── Provider ───────────────────────────────────────────────────────────────
export function FitnessProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Profile from backend (or defaults before login)
  const [profile, setProfile] = useState({
    name: '', email: '', college: '', department: '', year: '',
    age: 20, height: 175, weight: 68, hostel: '',
    fitnessLevel: 'Intermediate',
    fitnessGoal: 'Beat Sedentary Routine & Build Stamina',
    fitnessInterests: ['Cardio & Stamina', 'Sports & Agility', 'Relieve Study Stress'],
    preferredActivities: ['Running', 'Gym', 'Badminton', 'Walking'],
    availableDays: [1, 2, 3, 4, 5, 6],
    dailyAvailableTime: '45 mins',
    dailyCalorieTarget: 500,
    dailyActiveMinutesTarget: 45,
    isLoggedIn: false,
    role: 'student',
  });

  // Activities from backend
  const [activities, setActivities] = useState([]);
  // Dashboard data from backend
  const [dashboardData, setDashboardData] = useState(null);
  // Recommendations from backend
  const [recommendations, setRecommendations] = useState(null);

  // Challenges, leaderboards, and rewards are all loaded from the backend.
  const [challenges, setChallenges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [perks, setPerks] = useState([]);
  const [leaderboards, setLeaderboards] = useState({
    individual: [], department: [], hostel: [], challenge: [],
  });
  const [rewardsOverview, setRewardsOverview] = useState(null);

  // Points and streak come from the backend; local fallback until loaded
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  const loadChallenges = useCallback(async () => {
    try {
      const response = await apiGetChallenges();
      setChallenges(response.map(mapChallenge));
    } catch {
      setChallenges([]);
    }
  }, []);

  const loadLeaderboards = useCallback(async () => {
    try {
      const [students, departments, hostels] = await Promise.all([
        apiGetStudentLeaderboard(), apiGetDepartmentLeaderboard(), apiGetHostelLeaderboard(),
      ]);
      setLeaderboards({
        individual: students.map(student => ({
          rank: student.rank,
          userId: student.user_id,
          name: student.name,
          dept: DEPARTMENT_CODES[student.department] || student.department,
          year: student.year,
          points: student.points,
          streak: student.streak,
          workouts: student.workouts || 0,
          avatar: student.avatar,
          isCurrentUser: student.is_current_user,
        })),
        department: departments.map(department => ({
          rank: department.rank,
          name: department.department_name,
          code: department.department_code,
          points: department.points,
          activeStudents: department.active_students,
          studentCount: department.student_count,
          avgCalories: department.avg_calories,
          topPerformer: department.top_performer,
          isCurrentDepartment: department.department_name === profile.department,
        })),
        hostel: hostels,
        challenge: [],
      });
    } catch {
      setLeaderboards({ individual: [], department: [], hostel: [], challenge: [] });
    }
  }, [profile.department]);

  const loadChallengeLeaderboard = useCallback(async (challengeId) => {
    if (!challengeId) {
      setLeaderboards(prev => ({ ...prev, challenge: [] }));
      return;
    }
    try {
      const result = await apiGetChallengeLeaderboard(challengeId);
      setLeaderboards(prev => ({ ...prev, challenge: result.participants }));
    } catch {
      setLeaderboards(prev => ({ ...prev, challenge: [] }));
    }
  }, []);

  const loadRewards = useCallback(async () => {
    try {
      const overview = await apiGetRewardsOverview();
      const [badgeRows, perkRows] = await Promise.all([apiGetBadges(), apiGetPerks()]);
      setRewardsOverview(overview);
      setPoints(overview.total_points || 0);
      setStreak(overview.current_streak || 0);
      setBadges(badgeRows.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        requirement: badge.requirement,
        points: badge.points,
        category: badge.category,
        icon: badge.icon_name,
        unlocked: badge.is_unlocked,
        unlockedAt: badge.earned_at ? badge.earned_at.slice(0, 10) : null,
      })));
      setPerks(perkRows.map(perk => ({ ...perk, isRedeemed: perk.is_redeemed })));
    } catch {
      setRewardsOverview(null);
      setBadges([]);
      setPerks([]);
    }
  }, []);

  const loadGamingData = useCallback(async () => {
    await Promise.all([loadChallenges(), loadLeaderboards(), loadRewards()]);
  }, [loadChallenges, loadLeaderboards, loadRewards]);

  // ─── Auto-login if token exists ──────────────────────────────────────────
  const loadUserFromToken = useCallback(async () => {
    try {
      const me = await apiGetMe();
      applyUserData(me);
      await loadGamingData();
      setCurrentPage('dashboard');
    } catch {
      clearToken();
    }
  }, [loadGamingData]);

  useEffect(() => {
    if (getToken()) loadUserFromToken();
  }, [loadUserFromToken]);

  function applyUserData(me) {
    const p = me.profile || {};
    setProfile(prev => ({
      ...prev,
      name: me.name,
      email: me.email,
      college: me.college,
      department: me.department,
      year: me.year,
      hostel: me.hostel || '',
      role: me.role,
      age: p.age || prev.age,
      height: p.height || prev.height,
      weight: p.weight || prev.weight,
      fitnessLevel: p.fitness_level || prev.fitnessLevel,
      fitnessGoal: p.fitness_goal || prev.fitnessGoal,
      preferredActivities: p.preferred_activities || prev.preferredActivities,
      availableDays: p.available_days || prev.availableDays,
      dailyAvailableTime: p.daily_available_minutes ? `${p.daily_available_minutes} mins` : prev.dailyAvailableTime,
      dailyCalorieTarget: p.daily_calorie_target || prev.dailyCalorieTarget,
      dailyActiveMinutesTarget: p.daily_active_minutes_target || prev.dailyActiveMinutesTarget,
      isLoggedIn: true,
    }));
    setPoints(me.total_points || 0);
    setStreak(me.current_streak || 0);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  const loginUser = useCallback(async (credentials) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await apiLogin(credentials.email, credentials.password);
      setToken(res.access_token);
      // Load full user data
      const me = await apiGetMe();
      applyUserData(me);
      await loadGamingData();
      setIsLoading(false);
      return { success: true, hasProfile: res.user?.has_profile };
    } catch (err) {
      setAuthError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [loadGamingData]);

  const registerUser = useCallback(async (data) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await apiRegister(data);
      setToken(res.access_token);
      const me = await apiGetMe();
      applyUserData(me);
      await loadGamingData();
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [loadGamingData]);

  const logoutUser = useCallback(() => {
    clearToken();
    setProfile(prev => ({ ...prev, isLoggedIn: false, name: '' }));
    setActivities([]);
    setDashboardData(null);
    setRecommendations(null);
    setPoints(0);
    setStreak(0);
    setCurrentPage('landing');
  }, []);

  // ─── Profile Update (save to backend) ────────────────────────────────────
  const updateProfile = useCallback(async (updatedFields) => {
    // Build backend payload
    const payload = {};
    if (updatedFields.age !== undefined) payload.age = Number(updatedFields.age);
    if (updatedFields.height !== undefined) payload.height = Number(updatedFields.height);
    if (updatedFields.weight !== undefined) payload.weight = Number(updatedFields.weight);
    if (updatedFields.fitnessLevel !== undefined) payload.fitness_level = updatedFields.fitnessLevel;
    if (updatedFields.fitnessGoal !== undefined) payload.fitness_goal = updatedFields.fitnessGoal;
    if (updatedFields.preferredActivities !== undefined) payload.preferred_activities = updatedFields.preferredActivities;
    if (updatedFields.availableDays !== undefined) payload.available_days = updatedFields.availableDays;
    if (updatedFields.dailyActiveMinutesTarget !== undefined) payload.daily_available_minutes = updatedFields.dailyActiveMinutesTarget;
    if (updatedFields.hostel !== undefined) payload.hostel = updatedFields.hostel;

    try {
      await apiUpdateProfile(payload);
      // Refresh profile locally
      setProfile(prev => ({ ...prev, ...updatedFields }));
    } catch {
      // Still update local state as fallback
      setProfile(prev => ({ ...prev, ...updatedFields }));
    }
  }, []);

  // ─── Activity Logging ────────────────────────────────────────────────────
  const addActivity = useCallback(async (data) => {
    const duration = Number(data.duration) || 30;
    const distance = data.distance ? Number(data.distance) : null;
    const result = await apiLogActivity({
      activity_type: data.type,
      duration_minutes: duration,
      distance: distance,
      intensity: data.intensity || 'Moderate',
      activity_date: data.date || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
    });

    // Convert backend response to frontend shape
    const newActivity = {
      id: result.id,
      type: result.activity_type,
      duration: result.duration_minutes,
      distance: result.distance,
      date: result.activity_date,
      intensity: result.intensity,
      calories: result.calories,
      notes: result.notes,
      pointsEarned: result.points_earned,
    };

    setActivities(prev => [newActivity, ...prev]);
    try {
      const me = await apiGetMe();
      setPoints(me.total_points || 0);
      setStreak(me.current_streak || 0);
    } catch {
      setPoints(prev => prev + result.points_earned);
    }
    try {
      setRewardsOverview(await apiGetRewardsOverview());
    } catch {}

    // Trigger confetti
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    return newActivity;
  }, []);

  // ─── Load Activities from Backend ─────────────────────────────────────────
  const loadActivities = useCallback(async (filterType = 'All') => {
    try {
      const raw = await apiGetActivities({ limit: 50, activity_type: filterType });
      const mapped = raw.map(a => ({
        id: a.id,
        type: a.activity_type,
        duration: a.duration_minutes,
        distance: a.distance,
        date: a.activity_date,
        intensity: a.intensity,
        calories: a.calories,
        notes: a.notes,
        pointsEarned: a.points_earned,
      }));
      setActivities(mapped);
    } catch {}
  }, []);

  // ─── Load Dashboard Data ──────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      const [dash, recs] = await Promise.all([
        apiGetDashboard(),
        apiGetRecommendations(),
      ]);
      setDashboardData(dash);
      setRecommendations(recs);

      // Sync points & streak from backend
      setPoints(dash.points || 0);
      setStreak(dash.streak || 0);

      // Sync profile targets
      if (dash.today) {
        setProfile(prev => ({
          ...prev,
          dailyCalorieTarget: dash.today.calorie_target || prev.dailyCalorieTarget,
          dailyActiveMinutesTarget: dash.today.minute_target || prev.dailyActiveMinutesTarget,
        }));
      }
    } catch {}
  }, []);

  // ─── Scientific MET Calorie Calculator (for live previews) ────────────────
  const calculateCalories = (type, durationMins, intensity = 'Moderate', userWeight = profile.weight || 68) => {
    const baseMet = MET_TABLE[type] || 4.5;
    let multiplier = 1.0;
    if (intensity === 'Low') multiplier = 0.85;
    if (intensity === 'High') multiplier = 1.25;
    const met = baseMet * multiplier;
    const calculated = (met * 3.5 * userWeight / 200) * durationMins;
    return Math.round(calculated);
  };

  // ─── Tier Calculation ─────────────────────────────────────────────────────
  const getUserTier = (pts) => {
    if (pts >= 3000) return { name: 'Diamond', next: null, target: 3000, progress: 100, color: 'var(--accent-cyan)' };
    if (pts >= 2000) return { name: 'Platinum', next: 'Diamond', target: 3000, progress: Math.round(((pts - 2000) / 1000) * 100), color: '#c084fc' };
    if (pts >= 1200) return { name: 'Gold', next: 'Platinum', target: 2000, progress: Math.round(((pts - 1200) / 800) * 100), color: 'var(--accent-amber)' };
    if (pts >= 600) return { name: 'Silver', next: 'Gold', target: 1200, progress: Math.round(((pts - 600) / 600) * 100), color: '#94a3b8' };
    return { name: 'Bronze', next: 'Silver', target: 600, progress: Math.round((Math.max(0, pts) / 600) * 100), color: '#d97706' };
  };

  // ─── Today's Stats (computed from dashboard data) ────────────────────────
  const todayCalories = dashboardData?.today?.calories || 0;
  const todayActiveMinutes = dashboardData?.today?.minutes || 0;
  const todayActivities = (dashboardData?.today?.activities || []).map(a => ({
    id: a.id, type: a.type, duration: a.duration,
    distance: a.distance, intensity: a.intensity,
    calories: a.calories, notes: a.notes,
    pointsEarned: a.points_earned,
  }));

  // Weekly stats
  const weeklyCalories = dashboardData?.weekly_chart?.reduce((s, d) => s + (d.calories || 0), 0) || 0;
  const weeklyMinutes = dashboardData?.weekly_chart?.reduce((s, d) => s + (d.minutes || 0), 0) || 0;

  const toggleJoinChallenge = async (challengeId) => {
    const challenge = challenges.find(item => item.id === challengeId);
    if (!challenge) return false;
    try {
      if (challenge.isJoined) await apiLeaveChallenge(challengeId);
      else await apiJoinChallenge(challengeId);
      await loadChallenges();
      return true;
    } catch {
      return false;
    }
  };

  const createChallenge = async (challengeData) => {
    try {
      await apiCreateChallenge(challengeData);
      await loadChallenges();
      return true;
    } catch {
      return false;
    }
  };

  const redeemPerk = async (perkId) => {
    try {
      await apiRedeemPerk(perkId);
      await loadRewards();
      try { confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } }); } catch {}
      return true;
    } catch {
      return false;
    }
  };

  return (
    <FitnessContext.Provider
      value={{
        currentPage, setCurrentPage,
        isLoading, authError,
        profile, updateProfile,
        activities, addActivity, loadActivities,
        calculateCalories,
        challenges, loadChallenges, toggleJoinChallenge, createChallenge,
        badges, perks, redeemPerk,
        streak, setStreak, points,
        getUserTier, rewardsOverview, loadRewards,
        todayCalories, todayActiveMinutes, todayActivities,
        weeklyCalories, weeklyMinutes,
        dashboardData, loadDashboard,
        recommendations, 
        leaderboards, loadLeaderboards, loadChallengeLeaderboard,
        loginUser, registerUser, logoutUser,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
}
