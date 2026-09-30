import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  Flame, 
  Clock, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function AnalyticsPage() {
  const { activities, todayCalories, todayActiveMinutes, profile } = useFitness();
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' or 'monthly'

  // Weekly dataset (last 7 days)
  const weeklyData = [
    { day: 'Mon', calories: 420, minutes: 40 },
    { day: 'Tue', calories: 360, minutes: 35 },
    { day: 'Wed', calories: 490, minutes: 45 },
    { day: 'Thu', calories: 280, minutes: 30 },
    { day: 'Fri', calories: 520, minutes: 55 },
    { day: 'Sat', calories: 610, minutes: 60 },
    { day: 'Sun (Today)', calories: todayCalories || 330, minutes: todayActiveMinutes || 35, isToday: true }
  ];

  // Monthly dataset (last 4 weeks)
  const monthlyData = [
    { week: 'Week 1', calories: 2850, minutes: 270, avgStreak: 5 },
    { week: 'Week 2', calories: 3120, minutes: 295, avgStreak: 6 },
    { week: 'Week 3', calories: 2940, minutes: 280, avgStreak: 6 },
    { week: 'Week 4 (Current)', calories: 3450, minutes: 310, avgStreak: 6 }
  ];

  // Activity distribution by sport
  const sportDistribution = [
    { name: 'Running', percent: 34, calories: 1240, color: '#10b981', icon: '🏃‍♂️' },
    { name: 'Gym / Strength', percent: 28, calories: 1020, color: '#06b6d4', icon: '🏋️‍♂️' },
    { name: 'Badminton', percent: 20, calories: 730, color: '#f59e0b', icon: '🏸' },
    { name: 'Cycling', percent: 11, calories: 410, color: '#8b5cf6', icon: '🚴‍♂️' },
    { name: 'Yoga / Flexibility', percent: 7, calories: 260, color: '#fb7185', icon: '🧘‍♂️' }
  ];

  // 30-Day Activity Heatmap Matrix
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    // Simulate consistent workout pattern
    const isRest = dayNum === 4 || dayNum === 11 || dayNum === 18 || dayNum === 25;
    const isHigh = dayNum === 7 || dayNum === 14 || dayNum === 21 || dayNum === 28 || dayNum === 30;
    return {
      day: dayNum,
      level: isRest ? 0 : isHigh ? 3 : 2, // 0 = rest, 2 = moderate, 3 = high
      label: `Sept ${dayNum}`
    };
  });

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <span className="chip chip-cyan mb-1">Student Health Intelligence</span>
          <h1 className="page-title">Personal Fitness Analytics</h1>
          <p className="page-sub">
            Visualize movement trends, energy expenditure, workout distribution, and habit consistency over time.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="timeframe-toggle">
          <button
            className={`tf-btn ${timeframe === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly View (7 Days)
          </button>
          <button
            className={`tf-btn ${timeframe === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly View (4 Weeks)
          </button>
        </div>
      </div>

      {/* 4 Summary Performance Metric Cards */}
      <div className="grid-4 analytics-stat-strip">
        <div className="glass-card stat-tile">
          <span className="tile-label">Goal Completion Rate</span>
          <div className="tile-main">
            <span className="tile-value text-emerald">88%</span>
            <span className="tile-badge-up">+6% vs last week</span>
          </div>
          <p className="tile-sub">Target met 6 out of 7 days</p>
        </div>

        <div className="glass-card stat-tile">
          <span className="tile-label">Total Energy Burned</span>
          <div className="tile-main">
            <span className="tile-value text-amber">3,010</span>
            <span className="tile-unit">kcal</span>
          </div>
          <p className="tile-sub">Avg 430 kcal per day</p>
        </div>

        <div className="glass-card stat-tile">
          <span className="tile-label">Active Exercise Time</span>
          <div className="tile-main">
            <span className="tile-value text-cyan">295</span>
            <span className="tile-unit">mins</span>
          </div>
          <p className="tile-sub">Overcoming 7.5 hrs sedentary study/day</p>
        </div>

        <div className="glass-card stat-tile">
          <span className="tile-label">Campus Consistency Score</span>
          <div className="tile-main">
            <span className="tile-value text-violet">9.4</span>
            <span className="tile-unit">/ 10</span>
          </div>
          <p className="tile-sub">Top 5% in {profile.department}</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Left Column: Weekly or Monthly Activity Bar Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                {timeframe === 'weekly' ? 'Weekly Calorie Expenditure (kcal)' : 'Monthly Progression (Active Minutes & Calories)'}
              </h3>
              <p className="chart-subtitle">
                {timeframe === 'weekly' 
                  ? 'Daily energy output calculated via scientific MET standards'
                  : 'Cumulative active physical minutes across last 4 campus weeks'}
              </p>
            </div>
            <div className="chart-legend">
              <span className="legend-dot bg-emerald" />
              <span className="legend-txt">Active Calories</span>
            </div>
          </div>

          {/* Responsive SVG / CSS Bar Chart */}
          {timeframe === 'weekly' ? (
            <div className="custom-chart-container">
              <div className="chart-y-axis">
                <span>700</span>
                <span>525</span>
                <span>350</span>
                <span>175</span>
                <span>0</span>
              </div>
              <div className="chart-bars-wrap">
                {weeklyData.map((d) => {
                  const heightPercent = Math.min(100, Math.round((d.calories / 700) * 100));
                  return (
                    <div key={d.day} className={`chart-bar-column ${d.isToday ? 'chart-bar-today' : ''}`}>
                      <div className="bar-hover-pop">{d.calories} kcal • {d.minutes}m</div>
                      <div className="bar-slot">
                        <div 
                          className="bar-graphic" 
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="chart-x-label">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="custom-chart-container">
              <div className="chart-y-axis">
                <span>4000</span>
                <span>3000</span>
                <span>2000</span>
                <span>1000</span>
                <span>0</span>
              </div>
              <div className="chart-bars-wrap">
                {monthlyData.map((m) => {
                  const heightPercent = Math.min(100, Math.round((m.calories / 4000) * 100));
                  return (
                    <div key={m.week} className="chart-bar-column">
                      <div className="bar-hover-pop">{m.calories} kcal • {m.minutes} mins</div>
                      <div className="bar-slot">
                        <div 
                          className="bar-graphic" 
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="chart-x-label">{m.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Activity Breakdown Distribution */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Activity Breakdown</h3>
              <p className="chart-subtitle">Energy distribution by sport type</p>
            </div>
          </div>

          <div className="distribution-list">
            {sportDistribution.map((item) => (
              <div key={item.name} className="dist-item-row">
                <div className="dist-left">
                  <span className="dist-icon">{item.icon}</span>
                  <div className="dist-name-col">
                    <span className="dist-name">{item.name}</span>
                    <span className="dist-cal">{item.calories} kcal burned</span>
                  </div>
                </div>

                <div className="dist-bar-col">
                  <div className="dist-track">
                    <div 
                      className="dist-fill" 
                      style={{ width: `${item.percent}%`, background: item.color }} 
                    />
                  </div>
                  <span className="dist-percent font-bold" style={{ color: item.color }}>
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="sedentary-comparison-box mt-3">
            <span className="sedentary-label">Campus Sedentary Balance</span>
            <div className="sedentary-multi-bar">
              <div className="sed-seg sed-study" style={{ width: '45%' }} title="Study & Sitting (45%)" />
              <div className="sed-seg sed-sleep" style={{ width: '30%' }} title="Sleep & Rest (30%)" />
              <div className="sed-seg sed-active" style={{ width: '15%' }} title="Exercise / Sports (15%)" />
              <div className="sed-seg sed-walk" style={{ width: '10%' }} title="Campus Walk (10%)" />
            </div>
            <div className="sed-legend-row">
              <span>💻 Study: 8.5h</span>
              <span>🏃‍♂️ Exercise: 1.5h</span>
              <span>🚶 Campus Move: 1.0h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Activity Heatmap Grid */}
      <div className="glass-card heatmap-section-card">
        <div className="heatmap-header">
          <div>
            <h3 className="chart-title">
              <Calendar size={18} className="text-amber" />
              <span>30-Day Workout Consistency Heatmap</span>
            </h3>
            <p className="chart-subtitle">Every active workout day builds long-term student endurance.</p>
          </div>
          <div className="heatmap-intensity-scale">
            <span className="scale-txt">Less</span>
            <div className="heat-box lvl-0" />
            <div className="heat-box lvl-2" />
            <div className="heat-box lvl-3" />
            <span className="scale-txt">More</span>
          </div>
        </div>

        <div className="heatmap-calendar-grid">
          {heatmapDays.map((d) => (
            <div 
              key={d.day} 
              className={`heatmap-cell lvl-${d.level}`}
              title={`${d.label}: ${d.level === 0 ? 'Rest Day' : d.level === 2 ? 'Active Workout Session' : 'High Intensity Peak Session'}`}
            >
              <span className="heat-day-num">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .analytics-page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .page-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .timeframe-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 0.3rem;
          border-radius: var(--radius-sm);
        }

        .tf-btn {
          padding: 0.55rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tf-btn.active {
          background: var(--accent-cyan);
          color: #080c16;
          font-weight: 700;
        }

        /* Stat Strip */
        .analytics-stat-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 950px) {
          .analytics-stat-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .analytics-stat-strip {
            grid-template-columns: 1fr;
          }
        }

        .stat-tile {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 1.25rem;
        }

        .tile-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .tile-main {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }

        .tile-value {
          font-family: var(--font-heading);
          font-size: 1.9rem;
          font-weight: 900;
          line-height: 1;
        }

        .tile-unit {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .tile-badge-up {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-emerald-light);
          background: var(--accent-emerald-dim);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }

        .tile-sub {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        /* Charts Grid */
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.95fr;
          gap: 1.5rem;
        }

        @media (max-width: 950px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .chart-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .chart-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-txt {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Chart Visual Container */
        .custom-chart-container {
          display: flex;
          height: 220px;
          align-items: flex-end;
          gap: 1rem;
          padding-top: 1.5rem;
        }

        .chart-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          font-size: 0.7rem;
          color: var(--text-dim);
          font-weight: 600;
          padding-bottom: 24px;
        }

        .chart-bars-wrap {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 100%;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 24px;
        }

        .chart-bar-column {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          height: 100%;
        }

        .bar-slot {
          flex: 1;
          width: 32px;
          display: flex;
          align-items: flex-end;
        }

        @media (max-width: 500px) {
          .bar-slot {
            width: 20px;
          }
        }

        .bar-graphic {
          width: 100%;
          background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
          border-radius: 6px 6px 0 0;
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
        }

        .chart-bar-today .bar-graphic {
          background: linear-gradient(180deg, #38bdf8 0%, #06b6d4 100%);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
        }

        .chart-x-label {
          position: absolute;
          bottom: -22px;
          font-size: 0.725rem;
          color: var(--text-dim);
          font-weight: 600;
          white-space: nowrap;
        }

        .bar-hover-pop {
          position: absolute;
          top: -24px;
          font-size: 0.65rem;
          font-weight: 700;
          background: #000;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          white-space: nowrap;
          color: #fff;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .chart-bar-column:hover .bar-hover-pop {
          opacity: 1;
        }

        /* Distribution */
        .distribution-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dist-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .dist-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 130px;
        }

        .dist-icon {
          font-size: 1.25rem;
        }

        .dist-name-col {
          display: flex;
          flex-direction: column;
        }

        .dist-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
        }

        .dist-cal {
          font-size: 0.725rem;
          color: var(--text-dim);
        }

        .dist-bar-col {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .dist-track {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .dist-fill {
          height: 100%;
          border-radius: var(--radius-full);
        }

        .dist-percent {
          font-size: 0.8rem;
          min-width: 32px;
          text-align: right;
        }

        .sedentary-comparison-box {
          background: rgba(0, 0, 0, 0.25);
          padding: 1rem;
          border-radius: var(--radius-sm);
          margin-top: 1.5rem;
        }

        .sedentary-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.5rem;
        }

        .sedentary-multi-bar {
          display: flex;
          height: 10px;
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 0.6rem;
        }

        .sed-study { background: #f43f5e; }
        .sed-sleep { background: #64748b; }
        .sed-active { background: #10b981; }
        .sed-walk { background: #06b6d4; }

        .sed-legend-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.725rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        /* 30-Day Heatmap */
        .heatmap-section-card {
          padding: 1.75rem;
        }

        .heatmap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .heatmap-intensity-scale {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .scale-txt {
          font-size: 0.7rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        .heat-box {
          width: 14px;
          height: 14px;
          border-radius: 3px;
        }

        .heatmap-calendar-grid {
          display: grid;
          grid-template-columns: repeat(15, 1fr);
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .heatmap-calendar-grid {
            grid-template-columns: repeat(10, 1fr);
          }
        }

        @media (max-width: 480px) {
          .heatmap-calendar-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        .heatmap-cell {
          aspect-ratio: 1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .heatmap-cell:hover {
          transform: scale(1.15);
        }

        .heat-day-num {
          font-size: 0.7rem;
          font-weight: 700;
        }

        .lvl-0 {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-dim);
          border: 1px solid var(--border-subtle);
        }

        .lvl-2 {
          background: rgba(16, 185, 129, 0.35);
          color: #ffffff;
          border: 1px solid rgba(16, 185, 129, 0.5);
        }

        .lvl-3 {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
