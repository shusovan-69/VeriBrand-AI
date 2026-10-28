import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GuidelinesPage from './pages/GuidelinesPage';
import ContentSubmissionPage from './pages/ContentSubmissionPage';
import DraftDetailsPage from './pages/DraftDetailsPage';
import ReviewerQueuePage from './pages/ReviewerQueuePage';
import RevisionInsightsPage from './pages/RevisionInsightsPage';
import ImageReviewPage from './pages/ImageReviewPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';

function ProtectedLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,101,0,0.2)', borderTopColor: '#FF6500', animation: 'spin 0.9s linear infinite' }} />
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Authenticating...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/submit" element={<ProtectedLayout><ContentSubmissionPage /></ProtectedLayout>} />
          <Route path="/guidelines" element={<ProtectedLayout><GuidelinesPage /></ProtectedLayout>} />
          <Route path="/drafts/:draftId" element={<ProtectedLayout><DraftDetailsPage /></ProtectedLayout>} />
          <Route path="/reviews" element={<ProtectedLayout><ReviewerQueuePage /></ProtectedLayout>} />
          <Route path="/insights" element={<ProtectedLayout><RevisionInsightsPage /></ProtectedLayout>} />
          <Route path="/image-review" element={<ProtectedLayout><ImageReviewPage /></ProtectedLayout>} />
          <Route path="/activity" element={<ProtectedLayout><ActivityHistoryPage /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
