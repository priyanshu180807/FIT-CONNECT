import React, { useEffect } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/DashboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ChallengesPage from './pages/ChallengesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import RewardsPage from './pages/RewardsPage';
import AnalyticsPage from './pages/AnalyticsPage';

// ─── Error Boundary ────────────────────────────────────────────────────────
// Catches runtime errors in any child component and shows a recoverable screen
// instead of a completely blank page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // Log to console so it shows in Vercel function logs / browser DevTools.
    console.error('[FitConnect ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '2rem',
          textAlign: 'center', gap: '1rem',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ color: '#ffffff', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', maxWidth: '420px', lineHeight: 1.6 }}>
            {this.state.message}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
            style={{
              padding: '0.65rem 1.5rem', borderRadius: '8px',
              background: '#10b981', color: '#fff', border: 'none',
              fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Boot Splash ───────────────────────────────────────────────────────────
// Shown while the token-restore API call is in flight, preventing a flash of
// the landing page or a crash-prone dashboard with no data.
function BootSplash() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading, sans-serif)', fontSize: '2rem',
        fontWeight: 900, color: '#ffffff',
      }}>
        Fit <span style={{ color: '#10b981' }}>Connect</span>
      </div>
      <div style={{
        width: '36px', height: '36px', border: '3px solid rgba(16,185,129,0.3)',
        borderTop: '3px solid #10b981', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── App Content ───────────────────────────────────────────────────────────
function AppContent() {
  const { currentPage, isBooting } = useFitness();

  // Scroll to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Hold rendering until the initial auth-restore attempt has resolved.
  // This prevents the brief 'landing' flash and defers data-dependent renders.
  if (isBooting) return <BootSplash />;

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'profile':
      case 'onboarding':
        return <ProfileSetupPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'activities':
        return <ActivitiesPage />;
      case 'challenges':
        return <ChallengesPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'rewards':
        return <RewardsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <ErrorBoundary key={currentPage}>
          {renderCurrentPage()}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <FitnessProvider>
      <AppContent />
    </FitnessProvider>
  );
}
