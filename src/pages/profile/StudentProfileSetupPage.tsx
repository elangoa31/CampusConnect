import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { StudentProfileSetupForm } from '../../components/profile/StudentProfileSetupForm';
import { useAuth } from '../../context/useAuth';
import { isStudentProfileComplete } from '../../utils/validation';

export const StudentProfileSetupPage: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  if (isLoading) {
    return null; // AuthLayout will display while context initializes
  }

  // Not logged in -> redirect to student login
  if (!user) {
    return <Navigate to="/login?role=student" replace />;
  }

  // Staff members should not access student setup
  const actualRole = profile?.role || user?.user_metadata?.role;
  if (actualRole === 'staff') {
    return <Navigate to="/staff/dashboard" replace />;
  }

  // If already complete and not explicitly editing, send directly to dashboard
  if (!isEditMode && isStudentProfileComplete(profile || user?.user_metadata)) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <StudentProfileSetupForm />
    </AuthLayout>
  );
};
