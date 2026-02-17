
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfileSelectionPage from './pages/ProfileSelectionPage';
import RegistrationPage from './pages/RegistrationPage';
import FeedPage from './pages/FeedPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NetworkPage from './pages/NetworkPage';
import ProjectsPage from './pages/ProjectsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminLayout from './components/AdminLayout';
import AdminSchoolsPage from './pages/AdminSchoolsPage';
import { SettingsProvider } from './contexts/SettingsContext';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#0d121b] dark:text-gray-100">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/profile-selection" element={<ProfileSelectionPage />} />
            <Route path="/register/:role" element={<RegistrationPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/settings" element={<ProfileSettingsPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="stats" element={<AdminDashboard />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="schools" element={<AdminSchoolsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </SettingsProvider>
  );
};

export default App;
