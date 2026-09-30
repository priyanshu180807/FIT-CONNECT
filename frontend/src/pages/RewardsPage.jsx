import React, { useEffect, useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Award, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Gift, 
  Sparkles, 
  Trophy, 
  ShoppingBag,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function RewardsPage() {
  const { points, streak, badges, perks, redeemPerk, getUserTier, loadRewards } = useFitness();
  const tier = getUserTier(points);
  const [activeCategory, setActiveCategory] = useState('All');
  const [redeemedToast, setRedeemedToast] = useState(null);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const categories = ['All', 'Streak', 'Milestone', 'Performance', 'Community'];

  const filteredBadges = badges.filter(b => {
    if (activeCategory === 'All') return true;
    return b.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleRedeem = async (perk) => {
    const success = await redeemPerk(perk.id);
    if (success) {
      setRedeemedToast(`Successfully redeemed "${perk.title}"! Enjoy your campus perk.`);
      setTimeout(() => setRedeemedToast(null), 4000);
    }
  };

  return (
    <div className="rewards-page">
      {/* Header */}
      <div className="rewards-header">
        <div>
          <span className="chip chip-amber mb-1">Campus Incentive & Trophy Vault</span>
          <h1 className="page-title">Rewards, Badges & Campus Perks</h1>
          <p className="page-sub">
            Convert your physical effort into verified college fitness badges, milestone streaks, and campus privileges.
          </p>
        </div>
      </div>

      {redeemedToast && (
        <div className="redeem-toast-bar">
          <CheckCircle2 size={18} />
          <span>{redeemedToast}</span>
        </div>
      )}

      {/* Hero Overview Cards */}
      <div className="grid-3 rewards-hero-grid">
        {/* FitPoints Card */}
        <div className="glass-card reward-hero-card">
          <div className="card-top-icon">
            <Zap size={22} className="text-cyan" />
            <span className="hero-card-tag">FitPoints Balance</span>
          </div>
          <div className="hero-card-main">
            <span className="hero-card-num text-cyan">{points.toLocaleString()}</span>
            <span className="hero-card-unit">Available Points</span>
          </div>
          <p className="hero-card-footer">
            Earned from campus workouts, streak bonuses & challenge contributions.
          </p>
        </div>

        {/* Tier Progression Card */}
        <div className="glass-card reward-hero-card">
          <div className="card-top-icon">
            <Trophy size={22} style={{ color: tier.color }} />
            <span className="hero-card-tag">FitPoints Tier</span>
          </div>
          <div className="hero-card-main">
            <span className="hero-card-num" style={{ color: tier.color }}>{tier.name}</span>
          </div>
          <div className="tier-progress-box">
            <div className="tier-prog-header">
              <span>Progress to Next Tier</span>
              <span>{tier.progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-amber" style={{ width: `${tier.progress}%` }} />
            </div>
            {tier.next && (
              <span className="next-tier-sub">Target: {tier.target} pts for {tier.next}</span>
            )}
            <div className="tier-rank-list">
              {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((name) => (
                <span key={name} className={name === tier.name ? 'active-tier' : ''}>{name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Milestones Card */}
        <div className="glass-card reward-hero-card">
          <div className="card-top-icon">
            <Flame size={22} className="streak-pulse text-amber" />
            <span className="hero-card-tag">Streak Status</span>
          </div>
          <div className="hero-card-main">
            <span className="hero-card-num text-amber">{streak} Days</span>
            <span className="hero-card-unit">Consecutive Habit</span>
          </div>
          <p className="hero-card-footer text-emerald">
            Keep logging activities to extend your current streak.
          </p>
        </div>
      </div>

      {/* Streak Rewards Track */}
      <div className="glass-card streak-timeline-card">
        <h3 className="section-title-sm">
          <Flame size={18} className="text-amber" />
          <span>Activity Streak Milestones</span>
        </h3>
        <p className="section-sub-sm">Consistency is the antidote to sedentary student burnout.</p>

        <div className="streak-step-track">
          {[
            { day: 1, label: 'First Step' },
            { day: 3, label: '3-Day Streak' },
            { day: 5, label: 'Flame Keeper' },
            { day: 7, label: '7-Day Streak', activeTarget: true },
            { day: 14, label: '14-Day Streak' },
            { day: 30, label: '30-Day Streak' }
          ].map((st) => (
            <div key={st.day} className={`streak-step-node ${streak >= st.day ? 'step-unlocked' : ''} ${st.activeTarget && streak < st.day ? 'step-target' : ''}`}>
              <div className="step-circle">
                {streak >= st.day ? <CheckCircle2 size={18} /> : st.activeTarget ? '🔥' : <Lock size={14} />}
              </div>
              <span className="step-day">Day {st.day}</span>
              <span className="step-name">{st.label}</span>
              <span className="step-reward-pill">{streak >= st.day ? 'Reached' : `${st.day - streak} days left`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Collection Section */}
      <div className="badges-vault-section">
        <div className="vault-header-flex">
          <div>
            <h2 className="section-title-md">
              <Award size={20} className="text-emerald" />
              <span>Campus Badges Collection</span>
            </h2>
            <p className="section-sub-sm">
              Badges unlock automatically when logged activity meets each achievement requirement.
            </p>
          </div>

          <div className="badge-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`badge-pill-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="badges-grid-layout">
          {filteredBadges.map((b) => (
            <div 
              key={b.id} 
              className={`badge-item-card glass-card ${b.unlocked ? 'card-unlocked' : 'card-locked'}`}
            >
              <div className="badge-card-top">
                <span className={`chip ${b.unlocked ? 'chip-emerald' : 'chip-dim'}`}>
                  {b.unlocked ? 'Unlocked' : 'Locked'}
                </span>
                <span className="badge-pts-tag">⚡ +{b.points} pts</span>
              </div>

              <div className="badge-icon-display">
                <div className={`badge-symbol-box ${b.unlocked ? 'symbol-unlocked' : 'symbol-locked'}`}>
                  {b.icon === 'Flame' && '🔥'}
                  {b.icon === 'Zap' && '⚡'}
                  {b.icon === 'Award' && '🎖️'}
                  {b.icon === 'Footprints' && '👟'}
                  {b.icon === 'TrendingUp' && '🚀'}
                  {b.icon === 'Compass' && '🧘'}
                  {b.icon === 'Shield' && '🛡️'}
                  {b.icon === 'Target' && '🎯'}
                </div>
              </div>

              <h4 className="badge-card-name">{b.name}</h4>
              <p className="badge-card-desc">{b.description}</p>

              <div className="badge-card-status">
                {b.unlocked ? (
                  <span className="earned-date text-emerald">
                    <CheckCircle2 size={14} /> Earned {b.unlockedAt}
                  </span>
                ) : (
                  <span className="locked-progress text-dim">
                    <Lock size={13} /> {b.requirement || 'Criteria not yet reached'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Perks Store */}
      <div className="glass-card perks-store-section">
        <div className="perks-header-row">
          <div>
            <span className="chip chip-cyan mb-1">Student Rewards Marketplace</span>
            <h2 className="section-title-md">
              <ShoppingBag size={20} className="text-cyan" />
              <span>Redeem Campus Privileges</span>
            </h2>
            <p className="section-sub-sm">Exchange your hard-earned FitPoints for actual college wellness benefits.</p>
          </div>
          <div className="available-pts-badge">
            <Zap size={16} className="text-cyan" />
            <span>Balance: {points.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="perks-grid">
          {perks.map((p) => (
            <div key={p.id} className="perk-card glass-card">
              <div className="perk-card-top">
                <span className="chip chip-violet">{p.category}</span>
                <span className="perk-cost text-cyan font-bold">{p.cost} pts</span>
              </div>
              <h4 className="perk-title">{p.title}</h4>
              <p className="perk-desc">{p.description}</p>
              
              <button
                disabled={p.isRedeemed || points < p.cost}
                onClick={() => handleRedeem(p)}
                className={`btn w-full ${p.isRedeemed ? 'btn-secondary' : points >= p.cost ? 'btn-primary' : 'btn-secondary opacity-50'}`}
              >
                {p.isRedeemed ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>Redeemed • Active Pass</span>
                  </>
                ) : points >= p.cost ? (
                  <>
                    <Gift size={16} />
                    <span>Redeem Pass (-{p.cost} pts)</span>
                  </>
                ) : (
                  <span>Need {p.cost - points} more pts</span>
                )}
              </button>
            </div>
          ))}
          {!perks.length && <p className="empty-rewards">No campus rewards are available right now.</p>}
        </div>
      </div>

      <style>{`
        .rewards-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
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

        .redeem-toast-bar {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.85rem 1.25rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);
          color: #ffffff;
          border-radius: var(--radius-sm);
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
          animation: slideIn 0.3s ease;
        }

        .rewards-hero-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 800px) {
          .rewards-hero-grid {
            grid-template-columns: 1fr;
          }
        }

        .reward-hero-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.5rem;
        }

        .card-top-icon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-card-tag {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .hero-card-main {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .hero-card-num {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 900;
          line-height: 1;
        }

        .hero-card-unit {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .hero-card-footer {
          font-size: 0.8rem;
          color: var(--text-dim);
          line-height: 1.4;
        }

        .tier-progress-box {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .tier-rank-list { display: flex; justify-content: space-between; gap: 0.35rem; margin-top: 0.5rem; }
        .tier-rank-list span { color: var(--text-dim); font-size: 0.68rem; font-weight: 700; }
        .tier-rank-list .active-tier { color: var(--accent-emerald-light); }
        .empty-rewards { color: var(--text-muted); grid-column: 1 / -1; }

        .tier-prog-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .next-tier-sub {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        /* Streak Track */
        .streak-timeline-card {
          padding: 1.75rem;
        }

        .section-title-sm {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .section-sub-sm {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }

        .streak-step-track {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .streak-step-track {
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
        }

        .streak-step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }

        .step-unlocked {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.35);
        }

        .step-target {
          border-color: var(--accent-amber);
          background: rgba(245, 158, 11, 0.08);
        }

        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .step-unlocked .step-circle {
          background: var(--accent-emerald);
          color: #ffffff;
        }

        .step-day {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
        }

        .step-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.4rem;
        }

        .step-reward-pill {
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.06);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          color: var(--accent-amber);
        }

        /* Badges Section */
        .vault-header-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-title-md {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .badge-category-pills {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .badge-pill-btn {
          padding: 0.4rem 0.85rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .badge-pill-btn.active {
          background: var(--accent-emerald-dim);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald-light);
        }

        .badges-grid-layout {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 950px) {
          .badges-grid-layout {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .badges-grid-layout {
            grid-template-columns: 1fr;
          }
        }

        .badge-item-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .badge-card-top {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .chip-dim {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-dim);
          border: 1px solid var(--border-subtle);
        }

        .badge-pts-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-cyan-light);
        }

        .badge-icon-display {
          margin-bottom: 1rem;
        }

        .badge-symbol-box {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          border: 2px solid;
        }

        .symbol-unlocked {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
        }

        .symbol-locked {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.08);
          filter: grayscale(1);
          opacity: 0.45;
        }

        .badge-card-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.35rem;
        }

        .badge-card-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 1rem;
          flex: 1;
        }

        .badge-card-status {
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        /* Perks Store */
        .perks-store-section {
          padding: 2rem;
        }

        .perks-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .available-pts-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--accent-cyan-dim);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--accent-cyan-light);
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
        }

        .perks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 768px) {
          .perks-grid {
            grid-template-columns: 1fr;
          }
        }

        .perk-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .perk-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .perk-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.35rem;
        }

        .perk-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1.25rem;
          flex: 1;
        }

        .opacity-50 {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
