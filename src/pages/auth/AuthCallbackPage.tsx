import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Compass, AlertCircle, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService, INTENDED_ROLE_STORAGE_KEY } from '../../services/auth.service';
import { isStudentProfileComplete } from '../../utils/validation';
import { useAuth } from '../../context/useAuth';
import type { UserRole } from '../../types/auth.types';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIntendedRole, refreshProfile } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roleMismatch, setRoleMismatch] = useState<{
    actualRole: UserRole;
    expectedRole: UserRole;
  } | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    let handled = false;

    const resolveIntendedRole = (): UserRole | null => {
      const paramRole = searchParams.get('role');
      if (paramRole === 'student' || paramRole === 'staff') {
        return paramRole;
      }

      if (typeof sessionStorage !== 'undefined') {
        const sessionRole = sessionStorage.getItem(INTENDED_ROLE_STORAGE_KEY);
        if (sessionRole === 'student' || sessionRole === 'staff') {
          return sessionRole;
        }
      }

      if (typeof localStorage !== 'undefined') {
        const localRole = localStorage.getItem(INTENDED_ROLE_STORAGE_KEY);
        if (localRole === 'student' || localRole === 'staff') {
          return localRole;
        }
      }

      return null;
    };

    const cleanupRoleStorage = () => {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(INTENDED_ROLE_STORAGE_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(INTENDED_ROLE_STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    };

    const navigateForUser = async (activeUser: any) => {
      if (handled || !isSubscribed) return;
      handled = true;

      const intendedRole = resolveIntendedRole();

      // Execute authoritative OAuth role provisioning and verification
      const result = await AuthService.handleOAuthCallbackSession(activeUser, intendedRole);

      if (!isSubscribed) return;

      // Handle Role Mismatch: account exists with a different role than the portal selected
      if (result.roleMismatch && result.actualRole && result.expectedRole) {
        cleanupRoleStorage();
        setIntendedRole(null);
        setRoleMismatch({
          actualRole: result.actualRole,
          expectedRole: result.expectedRole,
        });
        return;
      }

      if (!result.profile) {
        setErrorMessage(result.error || 'Failed to initialize your account profile.');
        return;
      }

      cleanupRoleStorage();
      const authoritativeRole = result.profile.role;
      setIntendedRole(authoritativeRole);
      await refreshProfile();

      if (authoritativeRole === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        // Student navigation based on profile completeness
        if (!isStudentProfileComplete(result.profile)) {
          navigate('/student/profile-setup', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
      }
    };

    const processOAuthCallback = async () => {
      // 1. Check for error in query or hash params
      const errorParam = searchParams.get('error') || searchParams.get('error_description');
      if (errorParam) {
        setErrorMessage(decodeURIComponent(errorParam));
        return;
      }

      // Check hash fragment for errors (e.g. #error=access_denied&error_description=...)
      if (typeof window !== 'undefined' && window.location.hash.includes('error=')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashErr = hashParams.get('error_description') || hashParams.get('error');
        if (hashErr) {
          setErrorMessage(decodeURIComponent(hashErr));
          return;
        }
      }

      if (!isSupabaseConfigured()) {
        setErrorMessage('Authentication service is not configured.');
        return;
      }

      try {
        // 2. Fetch session (Supabase client automatically exchanges hash/code with detectSessionInUrl: true)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          await navigateForUser(session.user);
          return;
        }

        // 3. If session not ready immediately, listen to onAuthStateChange
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
          if (authSession?.user && isSubscribed && !handled) {
            await navigateForUser(authSession.user);
          }
        });

        // Fallback retry after 2s in case onAuthStateChange is delayed
        setTimeout(async () => {
          if (!handled && isSubscribed) {
            const {
              data: { session: retrySession },
            } = await supabase.auth.getSession();
            if (retrySession?.user) {
              await navigateForUser(retrySession.user);
            } else {
              navigate('/login', { replace: true });
            }
          }
          subscription.unsubscribe();
        }, 2000);
      } catch (err: any) {
        if (isSubscribed) {
          setErrorMessage(err?.message || 'Failed to complete OAuth authentication.');
        }
      }
    };

    processOAuthCallback();

    return () => {
      isSubscribed = false;
    };
  }, [navigate, searchParams, setIntendedRole, refreshProfile]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 text-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-[#0d5c58] flex items-center justify-center text-teal-200 mx-auto shadow-sm">
          <Compass className="w-8 h-8 text-teal-200" />
        </div>

        {roleMismatch ? (
          <div className="space-y-4 text-left animate-fadeIn">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Account Role Mismatch</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                This Google account is registered in CampusConnect as{' '}
                <strong className="font-semibold capitalize text-amber-950">
                  {roleMismatch.actualRole === 'student' ? 'Student' : 'Faculty / Staff'}
                </strong>
                . You selected the{' '}
                <span className="font-semibold capitalize text-red-700">
                  {roleMismatch.expectedRole === 'student' ? 'Student' : 'Faculty / Staff'}
                </span>{' '}
                portal.
              </p>
              <p className="text-[11px] text-amber-700">
                To protect your academic account, you cannot access this portal. Please sign in
                through your designated portal.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Link
                to={`/login?role=${roleMismatch.actualRole}`}
                className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors text-center flex items-center justify-center gap-2"
              >
                <span>
                  Go to {roleMismatch.actualRole === 'student' ? 'Student' : 'Faculty'} Portal
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center"
              >
                Return to Role Selection
              </Link>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Sign In Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer text-center"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-800">
              <Loader2 className="w-4 h-4 animate-spin text-[#0d5c58]" />
              <span>Authenticating with CampusConnect...</span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Verifying your credentials and loading your academic session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
