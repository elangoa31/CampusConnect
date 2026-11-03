import React from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../context/useAuth';
import { isStudentProfileComplete } from '../../utils/validation';
import type { UserRole } from '../../types/auth.types';

export const LoginPage: React.FC = () => {
  const { user, profile, isLoading, signOut } = useAuth();
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

  const roleQuery = searchParams.get('role');
  const activePortalRole: UserRole | null =
    roleQuery === 'student' || roleQuery === 'staff' ? roleQuery : null;

  if (user) {
    const authoritativeRole = profile?.role;

    // Strict check: if user's authoritative database profile does not match the portal role,
    // show a clear account-role mismatch error and NEVER redirect to the wrong dashboard.
    if (activePortalRole && authoritativeRole && authoritativeRole !== activePortalRole) {
      return (
        <AuthLayout>
          <div className="w-full space-y-4 text-left animate-fadeIn">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Account Role Mismatch</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                This account is registered in CampusConnect as{' '}
                <strong className="font-semibold capitalize text-amber-950">
                  {authoritativeRole === 'student' ? 'Student' : 'Faculty / Staff'}
                </strong>
                . You cannot sign in through the{' '}
                <span className="font-semibold capitalize text-red-700">
                  {activePortalRole === 'student' ? 'Student' : 'Faculty / Staff'}
                </span>{' '}
                portal.
              </p>
              <p className="text-[11px] text-amber-700">
                Please sign in through your designated portal or switch roles below.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Link
                to={`/login?role=${authoritativeRole}`}
                className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors text-center flex items-center justify-center gap-2"
              >
                <span>
                  Go to {authoritativeRole === 'student' ? 'Student' : 'Faculty'} Portal
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center cursor-pointer"
              >
                Sign Out & Switch Account
              </button>
            </div>
          </div>
        </AuthLayout>
      );
    }

    const resolvedRole = authoritativeRole || activePortalRole || 'student';

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
