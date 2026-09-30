import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  User, 
  Scale, 
  Ruler, 
  Heart, 
  Clock, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Check,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProfileSetupPage() {
  const { profile, updateProfile, setCurrentPage } = useFitness();

  const [age, setAge] = useState(profile.age || 20);
  const [height, setHeight] = useState(profile.height || 175);
  const [weight, setWeight] = useState(profile.weight || 68);
  const [fitnessLevel, setFitnessLevel] = useState(profile.fitnessLevel || 'Intermediate');
  const [fitnessGoal, setFitnessGoal] = useState(profile.fitnessGoal || 'Beat Sedentary Routine & Build Stamina');
  const [dailyTime, setDailyTime] = useState(profile.dailyAvailableTime || '45 mins');
  const [selectedDays, setSelectedDays] = useState(profile.availableDays || [1, 2, 3, 4, 5, 6]);
  const [hostel, setHostel] = useState(profile.hostel || '');

  const interestOptions = [
    'Cardio & Stamina',
    'Sports & Agility',
    'Strength & Hypertrophy',
    'Flexibility & Mobility',
    'Relieve Study Stress',
    'Posture & Desk Relief'
  ];
  const [selectedInterests, setSelectedInterests] = useState(
    profile.fitnessInterests || ['Cardio & Stamina', 'Sports & Agility', 'Relieve Study Stress']
  );

  const activityOptions = [
    { name: 'Running', icon: '🏃‍♂️' },
    { name: 'Gym', icon: '🏋️‍♂️' },
    { name: 'Badminton', icon: '🏸' },
    { name: 'Walking', icon: '🚶‍♂️' },
    { name: 'Cycling', icon: '🚴‍♂️' },
    { name: 'Yoga', icon: '🧘‍♂️' },
    { name: 'Cricket', icon: '🏏' },
    { name: 'Football', icon: '⚽' },
    { name: 'Basketball', icon: '🏀' }
  ];
  const [selectedActivities, setSelectedActivities] = useState(
    profile.preferredActivities || ['Running', 'Gym', 'Badminton', 'Walking']
  );

  // Dynamic BMI Calculation
  const heightMeters = height / 100;
  const bmi = heightMeters > 0 ? (weight / (heightMeters * heightMeters)).toFixed(1) : 22.0;

  const getBmiCategory = (val) => {
    const num = parseFloat(val);
    if (num < 18.5) return { label: 'Underweight', color: 'var(--accent-cyan)' };
    if (num < 25) return { label: 'Normal / Healthy Weight', color: 'var(--accent-emerald)' };
    if (num < 30) return { label: 'Overweight', color: 'var(--accent-amber)' };
    return { label: 'Obese', color: 'var(--accent-rose)' };
  };

  const bmiCat = getBmiCategory(bmi);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleActivity = (activity) => {
    setSelectedActivities(prev => 
      prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]
    );
  };

  const toggleDay = (dayIndex) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      fitnessLevel,
      fitnessGoal,
      dailyAvailableTime: dailyTime,
      availableDays: selectedDays,
      fitnessInterests: selectedInterests,
      preferredActivities: selectedActivities,
      hostel,
      dailyCalorieTarget: fitnessLevel === 'Beginner' ? 350 : fitnessLevel === 'Intermediate' ? 500 : 700,
      dailyActiveMinutesTarget: dailyTime === '15 mins' ? 20 : dailyTime === '30 mins' ? 30 : dailyTime === '45 mins' ? 45 : 60
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setCurrentPage('dashboard');
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-header">
        <span className="chip chip-emerald mb-2">Step 1 of 4 • Student Health Baseline</span>
        <h1 className="profile-title">Personalize Your Fitness Profile</h1>
        <p className="profile-sub">
          Help our adaptive engine calibrate workouts, daily targets, and sedentary study-break alerts.
        </p>
      </div>

      <form onSubmit={handleSave} className="profile-form-grid">
        {/* Left Column: Physical Metrics & BMI */}
        <div className="profile-col-left">
          {/* Card: Body Metrics */}
          <div className="glass-card mb-4">
            <h3 className="card-section-title">
              <Scale size={18} className="text-emerald" />
              <span>Body Metrics & BMI Calibration</span>
            </h3>

            <div className="grid-3 mb-3">
              <div className="form-group">
                <label className="form-label">Age (Years)</label>
                <input
                  type="number"
                  min="16"
                  max="45"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  min="35"
                  max="160"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Dynamic BMI Indicator */}
            <div className="bmi-result-strip">
              <div className="bmi-value-box">
                <span className="bmi-label">Calculated BMI</span>
                <span className="bmi-score" style={{ color: bmiCat.color }}>{bmi}</span>
              </div>
              <div className="bmi-status-box">
                <span className="bmi-cat-badge" style={{ borderColor: bmiCat.color, color: bmiCat.color }}>
                  {bmiCat.label}
                </span>
                <span className="bmi-advice">Optimal baseline for academic endurance</span>
              </div>
            </div>
          </div>

          {/* Card: Fitness Level & Primary Goal */}
          <div className="glass-card mb-4">
            <h3 className="card-section-title">
              <Target size={18} className="text-cyan" />
              <span>Current Level & Primary Goal</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Hostel / Residence (optional)</label>
              <input
                type="text"
                maxLength="100"
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                placeholder="Enter your hostel or residence"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Self-Assessed Fitness Level</label>
              <div className="level-select-row">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`level-btn ${fitnessLevel === lvl ? 'active' : ''}`}
                    onClick={() => setFitnessLevel(lvl)}
                  >
                    <span className="level-name">{lvl}</span>
                    <span className="level-desc">
                      {lvl === 'Beginner' ? '15-20 min light movement' : lvl === 'Intermediate' ? '30-45 min regular workouts' : '60+ min intensive athlete'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Primary Fitness Objective</label>
              <select 
                value={fitnessGoal} 
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="form-select"
              >
                <option value="Beat Sedentary Routine & Build Stamina">Beat Sedentary Routine & Build Stamina</option>
                <option value="Relieve Study Stress & Academic Burnout">Relieve Study Stress & Academic Burnout</option>
                <option value="Weight Loss & Active Calorie Deficit">Weight Loss & Active Calorie Deficit</option>
                <option value="Muscle Building & Strength Conditioning">Muscle Building & Strength Conditioning</option>
                <option value="Prepare for Inter-College Sports Meet">Prepare for Inter-College Sports Meet</option>
              </select>
            </div>
          </div>

          {/* Card: Schedule Availability */}
          <div className="glass-card">
            <h3 className="card-section-title">
              <Clock size={18} className="text-amber" />
              <span>Campus Schedule & Availability</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Available Days for Activity</label>
              <div className="days-picker-row">
                {dayLabels.map((lbl, idx) => {
                  const isSelected = selectedDays.includes(idx);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      className={`day-picker-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleDay(idx)}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Target Daily Active Exercise Time</label>
              <div className="time-select-row">
                {['15 mins', '30 mins', '45 mins', '60+ mins'].map((tm) => (
                  <button
                    key={tm}
                    type="button"
                    className={`time-pill-btn ${dailyTime === tm ? 'active' : ''}`}
                    onClick={() => setDailyTime(tm)}
                  >
                    {tm}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interests & Activities Selection */}
        <div className="profile-col-right">
          {/* Card: Fitness Interests */}
          <div className="glass-card mb-4">
            <h3 className="card-section-title">
              <Sparkles size={18} className="text-violet" />
              <span>Fitness & Wellness Focus Areas</span>
            </h3>
            <p className="card-sub-desc">Select all wellness dimensions you wish to enhance:</p>
            <div className="chips-selector-grid">
              {interestOptions.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`interest-chip-btn ${isSelected ? 'active' : ''}`}
                  >
                    {isSelected && <Check size={14} className="text-emerald" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Preferred Activities / Sports */}
          <div className="glass-card mb-4">
            <h3 className="card-section-title">
              <Heart size={18} className="text-rose" />
              <span>Preferred Activities & Campus Sports</span>
            </h3>
            <p className="card-sub-desc">Pick activities you love to perform on or near campus:</p>
            <div className="sports-picker-grid">
              {activityOptions.map((act) => {
                const isSelected = selectedActivities.includes(act.name);
                return (
                  <button
                    key={act.name}
                    type="button"
                    onClick={() => toggleActivity(act.name)}
                    className={`sport-tile-btn ${isSelected ? 'active' : ''}`}
                  >
                    <span className="sport-tile-emoji">{act.icon}</span>
                    <span className="sport-tile-name">{act.name}</span>
                    {isSelected && <div className="selected-corner-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action Box */}
          <div className="save-action-box glass-card">
            <div className="save-summary-row">
              <div className="save-summary-item">
                <span className="sum-label">Daily Goal</span>
                <span className="sum-val">{fitnessLevel === 'Beginner' ? '350' : '500'} kcal</span>
              </div>
              <div className="sum-divider" />
              <div className="save-summary-item">
                <span className="sum-label">Active Time</span>
                <span className="sum-val">{dailyTime}</span>
              </div>
              <div className="sum-divider" />
              <div className="save-summary-item">
                <span className="sum-label">Commitment</span>
                <span className="sum-val">{selectedDays.length} Days/Wk</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full">
              <span>Save & Launch Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .profile-setup-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1rem 0;
        }

        .profile-header {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 2.5rem auto;
        }

        .profile-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .profile-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .profile-form-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .profile-form-grid {
            grid-template-columns: 1fr;
          }
        }

        .card-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .card-sub-desc {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .bmi-result-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          padding: 1rem 1.25rem;
          border-radius: var(--radius-sm);
        }

        .bmi-value-box {
          display: flex;
          flex-direction: column;
        }

        .bmi-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .bmi-score {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 800;
        }

        .bmi-status-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .bmi-cat-badge {
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .bmi-advice {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        .level-select-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        @media (max-width: 500px) {
          .level-select-row {
            grid-template-columns: 1fr;
          }
        }

        .level-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0.85rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .level-btn.active {
          background: var(--accent-emerald-dim);
          border-color: var(--accent-emerald);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
        }

        .level-name {
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
        }

        .level-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .days-picker-row {
          display: flex;
          gap: 0.4rem;
          justify-content: space-between;
        }

        .day-picker-btn {
          flex: 1;
          padding: 0.6rem 0.2rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .day-picker-btn.active {
          background: var(--accent-amber);
          border-color: var(--accent-amber);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);
        }

        .time-select-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .time-pill-btn {
          padding: 0.6rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-pill-btn.active {
          background: var(--accent-cyan);
          border-color: var(--accent-cyan);
          color: #080c16;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(6, 182, 212, 0.35);
        }

        .chips-selector-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .interest-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-main);
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .interest-chip-btn.active {
          background: var(--accent-violet-dim);
          border-color: var(--accent-violet);
          color: #d8b4fe;
        }

        .sports-picker-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        @media (max-width: 450px) {
          .sports-picker-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .sport-tile-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .sport-tile-btn.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: var(--accent-emerald);
          transform: translateY(-2px);
        }

        .sport-tile-emoji {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .sport-tile-name {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .selected-corner-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-emerald);
          box-shadow: 0 0 6px var(--accent-emerald);
        }

        .save-action-box {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 21, 38, 0.9) 100%);
          border: 1px solid var(--border-glow);
        }

        .save-summary-row {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        .save-summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sum-label {
          font-size: 0.725rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .sum-val {
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffffff;
        }

        .sum-divider {
          width: 1px;
          height: 25px;
          background: var(--border-subtle);
        }

        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1.25rem; }
        .mt-3 { margin-top: 0.75rem; }
        .text-violet { color: var(--accent-violet); }
      `}</style>
    </div>
  );
}
