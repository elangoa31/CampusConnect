import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import type { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRole,
  children,
}) => {
  const { user, profile, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying security clearance...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login with intended role
  if (!user) {
    return <Navigate to={`/login?role=${allowedRole}`} replace />;
  }

  // Database verified role with session fallback for OAuth flows
  const sessionRole = typeof sessionStorage !== 'undefined'
    ? (sessionStorage.getItem('campusconnect_intended_role') as UserRole | null)
    : null;
  const actualRole = profile?.role || user?.user_metadata?.role || sessionRole || 'student';

  // Strict role check: Ensure users access the appropriate portal
  if (actualRole !== allowedRole) {
    const isStudent = actualRole === 'student';
    const targetDashboard = isStudent ? '/student/dashboard' : '/staff/dashboard';

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-5 shadow-2xl border border-red-100">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your account is verified in the database as{' '}
              <span className="font-semibold text-slate-900 capitalize">{actualRole}</span>.
              You do not have permission to access the{' '}
              <span className="font-semibold text-red-600 capitalize">{allowedRole}</span> portal.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to={targetDashboard}
              className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2"
            >
              <span>Go to your {isStudent ? 'Student' : 'Faculty'} Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
