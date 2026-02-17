
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfileSelectionPage from './pages/ProfileSelectionPage';
import RegistrationPage from './pages/RegistrationPage';
import FeedPage from './pages/FeedPage';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NetworkPage from './pages/NetworkPage';
import ProjectsPage from './pages/ProjectsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#0d121b] dark:text-gray-100">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile-selection" element={<ProfileSelectionPage />} />
          <Route path="/register/:role" element={<RegistrationPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
