import React from 'react';
import { useFitness } from '../context/FitnessContext';

export default function Footer() {
  const { setCurrentPage } = useFitness();

  return (
    <footer className="footer-section">
      <div className="footer-inner">
        <div className="footer-top-grid">
          {/* Brand Col */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="footer-brand-name">Fit <span>Connect</span></span>
            </div>
            <p className="footer-tagline">
              Empowering college students to overcome sedentary screen time, cultivate lifelong fitness habits, and fuel campus spirit through gamified health innovation.
            </p>
          </div>

          {/* Core Concept Col */}
          <div className="footer-col">
            <h4 className="footer-heading">Core Framework</h4>
            <ul className="footer-list">
              <li><button onClick={() => setCurrentPage('profile')}>1. Profile & Baseline Setup</button></li>
              <li><button onClick={() => setCurrentPage('activities')}>2. Track Multi-Sports & MET</button></li>
              <li><button onClick={() => setCurrentPage('challenges')}>3. Challenge & Dept Clash</button></li>
              <li><button onClick={() => setCurrentPage('rewards')}>4. Reward & Streak Badges</button></li>
            </ul>
          </div>

          {/* Quick Links Col */}
          <div className="footer-col">
            <h4 className="footer-heading">Features</h4>
            <ul className="footer-list">
              <li><button onClick={() => setCurrentPage('dashboard')}>Student Dashboard</button></li>
              <li><button onClick={() => setCurrentPage('leaderboard')}>Campus Leaderboards</button></li>
              <li><button onClick={() => setCurrentPage('analytics')}>Wellness Analytics</button></li>
              <li><button onClick={() => setCurrentPage('rewards')}>Campus Perks Store</button></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© 2026 FitConnect. Built for healthier campus communities.</p>
          <div className="footer-bottom-links">
            <button onClick={() => setCurrentPage('landing')} className="footer-mini-link">Home</button>
            <button onClick={() => setCurrentPage('dashboard')} className="footer-mini-link">Dashboard</button>
            <button onClick={() => setCurrentPage('activities')} className="footer-mini-link">Activity Log</button>
          </div>
        </div>
      </div>

      <style>{`
        .footer-section {
          background: #060911;
          border-top: 1px solid var(--border-subtle);
          padding: 3rem 1.5rem 1.5rem 1.5rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          position: relative;
          z-index: 2;
        }

        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
        }

        .footer-top-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 2.5rem;
          margin-bottom: 2.5rem;
        }

        @media (max-width: 900px) {
          .footer-top-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .footer-top-grid {
            grid-template-columns: 1fr;
          }
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.85rem;
        }

        .footer-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-brand-name {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.03em;
        }

        .footer-brand-name span {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .footer-tagline {
          font-size: 0.85rem;
          line-height: 1.6;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .footer-heading {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
          letter-spacing: 0.02em;
        }

        .footer-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .footer-list button {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-family: var(--font-main);
          cursor: pointer;
          text-align: left;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
          padding: 0;
        }

        .footer-list button:hover {
          color: var(--accent-emerald-light);
          transform: translateX(3px);
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-bottom-links {
          display: flex;
          gap: 1.25rem;
        }

        .footer-mini-link {
          background: none;
          border: none;
          color: var(--text-dim);
          font-size: 0.8rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .footer-mini-link:hover {
          color: var(--text-main);
        }
      `}</style>
    </footer>
  );
}
