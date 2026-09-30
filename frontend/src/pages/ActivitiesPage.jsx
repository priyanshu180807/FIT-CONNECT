import React, { useState, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Activity, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Flame, 
  Zap, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Dumbbell
} from 'lucide-react';

export default function ActivitiesPage() {
  const { activities, addActivity, calculateCalories, profile, loadActivities } = useFitness();

  // Load activities from backend on mount
  useEffect(() => {
    loadActivities();
  }, []);

  const activityOptions = [
    { id: 'Walking', name: 'Walking', icon: '🚶‍♂️', hasDistance: true, defaultDur: 30 },
    { id: 'Running', name: 'Running', icon: '🏃‍♂️', hasDistance: true, defaultDur: 30 },
    { id: 'Cycling', name: 'Cycling', icon: '🚴‍♂️', hasDistance: true, defaultDur: 30 },
    { id: 'Gym', name: 'Gym / Strength', icon: '🏋️‍♂️', hasDistance: false, defaultDur: 45 },
    { id: 'Yoga', name: 'Yoga / Stretching', icon: '🧘‍♂️', hasDistance: false, defaultDur: 25 },
    { id: 'Cricket', name: 'Cricket', icon: '🏏', hasDistance: false, defaultDur: 60 },
    { id: 'Football', name: 'Football', icon: '⚽', hasDistance: true, defaultDur: 45 },
    { id: 'Basketball', name: 'Basketball', icon: '🏀', hasDistance: false, defaultDur: 40 },
    { id: 'Badminton', name: 'Badminton', icon: '🏸', hasDistance: false, defaultDur: 40 },
    { id: 'Other', name: 'Other Sport / HIIT', icon: '⚡', hasDistance: false, defaultDur: 30 }
  ];

  // Logging Form State
  const [selectedType, setSelectedType] = useState('Running');
  const [duration, setDuration] = useState(30);
  const [distance, setDistance] = useState('4.0');
  const [intensity, setIntensity] = useState('Moderate');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search State
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const currentOption = activityOptions.find(o => o.id === selectedType) || activityOptions[0];

  // Real-time scientific calorie estimation preview
  const estimatedCalories = calculateCalories(selectedType, Number(duration) || 0, intensity);
  const estimatedPoints = Math.round(Number(duration) * 1.0) + (intensity === 'High' ? 15 : 0) + (Number(distance) > 5 ? 20 : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const newAct = await addActivity({
        type: selectedType,
        duration: Number(duration),
        distance: currentOption.hasDistance && distance ? Number(distance) : null,
        intensity,
        date,
        notes
      });
      setSuccessToast(`Logged ${duration} min ${selectedType}! Earned ${newAct.calories} kcal & +${newAct.pointsEarned} pts!`);
      setTimeout(() => setSuccessToast(null), 4000);
      setNotes('');
    } catch {
      setSubmitError('The activity could not be saved. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter activities list
  const filteredActivities = activities.filter((act) => {
    const matchesType = filterType === 'All' || act.type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      act.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.notes && act.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="activities-page">
      {/* Header */}
      <div className="activities-header">
        <div>
          <span className="chip chip-emerald mb-1">MET-Scientific Calorie Engine</span>
          <h1 className="page-title">Activity Logging & Workout Logbook</h1>
          <p className="page-sub">
            Record campus runs, gym lifts, badminton matches, and study-break walks to earn FitPoints.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="success-notification-bar">
          <CheckCircle2 size={18} className="text-white" />
          <span>{successToast}</span>
        </div>
      )}
      {submitError && <div className="success-notification-bar" role="alert">{submitError}</div>}

      {/* Main Grid: Form on Left, History on Right */}
      <div className="activities-layout-grid">
        {/* Left Column: Fast Activity Logger Form */}
        <div className="log-form-container">
          <div className="glass-card logger-card">
            <div className="logger-card-header">
              <h2 className="logger-title">
                <Plus size={20} className="text-emerald" />
                <span>Log New Fitness Activity</span>
              </h2>
              <span className="live-pill">Live Calorie MET</span>
            </div>

            <form onSubmit={handleSubmit} className="logger-form">
              {/* Activity Type Picker Grid */}
              <div className="form-group">
                <label className="form-label">Select Activity / Sport</label>
                <div className="activity-type-grid">
                  {activityOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`act-type-btn ${selectedType === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedType(opt.id);
                        setDuration(opt.defaultDur);
                        if (!opt.hasDistance) setDistance('');
                        else if (!distance) setDistance('3.0');
                      }}
                    >
                      <span className="act-emoji">{opt.icon}</span>
                      <span className="act-name-txt">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Distance Row */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <div className="input-suffix-wrapper">
                    <Clock size={16} className="input-icon" />
                    <input
                      type="number"
                      min="5"
                      max="300"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="form-input"
                    />
                    <span className="input-suffix">mins</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Distance {currentOption.hasDistance ? '(Optional)' : '(N/A for sport)'}
                  </label>
                  <div className="input-suffix-wrapper">
                    <MapPin size={16} className="input-icon" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={!currentOption.hasDistance}
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder={currentOption.hasDistance ? "e.g. 5.2" : "Stationary"}
                      className="form-input"
                    />
                    <span className="input-suffix">km</span>
                  </div>
                </div>
              </div>

              {/* Intensity & Date */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Exercise Intensity</label>
                  <div className="intensity-selector-row">
                    {['Low', 'Moderate', 'High'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`intensity-btn ${intensity === lvl ? `active-${lvl.toLowerCase()}` : ''}`}
                        onClick={() => setIntensity(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Activity</label>
                  <div className="input-suffix-wrapper">
                    <Calendar size={16} className="input-icon" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="form-group">
                <label className="form-label">Campus Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Morning loop around student lake with CSE batchmates..."
                  className="form-textarea"
                />
              </div>

              {/* Live Preview Calorie & Points Box */}
              <div className="met-calc-preview-card">
                <div className="calc-preview-item">
                  <Flame size={20} className="text-amber" />
                  <div className="calc-col">
                    <span className="calc-lbl">MET Estimated Energy</span>
                    <span className="calc-val text-amber">~{estimatedCalories} kcal</span>
                  </div>
                </div>
                <div className="calc-divider" />
                <div className="calc-preview-item">
                  <Zap size={20} className="text-cyan" />
                  <div className="calc-col">
                    <span className="calc-lbl">FitPoints Earned</span>
                    <span className="calc-val text-cyan">+{estimatedPoints} pts</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
                <Plus size={18} />
                <span>Save Workout & Update Streak</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Activities History & Filters */}
        <div className="history-container">
          <div className="glass-card history-card">
            {/* Filter and Search Bar */}
            <div className="history-toolbar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search workouts or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-select-box">
                <Filter size={16} className="filter-icon" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Sports ({activities.length})</option>
                  <option value="Running">Running</option>
                  <option value="Gym">Gym</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Walking">Walking</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                </select>
              </div>
            </div>

            {/* Activities List */}
            <div className="activities-list">
              {filteredActivities.length === 0 ? (
                <div className="empty-history-state">
                  <Activity size={40} className="text-muted mb-2" />
                  <p className="empty-title">No matching workouts found</p>
                  <p className="empty-sub">Try changing your filters or log a fresh activity on the left!</p>
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const iconObj = activityOptions.find(o => o.id.toLowerCase() === act.type.toLowerCase()) || { icon: '⚡' };
                  return (
                    <div key={act.id} className="activity-card-row">
                      <div className="activity-badge-icon">
                        <span className="act-row-emoji">{iconObj.icon}</span>
                      </div>

                      <div className="activity-body-col">
                        <div className="activity-title-line">
                          <span className="act-main-title">{act.type}</span>
                          <span className={`chip chip-${act.intensity === 'High' ? 'rose' : act.intensity === 'Moderate' ? 'amber' : 'emerald'}`}>
                            {act.intensity}
                          </span>
                        </div>

                        <div className="activity-specs-line">
                          <span>⏱️ {act.duration} mins</span>
                          {act.distance && <span>📍 {act.distance} km</span>}
                          <span>📅 {act.date}</span>
                        </div>

                        {act.notes && (
                          <p className="activity-notes-text">"{act.notes}"</p>
                        )}
                      </div>

                      <div className="activity-reward-col">
                        <div className="reward-kcal">
                          <Flame size={14} className="text-amber" />
                          <span>{act.calories} kcal</span>
                        </div>
                        <div className="reward-pts">
                          <Zap size={13} className="text-cyan" />
                          <span>+{act.pointsEarned} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .activities-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .activities-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .success-notification-bar {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.85rem 1.25rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .activities-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 1.5rem;
        }

        @media (max-width: 950px) {
          .activities-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .logger-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .logger-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
          font-weight: 800;
          color: #ffffff;
        }

        .live-pill {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-emerald-light);
          background: var(--accent-emerald-dim);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .activity-type-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }

        @media (max-width: 550px) {
          .activity-type-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .act-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.65rem 0.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .act-type-btn.active {
          background: var(--accent-emerald-dim);
          border-color: var(--accent-emerald);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
        }

        .act-emoji {
          font-size: 1.35rem;
          margin-bottom: 0.2rem;
        }

        .act-name-txt {
          font-size: 0.7rem;
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .input-suffix-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--text-dim);
          pointer-events: none;
        }

        .input-suffix-wrapper .form-input {
          padding-left: 2.5rem;
          padding-right: 3rem;
        }

        .input-suffix {
          position: absolute;
          right: 0.85rem;
          font-size: 0.8rem;
          color: var(--text-dim);
          font-weight: 600;
          pointer-events: none;
        }

        .intensity-selector-row {
          display: flex;
          gap: 0.4rem;
        }

        .intensity-btn {
          flex: 1;
          padding: 0.75rem 0.25rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .active-low {
          background: var(--accent-emerald-dim);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald-light);
        }

        .active-moderate {
          background: var(--accent-amber-dim);
          border-color: var(--accent-amber);
          color: var(--accent-amber);
        }

        .active-high {
          background: var(--accent-rose-dim);
          border-color: var(--accent-rose);
          color: #fb7185;
        }

        .met-calc-preview-card {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: rgba(0, 0, 0, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
          padding: 0.85rem 1rem;
          margin-top: 0.5rem;
        }

        .calc-preview-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .calc-col {
          display: flex;
          flex-direction: column;
        }

        .calc-lbl {
          font-size: 0.7rem;
          color: var(--text-dim);
          text-transform: uppercase;
          font-weight: 600;
        }

        .calc-val {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 800;
        }

        .calc-divider {
          width: 1px;
          height: 30px;
          background: var(--border-subtle);
        }

        /* History Toolbar */
        .history-toolbar {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .search-box {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--text-dim);
        }

        .search-input {
          width: 100%;
          padding: 0.65rem 0.85rem 0.65rem 2.4rem;
          background: rgba(14, 21, 38, 0.9);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          font-size: 0.875rem;
          outline: none;
        }

        .filter-select-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--text-dim);
          pointer-events: none;
        }

        .filter-select {
          padding: 0.65rem 1rem 0.65rem 2.4rem;
          background: rgba(14, 21, 38, 0.9);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          font-size: 0.875rem;
          outline: none;
        }

        /* Activities History List */
        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          max-height: 620px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .activity-card-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 1rem 1.15rem;
          transition: transform 0.2s, border-color 0.2s;
        }

        .activity-card-row:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
        }

        .activity-badge-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .act-row-emoji {
          font-size: 1.5rem;
        }

        .activity-body-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .activity-title-line {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .act-main-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
        }

        .activity-specs-line {
          display: flex;
          gap: 0.85rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .activity-notes-text {
          font-size: 0.8rem;
          color: var(--text-dim);
          font-style: italic;
          margin-top: 0.2rem;
        }

        .activity-reward-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
        }

        .reward-kcal {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--accent-amber);
        }

        .reward-pts {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-cyan-light);
        }

        .empty-history-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
        }

        .empty-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
