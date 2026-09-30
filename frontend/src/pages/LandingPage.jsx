import React from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Activity, 
  Flame, 
  Target, 
  Award, 
  Users, 
  BarChart3, 
  Compass, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Trophy,
  Dumbbell
} from 'lucide-react';

export default function LandingPage() {
  const { setCurrentPage, profile } = useFitness();

  const benefits = [
    {
      icon: Activity,
      title: 'Beyond Just Steps',
      description: 'Track running, gym, yoga, football, cricket, badminton, and cycling with MET-scientific calorie calculations.',
      color: 'var(--accent-emerald)',
      bg: 'var(--accent-emerald-dim)'
    },
    {
      icon: Flame,
      title: 'Sedentary Habit Breaker',
      description: 'Break grueling 8-10 hour coding and study sessions with adaptive micro-break desk stretches and walk reminders.',
      color: 'var(--accent-amber)',
      bg: 'var(--accent-amber-dim)'
    },
    {
      icon: Users,
      title: 'Inter-Department Clashes',
      description: 'Rally your peers! CSE vs ECE vs Mechanical fitness rivalries make staying healthy a thrilling team mission.',
      color: 'var(--accent-cyan)',
      bg: 'var(--accent-cyan-dim)'
    },
    {
      icon: Zap,
      title: 'Streaks & FitPoints',
      description: 'Earn points for every active minute. Build daily workout streaks to unlock badges, trophies, and campus perks.',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)'
    },
    {
      icon: Compass,
      title: 'Personalized Adaptive Goals',
      description: 'Personalized targets tailored to your schedule, exam calendar, fitness baseline, and available daily time.',
      color: 'var(--accent-violet)',
      bg: 'var(--accent-violet-dim)'
    },
    {
      icon: BarChart3,
      title: 'Institutional Wellness Analytics',
      description: 'Empowers universities and directors with anonymized wellness indices, department health stats, and sports trends.',
      color: '#fb7185',
      bg: 'rgba(251, 113, 133, 0.15)'
    }
  ];

  const steps = [
    { num: '01', title: 'PROFILE', desc: 'Assess your baseline study hours, BMI, sport passions & daily time availability.' },
    { num: '02', title: 'TRACK', desc: 'Log workouts across 10+ sports with instant MET calorie and points calculation.' },
    { num: '03', title: 'CHALLENGE', desc: 'Join solo quests, hostel leagues, and inter-department campus fitness derbies.' },
    { num: '04', title: 'REWARD', desc: 'Earn verified badges, climb the Hall of Fame podium, and redeem campus perks.' }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} className="text-emerald" />
          <span>Campus Fitness & Wellness Platform</span>
        </div>

        <h1 className="hero-title">
          Fueling Student Vitality. <br />
          <span className="gradient-text-emerald">Overcoming Sedentary Campus Life.</span>
        </h1>

        <p className="hero-subtitle">
          A gamified, student-centric fitness platform that transforms campus movement into inter-department rivalry, 
          streak rewards, and lifelong physical wellness.
        </p>

        {/* Student wellness focus */}
        <div className="wellness-focus-card">
          <div className="wellness-focus-label">
            <span className="problem-dot" />
            <span>Movement Made for Campus Life</span>
          </div>
          <p className="wellness-focus-quote">
            "Build healthier habits, stay active with friends, and make everyday campus life more energetic."
          </p>
          <div className="wellness-focus-meta">
            Targeting long study hours, library fatigue, and exam stress with actionable habit loops.
          </div>
        </div>

        {/* Action CTAs */}
        <div className="hero-cta-group">
          <button 
            onClick={() => setCurrentPage(profile.isLoggedIn ? 'dashboard' : 'auth')} 
            className="btn btn-primary btn-lg"
          >
            <span>{profile.isLoggedIn ? 'Go to My Dashboard' : 'Get Started — Free Campus Sign Up'}</span>
            <ArrowRight size={18} />
          </button>

          <button 
            onClick={() => setCurrentPage('dashboard')} 
            className="btn btn-secondary btn-lg"
          >
            <Trophy size={18} className="text-amber" />
            <span>Explore Dashboard</span>
          </button>
        </div>

        {/* Quick Highlights Row */}
        <div className="hero-metrics-strip">
          <div className="metric-box">
            <span className="metric-number">10+</span>
            <span className="metric-desc">Tracked Sports & Workouts</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <span className="metric-number">5</span>
            <span className="metric-desc">FitPoints Tiers</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <span className="metric-number">MET</span>
            <span className="metric-desc">Calorie Estimation</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <span className="metric-number">6 Depts</span>
            <span className="metric-desc">Active in Campus Clash</span>
          </div>
        </div>
      </section>

      {/* Core Loop Concept: PROFILE -> TRACK -> CHALLENGE -> REWARD */}
      <section className="concept-section">
        <div className="section-header">
          <span className="section-eyebrow">The Core Philosophy</span>
          <h2 className="section-title">PROFILE → TRACK → CHALLENGE → REWARD</h2>
          <p className="section-desc">
            A continuous behavioral loop specifically crafted to turn sedentary students into consistent campus athletes.
          </p>
        </div>

        <div className="concept-grid">
          {steps.map((st, i) => (
            <div key={st.num} className="concept-card glass-card">
              <div className="concept-step-num">{st.num}</div>
              <h3 className="concept-step-title">{st.title}</h3>
              <p className="concept-step-desc">{st.desc}</p>
              {i < steps.length - 1 && <div className="step-connector-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="benefits-section">
        <div className="section-header">
          <span className="section-eyebrow">Why FitConnect?</span>
          <h2 className="section-title">Built for Modern Campus Realities</h2>
          <p className="section-desc">
            Unlike generic step counters, FitConnect is engineered around university life, student hostels, and academic schedules.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="benefit-card glass-card">
                <div className="benefit-icon-wrapper" style={{ background: b.bg, color: b.color }}>
                  <Icon size={24} />
                </div>
                <h3 className="benefit-title">{b.title}</h3>
                <p className="benefit-description">{b.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="cta-banner-section glass-card">
        <div className="cta-content">
          <h2 className="cta-heading">Ready to lead your department to victory?</h2>
          <p className="cta-sub">
            Join your college branch, set your fitness baseline, and start logging workouts today.
          </p>
          <div className="cta-buttons">
            <button 
              onClick={() => setCurrentPage('auth')} 
              className="btn btn-primary btn-lg"
            >
              <span>Join FitConnect Campus</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage('challenges')} 
              className="btn btn-secondary btn-lg"
            >
              <span>View Department Clash</span>
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .landing-page {
          display: flex;
          flex-direction: column;
          gap: 5rem;
          padding: 1rem 0;
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 0;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald-light);
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.25rem;
          }
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 750px;
          margin-bottom: 2rem;
        }

        .wellness-focus-card {
          width: 100%;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-md);
          padding: 1.5rem 1.75rem;
          margin-bottom: 2.25rem;
          text-align: left;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
          position: relative;
        }

        .wellness-focus-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--accent-amber);
          margin-bottom: 0.5rem;
        }

        .wellness-focus-label .problem-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-amber);
          box-shadow: 0 0 8px var(--accent-amber);
        }

        .wellness-focus-quote {
          font-size: 1.15rem;
          font-weight: 600;
          color: #ffffff;
          font-style: italic;
          margin-bottom: 0.4rem;
        }

        .wellness-focus-meta {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .hero-cta-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 3.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .hero-metrics-strip {
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .metric-number {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 800;
          color: #ffffff;
        }

        .metric-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .metric-divider {
          width: 1px;
          height: 40px;
          background: var(--border-subtle);
        }

        @media (max-width: 640px) {
          .metric-divider {
            display: none;
          }
          .hero-metrics-strip {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
        }

        /* Section Headers */
        .section-header {
          text-align: center;
          max-width: 750px;
          margin: 0 auto 3rem auto;
        }

        .section-eyebrow {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent-emerald-light);
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.75rem;
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 1.75rem;
          }
        }

        .section-desc {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* Concept Cards */
        .concept-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          position: relative;
        }

        @media (max-width: 900px) {
          .concept-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .concept-grid {
            grid-template-columns: 1fr;
          }
        }

        .concept-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 1.75rem;
        }

        .concept-step-num {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 900;
          color: var(--accent-emerald);
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .concept-step-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .concept-step-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .step-connector-arrow {
          position: absolute;
          right: -15px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.5rem;
          color: var(--accent-emerald);
          display: none;
        }

        /* Benefits Grid */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 960px) {
          .benefits-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .benefits-grid {
            grid-template-columns: 1fr;
          }
        }

        .benefit-card {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .benefit-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .benefit-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
        }

        .benefit-description {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* CTA Banner */
        .cta-banner-section {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%), var(--bg-card);
          border: 1px solid var(--border-glow);
          padding: 3.5rem 2rem;
          text-align: center;
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
        }

        .cta-content {
          max-width: 650px;
          margin: 0 auto;
        }

        .cta-heading {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.75rem;
        }

        .cta-sub {
          font-size: 1.05rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
