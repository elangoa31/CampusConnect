import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';
import { AuthSuccessView } from '../../components/auth/AuthSuccessView';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <AuthLayout>
      {user ? <AuthSuccessView /> : <ForgotPasswordForm />}
    </AuthLayout>
  );
};
