import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { AuthSuccessView } from '../../components/auth/AuthSuccessView';
import { useAuth } from '../../context/useAuth';

export const LoginPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <AuthLayout>
      {user ? <AuthSuccessView /> : <LoginForm />}
    </AuthLayout>
  );
};
