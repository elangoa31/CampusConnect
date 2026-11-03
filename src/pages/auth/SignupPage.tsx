import React from 'react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { SignupForm } from '../../components/auth/SignupForm';
import { AuthSuccessView } from '../../components/auth/AuthSuccessView';
import { useAuth } from '../../context/useAuth';

export const SignupPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <AuthLayout>
      {user ? <AuthSuccessView /> : <SignupForm />}
    </AuthLayout>
  );
};
