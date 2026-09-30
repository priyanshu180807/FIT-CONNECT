import React, { useEffect, useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Target, 
  Users, 
  Clock, 
  Trophy, 
  Flame, 
  Zap, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Swords,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ChallengesPage() {
  const { challenges, loadChallenges, toggleJoinChallenge, createChallenge, profile } = useFitness();
  const [activeTab, setActiveTab] = useState('All');
  const [challengeError, setChallengeError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => {
    const now = new Date();
    return {
      title: '', description: '', challenge_type: 'campus', metric_type: 'mins',
      target_value: '500', points: '100', badge_reward: '',
      start_date: now.toISOString().slice(0, 16),
      end_date: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16),
    };
  });

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const filteredChallenges = challenges.filter(ch => {
    if (activeTab === 'All') return true;
    return ch.category.toLowerCase() === activeTab.toLowerCase();
  });

  const handleToggle = async (chId, currentlyJoined) => {
    setChallengeError('');
    const updated = await toggleJoinChallenge(chId);
    if (!updated) {
      setChallengeError('Could not update challenge membership. Please try again.');
    } else if (!currentlyJoined) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}
    }
  };

  const handleCreateChallenge = async (event) => {
    event.preventDefault();
    setChallengeError('');
    setCreating(true);
    const created = await createChallenge({ ...form, target_value: Number(form.target_value), points: Number(form.points) });
    setCreating(false);
    if (created) {
      setForm(current => ({ ...current, title: '', description: '', badge_reward: '' }));
    } else {
      setChallengeError('Challenge creation failed. Confirm you are signed in as an administrator.');
    }
  };

  const featuredChallenge = challenges.find(
    challenge => challenge.category === 'Department' && challenge.departmentStandings.length
  ) || challenges.find(challenge => challenge.category === 'Department');
  const standings = featuredChallenge?.departmentStandings || [];
  const leftTeam = standings[0];
  const rightTeam = standings[1];
  const teamTotal = standings.reduce((sum, team) => sum + team.progress, 0);
  const leftShare = teamTotal ? (leftTeam?.progress / teamTotal) * 100 : 0;
  const rightShare = teamTotal ? (rightTeam?.progress / teamTotal) * 100 : 0;
  const formatMetric = (value, metric) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${metric}`;
  const deptCode = department => ({
    'Computer Science & Engineering': 'CSE',
    'Electronics & Communication': 'ECE',
    'Mechanical Engineering': 'MECH',
    'Civil Engineering': 'CIVIL',
    'Biotechnology & Life Sciences': 'BIOTECH',
    'School of Management': 'MBA',
  }[department] || department?.slice(0, 4).toUpperCase() || '—');

  return (
    <div className="challenges-page">
      {/* Page Header */}
      <div className="challenges-header">
        <div>
          <span className="chip chip-violet mb-1">Campus Movements & Battles</span>
          <h1 className="page-title">Fitness Challenges & Quests</h1>
          <p className="page-sub">
            Compete for your branch, rally hostel dorms, and conquer solo fitness habits to unlock badges and points.
          </p>
        </div>
      </div>

      {/* Featured Department Clash Hero Banner */}
      {featuredChallenge && (
      <div className="dept-clash-hero glass-card">
        <div className="clash-badge-strip">
          <div className="clash-icon-box">
            <Swords size={20} className="text-amber" />
          </div>
          <span className="clash-tag">Department Competition · {featuredChallenge.title}</span>
        </div>

        <div className="clash-grid">
          <div className="clash-dept-box dept-left">
            <span className="dept-code">{deptCode(leftTeam?.department)}</span>
            <span className="dept-name">{leftTeam?.department || 'Awaiting participants'}</span>
            <span className="dept-score text-emerald">{formatMetric(leftTeam?.progress, featuredChallenge.metric)}</span>
            <span className="dept-status">{leftTeam ? 'Current leader' : 'No activity yet'}</span>
          </div>

          <div className="clash-vs-box">
            <span className="vs-badge">VS</span>
            <span className="clash-target-label">Target: {featuredChallenge.target}</span>
          </div>

          <div className="clash-dept-box dept-right">
            <span className="dept-code">{deptCode(rightTeam?.department)}</span>
            <span className="dept-name">{rightTeam?.department || 'Awaiting participants'}</span>
            <span className="dept-score text-cyan">{formatMetric(rightTeam?.progress, featuredChallenge.metric)}</span>
            <span className="dept-status">{rightTeam ? `Rank #${rightTeam.rank}` : 'No activity yet'}</span>
          </div>
        </div>

        <div className="clash-progress-row">
          <div className="clash-bar-wrapper">
            <div className="clash-bar-fill-cse" style={{ width: `${leftShare}%` }} title={`${leftTeam?.department || 'Team 1'}: ${Math.round(leftShare)}%`} />
            <div className="clash-bar-fill-ece" style={{ width: `${rightShare}%` }} title={`${rightTeam?.department || 'Team 2'}: ${Math.round(rightShare)}%`} />
          </div>
          <div className="clash-stats-meta">
            <span>👥 {featuredChallenge.participants} joined</span>
            <span>⚡ +{featuredChallenge.pointsReward} FitPoints on completion</span>
            <span>⏱️ {featuredChallenge.duration}</span>
          </div>
        </div>
      </div>
      )}

      {profile.role === 'admin' && (
        <form className="glass-card challenge-create-form" onSubmit={handleCreateChallenge}>
          <h2 className="section-title-sm">Create a campus challenge</h2>
          <div className="challenge-form-grid">
            <input required aria-label="Challenge title" placeholder="Challenge title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select aria-label="Challenge type" value={form.challenge_type} onChange={e => setForm({ ...form, challenge_type: e.target.value })}>
              <option value="campus">Campus-wide</option><option value="department">Department competition</option><option value="individual">Individual</option>
            </select>
            <input required min="1" type="number" aria-label="Target" placeholder="Target" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
            <select aria-label="Progress metric" value={form.metric_type} onChange={e => setForm({ ...form, metric_type: e.target.value })}>
              <option value="mins">Active minutes</option><option value="km">Kilometers</option><option value="kcal">Calories</option><option value="sessions">Sessions</option>
            </select>
            <input required min="1" type="number" aria-label="FitPoints reward" placeholder="FitPoints reward" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} />
            <input aria-label="Badge reward" placeholder="Badge reward (optional)" value={form.badge_reward} onChange={e => setForm({ ...form, badge_reward: e.target.value })} />
            <label>Starts <input required type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></label>
            <label>Ends <input required type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></label>
          </div>
          <textarea required aria-label="Challenge description" placeholder="Describe the challenge" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create challenge'}</button>
        </form>
      )}

      {challengeError && <p role="alert" className="challenge-error">{challengeError}</p>}

      {/* Filter Tabs */}
      <div className="challenge-filter-tabs">
        {['All', 'Department', 'Campus', 'Individual'].map((tab) => (
          <button
            key={tab}
            className={`ch-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'All' ? `All Challenges (${challenges.length})` : `${tab} Quests`}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      <div className="challenges-cards-grid">
        {filteredChallenges.map((ch) => {
          const progressPercent = ch.targetValue > 0 ? Math.min(100, Math.round((ch.currentValue / ch.targetValue) * 100)) : 0;
          const challengeEnded = ch.duration === 'Ended';
          return (
            <div key={ch.id} className="challenge-item-card glass-card">
              <div className="ch-card-top">
                <span className={`chip chip-${ch.category === 'Department' ? 'cyan' : ch.category === 'Campus' ? 'violet' : 'amber'}`}>
                  {ch.category} Quest
                </span>
                <span className="ch-time-pill">
                  <Clock size={13} />
                  <span>{ch.duration}</span>
                </span>
              </div>

              <h3 className="ch-card-title">{ch.title}</h3>
              <p className="ch-card-desc">{ch.description}</p>

              {/* Target & Progress Meters */}
              <div className="ch-meter-container">
                <div className="ch-meter-header">
                  <span className="meter-label">Progress</span>
                  <span className="meter-val">{formatMetric(ch.currentValue, ch.metric)} / {ch.target} ({progressPercent}%)</span>
                </div>
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${ch.category === 'Department' ? 'progress-cyan' : ch.category === 'Campus' ? 'progress-violet' : 'progress-amber'}`}
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>

              <p className="ch-user-progress">Your contribution: {formatMetric(ch.userContribution, ch.metric)}{ch.isCompleted ? ' · Completed' : ''}</p>

              {/* Extra Info Pills */}
              <div className="ch-card-meta-strip">
                <div className="ch-meta-col">
                  <Users size={15} className="text-muted" />
                  <span>{ch.participants} joined</span>
                </div>
                <div className="ch-meta-col">
                  <Zap size={15} className="text-cyan" />
                  <span>+{ch.pointsReward} pts</span>
                </div>
                <div className="ch-meta-col">
                  <Trophy size={15} className="text-amber" />
                  <span>{ch.badgeReward}</span>
                </div>
              </div>

              {/* Join / Active Status Button */}
              <div className="ch-card-actions">
                <button
                  onClick={() => handleToggle(ch.id, ch.isJoined)}
                  disabled={ch.isCompleted || (challengeEnded && !ch.isJoined)}
                  className={`btn w-full ${ch.isJoined ? 'btn-secondary btn-joined' : 'btn-primary'}`}
                >
                  {ch.isJoined ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>{ch.isCompleted ? 'Challenge completed' : challengeEnded ? 'Challenge ended' : 'Joined • Active Contributor'}</span>
                    </>
                  ) : (
                    <>
                      <Target size={16} />
                      <span>{challengeEnded ? 'Challenge ended' : 'Join Challenge (+Rewards)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {filteredChallenges.length === 0 && <p className="empty-challenges">No active challenges in this category yet.</p>}
      </div>

      <style>{`
        .challenges-page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .challenge-create-form { padding: 1.5rem; display: grid; gap: 1rem; }
        .challenge-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
        .challenge-create-form input, .challenge-create-form select, .challenge-create-form textarea {
          min-width: 0; width: 100%; padding: 0.7rem; color: var(--text-main);
          background: rgba(14, 21, 38, 0.9); border: 1px solid var(--border-subtle); border-radius: 8px;
        }
        .challenge-create-form label { color: var(--text-muted); font-size: 0.8rem; }
        .challenge-create-form textarea { min-height: 80px; resize: vertical; }
        .challenge-error { color: #fca5a5; }
        .ch-user-progress { color: var(--text-muted); font-size: 0.8rem; margin: 0.25rem 0 0.75rem; }
        .empty-challenges { color: var(--text-muted); grid-column: 1 / -1; }
        @media (max-width: 600px) { .challenge-form-grid { grid-template-columns: 1fr; } }

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

        /* Dept Clash Hero Banner */
        .dept-clash-hero {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(14, 21, 38, 0.95) 100%);
          border: 1px solid var(--border-glow);
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .clash-badge-strip {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }

        .clash-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--accent-amber-dim);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clash-tag {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-amber);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .clash-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 650px) {
          .clash-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }

        .clash-dept-box {
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.25);
          padding: 1.25rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .dept-code {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 900;
          color: #ffffff;
        }

        .dept-name {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .dept-score {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
        }

        .dept-status {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-dim);
        }

        .clash-vs-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }

        .vs-badge {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--accent-amber);
          background: rgba(245, 158, 11, 0.15);
          padding: 0.25rem 0.65rem;
          border-radius: 8px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .clash-target-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        .clash-bar-wrapper {
          display: flex;
          height: 10px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .clash-bar-fill-cse {
          background: linear-gradient(90deg, #10b981, #34d399);
          transition: width 0.5s ease;
        }

        .clash-bar-fill-ece {
          background: linear-gradient(90deg, #06b6d4, #38bdf8);
          transition: width 0.5s ease;
        }

        .clash-stats-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        /* Filter Tabs */
        .challenge-filter-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .ch-tab-btn {
          padding: 0.55rem 1.15rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ch-tab-btn.active {
          background: var(--accent-emerald-dim);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald-light);
        }

        /* Cards Grid */
        .challenges-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .challenges-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .challenge-item-card {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
        }

        .ch-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .ch-time-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
        }

        .ch-card-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.4rem;
        }

        .ch-card-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1.25rem;
          flex: 1;
        }

        .ch-meter-container {
          background: rgba(0, 0, 0, 0.25);
          padding: 0.85rem 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
        }

        .ch-meter-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .meter-label { color: var(--text-muted); }
        .meter-val { color: #ffffff; }

        .ch-card-meta-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0 1.25rem 0;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .ch-meta-col {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .btn-joined {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.35);
          color: var(--accent-emerald-light);
        }
      `}</style>
    </div>
  );
}
