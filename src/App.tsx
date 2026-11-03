import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StudentProfileSetupPage } from './pages/profile/StudentProfileSetupPage';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { StaffDashboardPlaceholder } from './pages/dashboard/StaffDashboardPlaceholder';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Initial Role Selection Screen */}
          <Route path="/" element={<RoleSelectionPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Student Profile Setup & Edit */}
          <Route
            path="/student/profile-setup"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentProfileSetupPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Dashboard */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffDashboardPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* Fallback to initial role selection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
