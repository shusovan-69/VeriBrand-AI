import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedLayout>
                <ContentSubmissionPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/guidelines"
            element={
              <ProtectedLayout>
                <GuidelinesPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/drafts/:draftId"
            element={
              <ProtectedLayout>
                <DraftDetailsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedLayout>
                <ReviewerQueuePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedLayout>
                <RevisionInsightsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/image-review"
            element={
              <ProtectedLayout>
                <ImageReviewPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedLayout>
                <ActivityHistoryPage />
              </ProtectedLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
