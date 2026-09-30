import React, { useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Target, 
  Activity, 
  ArrowRight, 
  Clock, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Award,
  ChevronRight,
  Shield,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const { 
    profile, 
    todayCalories, 
    todayActiveMinutes, 
    todayActivities, 
    weeklyCalories, 
    weeklyMinutes, 
    streak, 
    points, 
    challenges, 
    badges, 
    leaderboards, 
    setCurrentPage,
    getUserTier,
    loadDashboard,
    dashboardData,
    recommendations
  } = useFitness();

  // Load real dashboard data from backend on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  const tier = getUserTier(points);

  // Targets from profile or default
  const calorieTarget = profile.dailyCalorieTarget || 500;
  const minuteTarget = profile.dailyActiveMinutesTarget || 45;

  const caloriePercent = Math.min(100, Math.round((todayCalories / calorieTarget) * 100));
  const minutePercent = Math.min(100, Math.round((todayActiveMinutes / minuteTarget) * 100));

  // Current active challenge
  const activeChallenge = challenges.find(c => c.isJoined) || challenges[0];

  // AI Recommended workout — prefer backend recommendations, fall back to local logic
  const getAiRecommendation = () => {
    if (recommendations && recommendations.recommendations && recommendations.recommendations.length > 0) {
      const rec = recommendations.recommendations[0];
      return {
        title: rec.title || 'AI Personalized Workout',
        activity: rec.activity_type || 'Badminton / Campus Run',
        duration: `${rec.suggested_duration_minutes || 30} mins`,
        reason: rec.rationale || `Calibrated for ${profile.department}: A personalized activity to help meet your daily target.`,
        caloriesEst: rec.estimated_calories || 240,
        type: rec.activity_type || 'Running',
      };
    }
    // Local fallback
    if (todayActiveMinutes >= minuteTarget) {
      return {
        title: 'Goal Crushed! Focus on Posture & Recovery',
        activity: 'Yoga',
        duration: '15 mins',
        reason: 'You hit your daily active minutes. Do a gentle recovery stretch to relieve lower back and neck tension from library desk sitting.',
        caloriesEst: 65,
        type: 'Yoga'
      };
    }
    return {
      title: 'Beat 4-Hour Coding & Lecture Sedentary Block',
      activity: 'Badminton / Campus Run',
      duration: '30 mins',
      reason: `Calibrated for ${profile.department}: High sedentary study detected. A 30-minute badminton or campus run will complete today's ${calorieTarget} kcal target.`,
      caloriesEst: 240,
      type: 'Running'
    };
  };

  const aiRec = getAiRecommendation();

  // Weekly mini-chart data — use backend data if available
  const weekDays = dashboardData?.weekly_chart?.length > 0
    ? dashboardData.weekly_chart.map((d, i) => ({
        day: d.day || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        cal: d.calories || 0,
        active: d.minutes || 0,
        isToday: d.is_today || false,
      }))
    : [
        { day: 'Mon', cal: 420, active: 40 },
        { day: 'Tue', cal: 360, active: 35 },
        { day: 'Wed', cal: 490, active: 45 },
        { day: 'Thu', cal: 280, active: 30 },
        { day: 'Fri', cal: 520, active: 55 },
        { day: 'Sat', cal: 610, active: 60 },
        { day: 'Sun (Today)', cal: todayCalories || 330, active: todayActiveMinutes || 35, isToday: true }
      ];

  return (
    <div className="dashboard-page">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="dashboard-welcome-banner glass-card">
        <div className="welcome-text-col">
          <div className="welcome-tag">
            <span className="live-dot" />
            <span>Campus Athlete Hub • {profile.department}</span>
          </div>
          <h1 className="welcome-title">
            Hello, {profile.name}! 👋
          </h1>
          <p className="welcome-sub">
            {todayActiveMinutes > 0 
              ? `Great movement today! You have logged ${todayActiveMinutes} active minutes and burned ${todayCalories} kcal.`
              : 'Ready to beat sedentary study habits? Log your first activity today to maintain your 6-day streak!'}
          </p>
        </div>

        <div className="welcome-actions">
          <button 
            onClick={() => setCurrentPage('activities')} 
            className="btn btn-primary btn-lg"
          >
            <Plus size={18} />
            <span>Log Workout</span>
          </button>
          <button 
            onClick={() => setCurrentPage('challenges')} 
            className="btn btn-secondary btn-lg"
          >
            <Target size={18} className="text-cyan" />
            <span>Challenges</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Hero Cards */}
      <div className="grid-4 stats-hero-grid">
        {/* Streak Card */}
        <div className="glass-card stat-hero-card" onClick={() => setCurrentPage('rewards')}>
          <div className="stat-hero-top">
            <span className="stat-hero-label">Current Streak</span>
            <div className="icon-wrapper bg-amber">
              <Flame size={20} className="streak-pulse text-amber" />
            </div>
          </div>
          <div className="stat-hero-main">
            <span className="stat-hero-value text-amber">{streak}</span>
            <span className="stat-hero-unit">Days Active</span>
          </div>
          <div className="stat-hero-footer text-emerald">
            <TrendingUp size={14} />
            <span>On track for 7-Day Flame Badge!</span>
          </div>
        </div>

        {/* FitPoints Card */}
        <div className="glass-card stat-hero-card" onClick={() => setCurrentPage('rewards')}>
          <div className="stat-hero-top">
            <span className="stat-hero-label">FitPoints Balance</span>
            <div className="icon-wrapper bg-cyan">
              <Zap size={20} className="text-cyan" />
            </div>
          </div>
          <div className="stat-hero-main">
            <span className="stat-hero-value text-cyan">{points.toLocaleString()}</span>
            <span className="stat-hero-unit">pts</span>
          </div>
          <div className="stat-hero-footer" style={{ color: tier.color }}>
            <span>Tier: {tier.name}</span>
          </div>
        </div>

        {/* Today's Calories Burned */}
        <div className="glass-card stat-hero-card" onClick={() => setCurrentPage('activities')}>
          <div className="stat-hero-top">
            <span className="stat-hero-label">Calories Burned</span>
            <div className="icon-wrapper bg-rose">
              <Activity size={20} className="text-rose" />
            </div>
          </div>
          <div className="stat-hero-main">
            <span className="stat-hero-value">{todayCalories}</span>
            <span className="stat-hero-unit">/ {calorieTarget} kcal</span>
          </div>
          <div className="progress-track mt-2">
            <div className="progress-fill progress-emerald" style={{ width: `${caloriePercent}%` }} />
          </div>
        </div>

        {/* Leaderboard Position */}
        <div className="glass-card stat-hero-card" onClick={() => setCurrentPage('leaderboard')}>
          <div className="stat-hero-top">
            <span className="stat-hero-label">Campus Standing</span>
            <div className="icon-wrapper bg-violet">
              <Trophy size={20} className="text-violet" />
            </div>
          </div>
          <div className="stat-hero-main">
            <span className="stat-hero-value text-violet">#3</span>
            <span className="stat-hero-unit">College • #1 in CSE</span>
          </div>
          <div className="stat-hero-footer text-cyan">
            <span>+180 pts to reach Rank #2</span>
          </div>
        </div>
      </div>

      {/* Main Content Columns */}
      <div className="dashboard-columns-grid">
        {/* Left Column: Today's Target Ring & AI Recommendation */}
        <div className="dash-col-left">
          {/* Today's Goal Ring & Progress */}
          <div className="glass-card mb-4">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Today's Fitness Targets</h3>
                <p className="card-subtitle">Daily calibrated movement goals</p>
              </div>
              <button 
                onClick={() => setCurrentPage('profile')} 
                className="btn btn-secondary btn-sm"
              >
                Adjust Goals
              </button>
            </div>

            <div className="targets-split-view">
              {/* Calorie Goal Progress */}
              <div className="target-progress-row">
                <div className="target-icon-box bg-emerald">
                  <Activity size={20} className="text-emerald" />
                </div>
                <div className="target-text-col">
                  <div className="target-title-row">
                    <span className="target-name">Active Calories</span>
                    <span className="target-val">{todayCalories} / {calorieTarget} kcal ({caloriePercent}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill progress-emerald" style={{ width: `${caloriePercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Active Minutes Goal */}
              <div className="target-progress-row">
                <div className="target-icon-box bg-cyan">
                  <Clock size={20} className="text-cyan" />
                </div>
                <div className="target-text-col">
                  <div className="target-title-row">
                    <span className="target-name">Active Minutes</span>
                    <span className="target-val">{todayActiveMinutes} / {minuteTarget} mins ({minutePercent}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill progress-cyan" style={{ width: `${minutePercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommended Activity Card */}
          <div className="glass-card ai-recommendation-card mb-4">
            <div className="ai-rec-header">
              <div className="ai-tag">
                <Sparkles size={15} className="text-amber" />
                <span>FitConnect AI Engine</span>
              </div>
              <span className="chip chip-amber">Recommended for Today</span>
            </div>

            <h3 className="ai-rec-title">{aiRec.title}</h3>
            <p className="ai-rec-reason">{aiRec.reason}</p>

            <div className="ai-rec-meta-row">
              <div className="ai-meta-item">
                <span className="meta-lbl">Activity</span>
                <span className="meta-val">{aiRec.activity}</span>
              </div>
              <div className="ai-meta-item">
                <span className="meta-lbl">Duration</span>
                <span className="meta-val">{aiRec.duration}</span>
              </div>
              <div className="ai-meta-item">
                <span className="meta-lbl">Expected Burn</span>
                <span className="meta-val text-emerald">~{aiRec.caloriesEst} kcal</span>
              </div>
            </div>

            <button 
              onClick={() => setCurrentPage('activities')} 
              className="btn btn-amber btn-lg w-full mt-3"
            >
              <span>Quick Log {aiRec.activity}</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Weekly Progress Bar Chart */}
          <div className="glass-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Weekly Movement Consistency</h3>
                <p className="card-subtitle">Last 7 days calorie & active time summary</p>
              </div>
              <button 
                onClick={() => setCurrentPage('analytics')} 
                className="btn btn-secondary btn-sm"
              >
                Full Analytics
              </button>
            </div>

            <div className="weekly-bars-container">
              {weekDays.map((wd) => {
                const heightPercent = Math.min(100, Math.round((wd.cal / 650) * 100));
                return (
                  <div key={wd.day} className={`weekly-bar-col ${wd.isToday ? 'is-today' : ''}`}>
                    <span className="bar-val-tooltip">{wd.cal} kcal</span>
                    <div className="bar-track">
                      <div 
                        className={`bar-fill ${wd.isToday ? 'bar-fill-today' : ''}`} 
                        style={{ height: `${heightPercent}%` }} 
                      />
                    </div>
                    <span className="bar-day-label">{wd.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Challenge & Recent Workouts */}
        <div className="dash-col-right">
          {/* Active Campus Challenge Card */}
          <div className="glass-card mb-4" onClick={() => setCurrentPage('challenges')}>
            <div className="card-header-flex">
              <div>
                <span className="chip chip-violet mb-1">{activeChallenge.category} Challenge</span>
                <h3 className="card-title">{activeChallenge.title}</h3>
              </div>
              <ChevronRight size={20} className="text-muted" />
            </div>

            <p className="challenge-card-desc">{activeChallenge.description}</p>

            <div className="challenge-progress-box">
              <div className="ch-prog-row">
                <span className="ch-lbl">Department Progress</span>
                <span className="ch-num">{activeChallenge.currentValue} / {activeChallenge.target}</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill progress-violet" 
                  style={{ width: `${Math.round((activeChallenge.currentValue / activeChallenge.targetValue) * 100)}%` }} 
                />
              </div>
              <div className="ch-meta-row">
                <span>⏱️ {activeChallenge.duration}</span>
                <span>👥 {activeChallenge.participants} Students</span>
                <span className="text-amber">⚡ +{activeChallenge.pointsReward} pts</span>
              </div>
            </div>
          </div>

          {/* Badges Preview Card */}
          <div className="glass-card mb-4">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Unlocked Badges ({badges.filter(b => b.unlocked).length}/{badges.length})</h3>
                <p className="card-subtitle">Campus achievements & milestones</p>
              </div>
              <button 
                onClick={() => setCurrentPage('rewards')} 
                className="btn btn-secondary btn-sm"
              >
                All Badges
              </button>
            </div>

            <div className="badges-preview-grid">
              {badges.slice(0, 4).map((badge) => (
                <div 
                  key={badge.id} 
                  className={`badge-preview-tile ${badge.unlocked ? 'badge-unlocked' : 'badge-locked'}`}
                  title={`${badge.name}: ${badge.description}`}
                >
                  <div className="badge-emoji-box">
                    {badge.icon === 'Flame' && '🔥'}
                    {badge.icon === 'Zap' && '⚡'}
                    {badge.icon === 'Award' && '🎖️'}
                    {badge.icon === 'Footprints' && '👟'}
                    {badge.icon === 'TrendingUp' && '🚀'}
                    {badge.icon === 'Compass' && '🧘'}
                    {badge.icon === 'Shield' && '🛡️'}
                    {badge.icon === 'Target' && '🎯'}
                  </div>
                  <span className="badge-preview-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Activity Log */}
          <div className="glass-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Today's Logged Workouts</h3>
                <p className="card-subtitle">{todayActivities.length} session(s) recorded</p>
              </div>
              <button 
                onClick={() => setCurrentPage('activities')} 
                className="btn btn-secondary btn-sm"
              >
                View History
              </button>
            </div>

            {todayActivities.length === 0 ? (
              <div className="empty-activities-placeholder">
                <Activity size={32} className="text-muted mb-2" />
                <p className="empty-text">No workouts logged yet today.</p>
                <button 
                  onClick={() => setCurrentPage('activities')} 
                  className="btn btn-outline-emerald btn-sm mt-2"
                >
                  Log Now (+Points)
                </button>
              </div>
            ) : (
              <div className="today-activities-list">
                {todayActivities.map((act) => (
                  <div key={act.id} className="today-activity-item">
                    <div className="act-icon-box bg-emerald">
                      <Activity size={18} className="text-emerald" />
                    </div>
                    <div className="act-details">
                      <span className="act-name">{act.type}</span>
                      <span className="act-sub">{act.duration} mins {act.distance ? `• ${act.distance} km` : ''} • {act.intensity} intensity</span>
                    </div>
                    <div className="act-stats-col">
                      <span className="act-kcal">{act.calories} kcal</span>
                      <span className="act-pts">+{act.pointsEarned} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .dashboard-welcome-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.25rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 21, 38, 0.85) 100%);
          border: 1px solid var(--border-glow);
          border-radius: var(--radius-lg);
          gap: 1.5rem;
        }

        @media (max-width: 800px) {
          .dashboard-welcome-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .welcome-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-emerald-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-emerald);
          box-shadow: 0 0 8px var(--accent-emerald);
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.35rem;
        }

        .welcome-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
          max-width: 600px;
        }

        .welcome-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* 4 Stat Hero Cards */
        .stat-hero-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.25rem;
        }

        .stat-hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-hero-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-amber { background: var(--accent-amber-dim); }
        .bg-cyan { background: var(--accent-cyan-dim); }
        .bg-rose { background: var(--accent-rose-dim); }
        .bg-violet { background: var(--accent-violet-dim); }
        .bg-emerald { background: var(--accent-emerald-dim); }

        .stat-hero-main {
          display: flex;
          align-items: baseline;
          gap: 0.45rem;
        }

        .stat-hero-value {
          font-family: var(--font-heading);
          font-size: 1.9rem;
          font-weight: 800;
          line-height: 1;
        }

        .stat-hero-unit {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stat-hero-footer {
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        /* Dashboard Columns */
        .dashboard-columns-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 1.5rem;
        }

        @media (max-width: 950px) {
          .dashboard-columns-grid {
            grid-template-columns: 1fr;
          }
        }

        .card-header-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }

        .card-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .targets-split-view {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .target-progress-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .target-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .target-text-col {
          flex: 1;
        }

        .target-title-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .target-name {
          color: var(--text-main);
        }

        .target-val {
          color: var(--text-muted);
        }

        /* AI Card */
        .ai-recommendation-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(14, 21, 38, 0.95) 100%);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .ai-rec-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }

        .ai-tag {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-amber);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-rec-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .ai-rec-reason {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .ai-rec-meta-row {
          display: flex;
          gap: 1.5rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
        }

        .ai-meta-item {
          display: flex;
          flex-direction: column;
        }

        .meta-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .meta-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
        }

        /* Weekly Bars */
        .weekly-bars-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 160px;
          padding-top: 1rem;
        }

        .weekly-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          height: 100%;
          gap: 0.4rem;
        }

        .bar-val-tooltip {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-dim);
        }

        .is-today .bar-val-tooltip {
          color: var(--accent-emerald-light);
        }

        .bar-track {
          flex: 1;
          width: 22px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .bar-fill {
          width: 100%;
          background: rgba(16, 185, 129, 0.45);
          border-radius: 6px;
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bar-fill-today {
          background: linear-gradient(180deg, #34d399, #10b981);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .bar-day-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        .is-today .bar-day-label {
          color: var(--accent-emerald-light);
          font-weight: 700;
        }

        /* Challenge Card */
        .challenge-card-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .challenge-progress-box {
          background: rgba(0, 0, 0, 0.25);
          padding: 1rem;
          border-radius: var(--radius-sm);
        }

        .ch-prog-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .ch-meta-row {
          display: flex;
          justify-content: space-between;
          margin-top: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        /* Badges Preview Grid */
        .badges-preview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.65rem;
        }

        .badge-preview-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0.85rem 0.4rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .badge-unlocked {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .badge-emoji-box {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .badge-preview-name {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-main);
        }

        /* Today's Activity List */
        .empty-activities-placeholder {
          text-align: center;
          padding: 2rem 1rem;
        }

        .empty-text {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .today-activities-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .today-activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0.85rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .act-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .act-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .act-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: #ffffff;
        }

        .act-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .act-stats-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .act-kcal {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--accent-emerald-light);
        }

        .act-pts {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent-cyan-light);
        }
      `}</style>
    </div>
  );
}
