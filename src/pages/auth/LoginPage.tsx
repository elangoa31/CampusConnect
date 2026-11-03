import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../context/useAuth';
import { isStudentProfileComplete } from '../../utils/validation';

export const LoginPage: React.FC = () => {
  const { user, profile } = useAuth();

  if (user) {
    if (profile?.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    if (!isStudentProfileComplete(profile || user?.user_metadata)) {
      return <Navigate to="/student/profile-setup" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};
