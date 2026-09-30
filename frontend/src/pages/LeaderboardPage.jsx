import React, { useEffect, useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Crown, 
  Medal, 
  Search, 
  Users, 
  Building2, 
  ArrowUp, 
  ShieldCheck,
  Award,
  Sparkles
} from 'lucide-react';

export default function LeaderboardPage() {
  const { leaderboards, loadLeaderboards, loadChallengeLeaderboard, challenges, loadChallenges } = useFitness();
  const [boardType, setBoardType] = useState('college');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const challengeId = selectedChallengeId || (challenges[0]?.id ? String(challenges[0].id) : '');

  useEffect(() => {
    loadLeaderboards();
    loadChallenges();
  }, [loadLeaderboards, loadChallenges]);

  useEffect(() => {
    if (boardType === 'challenge') loadChallengeLeaderboard(challengeId);
  }, [boardType, challengeId, loadChallengeLeaderboard]);

  const individualList = leaderboards.individual;
  const departmentList = leaderboards.department;

  // Filter individual students
  const filteredStudents = individualList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top 3 for podium
  const top1 = individualList[0];
  const top2 = individualList[1];
  const top3 = individualList[2];

  return (
    <div className="leaderboard-page">
      {/* Page Header */}
      <div className="leaderboard-header">
        <div>
          <span className="chip chip-amber mb-1">Campus Hall of Fame</span>
          <h1 className="page-title">Fitness Leaderboards & Rankings</h1>
          <p className="page-sub">
            Real-time standings celebrating campus consistency, department movement glory, and top student athletes.
          </p>
        </div>
      </div>

      {/* Podium Display for Individual Athletes */}
      {boardType === 'college' && individualList.length >= 3 && (
        <div className="podium-section glass-card">
          <div className="podium-title-bar">
            <Trophy size={18} className="text-amber" />
            <span>Campus Top Student Movers</span>
          </div>

          <div className="podium-grid">
            {/* Rank 2 (Silver) */}
            <div className="podium-col rank-2-col">
              <div className="podium-avatar-box silver-border">
                <span className="podium-avatar">{top2.avatar}</span>
                <span className="podium-rank-badge silver-bg">2</span>
              </div>
              <span className="podium-name">{top2.name}</span>
              <span className="podium-dept">{top2.dept} • {top2.year}</span>
              <span className="podium-pts text-cyan">{top2.points.toLocaleString()} pts</span>
              <div className="podium-pillar pillar-silver">
                <Medal size={22} className="text-silver" />
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="podium-col rank-1-col">
              <Crown size={28} className="text-amber crown-anim" />
              <div className="podium-avatar-box gold-border">
                <span className="podium-avatar">{top1.avatar}</span>
                <span className="podium-rank-badge gold-bg">1</span>
              </div>
              <span className="podium-name font-bold">{top1.name}</span>
              <span className="podium-dept">{top1.dept} • {top1.year}</span>
              <span className="podium-pts text-amber font-extrabold">{top1.points.toLocaleString()} pts</span>
              <div className="podium-pillar pillar-gold">
                <Trophy size={28} className="text-amber" />
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="podium-col rank-3-col">
              <div className="podium-avatar-box bronze-border">
                <span className="podium-avatar">{top3.avatar}</span>
                <span className="podium-rank-badge bronze-bg">3</span>
              </div>
              <span className="podium-name">{top3.name}</span>
              <span className="podium-dept">{top3.dept} • {top3.year}</span>
              <span className="podium-pts text-cyan">{top3.points.toLocaleString()} pts</span>
              <div className="podium-pillar pillar-bronze">
                <Medal size={20} className="text-bronze" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board Selector Tabs */}
      <div className="board-selector-bar">
        <div className="board-tabs-group">
          <button 
            className={`board-tab-btn ${boardType === 'college' ? 'active' : ''}`}
            onClick={() => setBoardType('college')}
          >
            College Ranking
          </button>
          <button 
            className={`board-tab-btn ${boardType === 'department' ? 'active' : ''}`}
            onClick={() => setBoardType('department')}
          >
            Department Ranking
          </button>
          <button 
            className={`board-tab-btn ${boardType === 'hostel' ? 'active' : ''}`}
            onClick={() => setBoardType('hostel')}
          >
            Hostel Ranking
          </button>
          <button className={`board-tab-btn ${boardType === 'challenge' ? 'active' : ''}`} onClick={() => setBoardType('challenge')}>
            Challenge Ranking
          </button>
        </div>

        {boardType === 'college' && (
          <div className="search-pill">
            <Search size={15} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search student or branch..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="board-search-input"
            />
          </div>
        )}
        {boardType === 'challenge' && (
          <select className="board-search-input" aria-label="Select challenge" value={challengeId} onChange={e => setSelectedChallengeId(e.target.value)}>
            <option value="">Select challenge</option>
            {challenges.map(challenge => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}
          </select>
        )}
      </div>

      {/* Individual Leaderboard Table */}
      {boardType === 'college' && (
        <div className="glass-card board-table-card">
          <div className="board-table-header">
            <span className="col-rank">Rank</span>
            <span className="col-athlete">Athlete</span>
            <span className="col-dept">Department</span>
            <span className="col-streak">Streak</span>
            <span className="col-workouts">Workouts</span>
            <span className="col-points">FitPoints</span>
          </div>

          <div className="board-table-body">
            {filteredStudents.map((st) => (
              <div 
                key={st.rank} 
                className={`board-table-row ${st.isCurrentUser ? 'current-user-row' : ''}`}
              >
                <div className="col-rank">
                  <span className={`rank-number-box rank-${st.rank}`}>
                    {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `#${st.rank}`}
                  </span>
                </div>

                <div className="col-athlete">
                  <span className="athlete-avatar">{st.avatar}</span>
                  <div className="athlete-name-col">
                    <span className="athlete-name">
                      {st.name}
                      {st.isCurrentUser && <span className="you-tag">YOU</span>}
                    </span>
                    <span className="athlete-year">{st.year}</span>
                  </div>
                </div>

                <div className="col-dept">
                  <span className="dept-badge">{st.dept}</span>
                </div>

                <div className="col-streak">
                  <span className="streak-badge">
                    <Flame size={14} className="text-amber" />
                    <span>{st.streak}d</span>
                  </span>
                </div>

                <div className="col-workouts">
                  <span>{st.workouts} sessions</span>
                </div>

                <div className="col-points">
                  <span className="points-bold">{st.points.toLocaleString()} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Leaderboard Table */}
      {boardType === 'department' && (
        <div className="glass-card board-table-card">
          <div className="board-table-header">
            <span className="col-rank">Rank</span>
            <span className="col-athlete">Department</span>
            <span className="col-dept">Active (30 days)</span>
            <span className="col-streak">Avg Kcal / Student</span>
            <span className="col-workouts">Top Performer</span>
            <span className="col-points">Cumulative Points</span>
          </div>

          <div className="board-table-body">
            {departmentList.map((dept) => (
              <div key={dept.rank} className={`board-table-row ${dept.isCurrentDepartment ? 'current-dept-row' : ''}`}>
                <div className="col-rank">
                  <span className={`rank-number-box rank-${dept.rank}`}>
                    {dept.rank === 1 ? '🥇' : dept.rank === 2 ? '🥈' : dept.rank === 3 ? '🥉' : `#${dept.rank}`}
                  </span>
                </div>

                <div className="col-athlete">
                  <div className="dept-code-box">{dept.code}</div>
                  <div className="athlete-name-col">
                    <span className="athlete-name">
                      {dept.name}
                      {dept.isCurrentDepartment && <span className="you-tag">YOUR DEPT</span>}
                    </span>
                  </div>
                </div>

                <div className="col-dept">
                  <span className="dept-students-count">👥 {dept.activeStudents} active · {dept.studentCount} total</span>
                </div>

                <div className="col-streak">
                  <span className="text-amber font-semibold">{dept.avgCalories} kcal</span>
                </div>

                <div className="col-workouts">
                  <span className="top-performer-tag">🌟 {dept.topPerformer}</span>
                </div>

                <div className="col-points">
                  <span className="points-bold text-emerald">{dept.points.toLocaleString()} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {boardType === 'hostel' && (
        <div className="glass-card board-table-card">
          <div className="college-blocks-grid">
            {leaderboards.hostel.map(hostel => (
              <div key={hostel.hostel_name} className={`hostel-block-card glass-card ${hostel.is_current_hostel ? 'current-dept-row' : ''}`}>
                <span className="hostel-rank">#{hostel.rank} College Hostel Ranking</span>
                <h3 className="hostel-name">{hostel.hostel_name}</h3>
                <p className="hostel-sub">{hostel.active_residents} active of {hostel.resident_count} residents</p>
                <div className="hostel-stat-row">
                  <span>👥 {hostel.active_residents} Active Residents</span>
                  <span className="text-emerald font-bold">{hostel.points.toLocaleString()} pts</span>
                </div>
                {hostel.is_current_hostel && <span className="you-tag">YOUR HOSTEL</span>}
              </div>
            ))}
            {!leaderboards.hostel.length && <p className="empty-board">Hostel rankings appear when students add their hostel during registration.</p>}
          </div>
        </div>
      )}

      {boardType === 'challenge' && (
        <div className="glass-card board-table-card">
          <div className="board-table-header challenge-board-header">
            <span>Rank</span><span>Student</span><span>Department</span><span>Progress</span><span>Status</span><span>Reward</span>
          </div>
          <div className="board-table-body">
            {leaderboards.challenge.map(entry => (
              <div key={entry.user_id} className={`board-table-row challenge-board-row ${entry.is_current_user ? 'current-user-row' : ''}`}>
                <span>#{entry.rank}</span>
                <span className="athlete-name">{entry.name}{entry.is_current_user && <span className="you-tag">YOU</span>}</span>
                <span>{entry.department}</span>
                <span>{Number(entry.progress).toLocaleString()} {entry.metric_type}</span>
                <span>{entry.is_completed ? 'Completed' : entry.is_joined ? 'In progress' : 'Not joined'}</span>
                <span>{entry.points ? `+${entry.points} pts` : '—'}</span>
              </div>
            ))}
            {!challengeId && <p className="empty-board">Create or join a challenge to see its ranking.</p>}
            {challengeId && leaderboards.challenge.length === 0 && <p className="empty-board">No students have joined this challenge yet.</p>}
          </div>
        </div>
      )}

      {boardType === 'college' && !individualList.length && <p className="empty-board">No college FitPoints have been recorded yet.</p>}

      <style>{`
        .leaderboard-page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
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

        /* Podium Section */
        .podium-section {
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(14, 21, 38, 0.95) 100%);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 2rem 2rem 0 2rem;
          border-radius: var(--radius-lg);
        }

        .podium-title-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-amber);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
        }

        .podium-grid {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 1.5rem;
          max-width: 650px;
          margin: 0 auto;
        }

        @media (max-width: 600px) {
          .podium-grid {
            gap: 0.75rem;
          }
        }

        .podium-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }

        .crown-anim {
          margin-bottom: 0.25rem;
          animation: bounce 2s infinite ease-in-out;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .podium-avatar-box {
          position: relative;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          border: 2px solid;
        }

        .podium-avatar {
          font-size: 1.75rem;
        }

        .podium-rank-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: #ffffff;
        }

        .gold-border { border-color: #fbbf24; }
        .gold-bg { background: #f59e0b; }
        .silver-border { border-color: #cbd5e1; }
        .silver-bg { background: #64748b; }
        .bronze-border { border-color: #d97706; }
        .bronze-bg { background: #b45309; }

        .podium-name {
          font-size: 0.9rem;
          color: #ffffff;
          margin-bottom: 0.15rem;
        }

        .podium-dept {
          font-size: 0.725rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .podium-pts {
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .podium-pillar {
          width: 100%;
          border-radius: 12px 12px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 1rem;
        }

        .pillar-gold {
          height: 120px;
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.1) 100%);
          border: 1px solid rgba(245, 158, 11, 0.5);
          border-bottom: none;
        }

        .pillar-silver {
          height: 90px;
          background: linear-gradient(180deg, rgba(148, 163, 184, 0.3) 0%, rgba(148, 163, 184, 0.05) 100%);
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-bottom: none;
        }

        .pillar-bronze {
          height: 70px;
          background: linear-gradient(180deg, rgba(217, 119, 6, 0.3) 0%, rgba(217, 119, 6, 0.05) 100%);
          border: 1px solid rgba(217, 119, 6, 0.4);
          border-bottom: none;
        }

        /* Board Tabs */
        .board-selector-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .board-tabs-group {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 0.3rem;
          border-radius: var(--radius-sm);
        }

        .board-tab-btn {
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

        .board-tab-btn.active {
          background: var(--accent-emerald);
          color: #ffffff;
        }

        .search-pill {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--text-dim);
        }

        .board-search-input {
          padding: 0.55rem 0.85rem 0.55rem 2.4rem;
          background: rgba(14, 21, 38, 0.9);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-main);
          font-size: 0.85rem;
          outline: none;
        }

        /* Table */
        .board-table-card {
          padding: 0;
          overflow: hidden;
        }

        .board-table-header {
          display: grid;
          grid-template-columns: 80px 1.5fr 1fr 1fr 1fr 1fr;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .board-table-body {
          display: flex;
          flex-direction: column;
        }

        .board-table-row {
          display: grid;
          grid-template-columns: 80px 1.5fr 1fr 1fr 1fr 1fr;
          padding: 1rem 1.5rem;
          align-items: center;
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.2s;
        }

        .board-table-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .current-user-row {
          background: rgba(16, 185, 129, 0.08) !important;
          border-left: 3px solid var(--accent-emerald);
        }

        .current-dept-row {
          background: rgba(6, 182, 212, 0.08) !important;
          border-left: 3px solid var(--accent-cyan);
        }

        @media (max-width: 850px) {
          .board-table-header, .board-table-row {
            grid-template-columns: 60px 1.5fr 1fr 1fr;
          }
          .col-workouts, .col-streak {
            display: none;
          }
        }

        .rank-number-box {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1rem;
          color: var(--text-muted);
        }

        .col-athlete {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .athlete-avatar {
          font-size: 1.5rem;
        }

        .athlete-name-col {
          display: flex;
          flex-direction: column;
        }

        .athlete-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .you-tag {
          font-size: 0.65rem;
          font-weight: 800;
          background: var(--accent-emerald);
          color: #ffffff;
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-full);
        }

        .athlete-year {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        .dept-badge {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .streak-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-amber);
        }

        .col-workouts {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .col-points {
          text-align: right;
        }

        .points-bold {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 800;
          color: var(--accent-cyan-light);
        }

        .dept-code-box {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 0.9rem;
          color: #ffffff;
        }

        .dept-students-count {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .top-performer-tag {
          font-size: 0.8rem;
          color: var(--accent-amber);
          font-weight: 600;
        }

        .college-blocks-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          padding: 1.5rem;
        }

        @media (max-width: 800px) {
          .college-blocks-grid {
            grid-template-columns: 1fr;
          }
        }

        .hostel-block-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .hostel-rank {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-amber);
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }

        .hostel-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.35rem;
        }

        .hostel-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
          flex: 1;
        }

        .hostel-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
