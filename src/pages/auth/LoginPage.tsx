import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../context/useAuth';
import { isStudentProfileComplete } from '../../utils/validation';
import type { UserRole } from '../../types/auth.types';

export const LoginPage: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying your session...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    const roleQuery = searchParams.get('role') as UserRole | null;
    const sessionRole = typeof sessionStorage !== 'undefined'
      ? (sessionStorage.getItem('campusconnect_intended_role') as UserRole | null)
      : null;
    const resolvedRole = profile?.role || user?.user_metadata?.role || roleQuery || sessionRole || 'student';

    if (resolvedRole === 'staff') {
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
