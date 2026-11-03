import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../context/useAuth';

export const LoginPage: React.FC = () => {
  const { user, profile } = useAuth();

  if (user) {
    if (profile?.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};
