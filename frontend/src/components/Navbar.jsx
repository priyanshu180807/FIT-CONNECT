import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Activity, 
  Target, 
  Award, 
  BarChart3, 
  User, 
  Menu, 
  X, 
  Home,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { currentPage, setCurrentPage, profile, streak, points, logoutUser, getUserTier } = useFitness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tier = getUserTier(points);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'activities', label: 'Track Activity', icon: Activity },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile Setup', icon: User },
  ];

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand Logo - Only Fit Connect */}
        <div 
          className="navbar-brand" 
          onClick={() => handleNavClick('landing')}
          role="button"
          tabIndex={0}
        >
          <div className="brand-title">
            Fit <span>Connect</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon size={17} />
                <span>{link.label}</span>
                {isActive && <div className="active-pill-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Right Status Pills & User Profile */}
        <div className="navbar-right">
          {profile.isLoggedIn ? (
            <div className="user-stats-row">
              {/* Streak Badge */}
              <div 
                className="stat-pill streak-pill" 
                title="Active Workout Streak"
                onClick={() => handleNavClick('rewards')}
              >
                <Flame size={17} className="streak-pulse text-amber" />
                <span className="stat-value">{streak}</span>
                <span className="stat-label">Days</span>
              </div>

              {/* Points Badge */}
              <div 
                className="stat-pill points-pill" 
                title="FitPoints Balance"
                onClick={() => handleNavClick('rewards')}
              >
                <Zap size={16} className="text-cyan" />
                <span className="stat-value">{points.toLocaleString()}</span>
                <span className="stat-label">pts</span>
              </div>

              {/* User Avatar & Logout */}
              <div className="user-profile-menu">
                <button 
                  className="avatar-btn"
                  onClick={() => handleNavClick('profile')}
                  title={`${profile.name} (${profile.department})`}
                >
                  <span className="avatar-letter">{profile.name.charAt(0)}</span>
                  <span className="user-name-truncated">{profile.name.split(' ')[0]}</span>
                </button>
                <button 
                  onClick={logoutUser} 
                  className="logout-icon-btn" 
                  title="Switch / Log Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons-row">
              <button 
                onClick={() => handleNavClick('auth')} 
                className="btn btn-secondary btn-sm"
              >
                Log In
              </button>
              <button 
                onClick={() => handleNavClick('auth')} 
                className="btn btn-primary btn-sm"
              >
                Join Now
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-nav-links">
            <button 
              className={`mobile-nav-item ${currentPage === 'landing' ? 'active' : ''}`}
              onClick={() => handleNavClick('landing')}
            >
              <Home size={18} />
              <span>Home / Overview</span>
            </button>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </button>
              );
            })}
            <div className="mobile-drawer-footer">
              {profile.isLoggedIn ? (
                <button onClick={logoutUser} className="btn btn-secondary w-full">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button onClick={() => handleNavClick('auth')} className="btn btn-primary w-full">
                  Register / Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(8, 12, 22, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .navbar-container {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          gap: 1rem;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          cursor: pointer;
          user-select: none;
        }

        .logo-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }

        .logo-svg {
          color: #ffffff;
        }

        .brand-text-col {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }

        .brand-title {
          font-family: var(--font-heading);
          font-size: 1.55rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.03em;
          transition: transform 0.2s ease;
        }

        .navbar-brand:hover .brand-title {
          transform: scale(1.02);
        }

        .brand-title span {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-item:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-item-active {
          color: var(--accent-emerald-light);
          background: var(--accent-emerald-dim);
        }

        .active-pill-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: var(--accent-emerald);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--accent-emerald);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-stats-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .streak-pill {
          background: var(--accent-amber-dim);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }

        .streak-pill:hover {
          background: rgba(245, 158, 11, 0.25);
          box-shadow: var(--shadow-streak);
        }

        .points-pill {
          background: var(--accent-cyan-dim);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--accent-cyan-light);
        }

        .points-pill:hover {
          background: rgba(6, 182, 212, 0.25);
        }

        .text-amber {
          color: #f59e0b;
        }

        .text-cyan {
          color: #06b6d4;
        }

        .stat-value {
          font-weight: 800;
        }

        .stat-label {
          font-size: 0.7rem;
          opacity: 0.8;
          text-transform: uppercase;
        }

        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .avatar-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .avatar-letter {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: #ffffff;
        }

        .user-name-truncated {
          max-width: 90px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 480px) {
          .user-name-truncated, .stat-label {
            display: none;
          }
        }

        .logout-icon-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: color 0.2s ease;
        }

        .logout-icon-btn:hover {
          color: var(--accent-rose);
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          padding: 0.25rem;
        }

        @media (max-width: 1024px) {
          .mobile-menu-btn {
            display: flex;
          }
        }

        .mobile-drawer {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          padding: 1rem 1.5rem;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          text-align: left;
          cursor: pointer;
        }

        .mobile-nav-item.active {
          background: var(--accent-emerald-dim);
          color: var(--accent-emerald-light);
        }

        .mobile-drawer-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .w-full {
          width: 100%;
        }
      `}</style>
    </header>
  );
}
