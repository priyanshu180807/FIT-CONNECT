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

function AppContent() {
  const { currentPage } = useFitness();

  // Scroll to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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
        {renderCurrentPage()}
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
