import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../services/auth.service';
import { isStudentProfileComplete } from '../../utils/validation';
import { useAuth } from '../../context/useAuth';
import type { UserRole } from '../../types/auth.types';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIntendedRole, refreshProfile } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    let handled = false;

    const navigateForUser = async (activeUser: any) => {
      if (handled || !isSubscribed) return;
      handled = true;

      // Identify intended role
      const paramRole = searchParams.get('role') as UserRole | null;
      const sessionRole = typeof sessionStorage !== 'undefined'
        ? (sessionStorage.getItem('campusconnect_intended_role') as UserRole | null)
        : null;
      const metaRole = activeUser.user_metadata?.role as UserRole | null;

      const targetRole: UserRole = paramRole || sessionRole || metaRole || 'student';
      setIntendedRole(targetRole);

      // Retrieve live profile
      const profile = await AuthService.getCurrentProfile(activeUser.id, activeUser);
      await refreshProfile();

      const resolvedRole = profile?.role || targetRole;

      if (resolvedRole === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        // Student navigation
        if (!isStudentProfileComplete(profile || activeUser.user_metadata)) {
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          await navigateForUser(session.user);
          return;
        }

        // 3. If session not ready immediately, listen to onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, authSession) => {
            if (authSession?.user && isSubscribed && !handled) {
              await navigateForUser(authSession.user);
            }
          }
        );

        // Fallback retry after 2s in case onAuthStateChange is delayed
        setTimeout(async () => {
          if (!handled && isSubscribed) {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
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

        {errorMessage ? (
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
