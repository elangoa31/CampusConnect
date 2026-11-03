import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, GraduationCap, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import type { LoginFormData, AuthValidationErrors, UserRole } from '../../types/auth.types';
import { validateLoginForm, isStudentProfileComplete } from '../../utils/validation';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signInWithGoogle, intendedRole, setIntendedRole } = useAuth();

  // Determine portal role from query param or auth state
  const roleQuery = searchParams.get('role');
  const activePortalRole: UserRole = (roleQuery === 'student' || roleQuery === 'staff')
    ? roleQuery
    : (intendedRole || 'student');

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isJustRegistered = searchParams.get('registered') === 'true';

  const handleChange = (field: keyof LoginFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (loginError) {
      setLoginError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoginError('Please enter your college email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Login with strict server database role verification
      const verifiedProfile = await login(formData, activePortalRole);
      
      // Navigate to respective dashboard placeholder or profile setup
      if (verifiedProfile?.role === 'staff') {
        navigate('/staff/dashboard');
      } else if (!isStudentProfileComplete(verifiedProfile)) {
        navigate('/student/profile-setup');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoginError(null);
      await signInWithGoogle(activePortalRole);
    } catch (err: any) {
      setLoginError(err?.message || 'Google sign-in could not be initiated.');
    }
  };

  return (
    <div className="w-full">
      {/* Portal Role Indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-50 text-[#0d5c58] border border-teal-200/60 shadow-sm">
          {activePortalRole === 'student' ? (
            <GraduationCap className="w-3.5 h-3.5 text-[#0d5c58]" />
          ) : (
            <Briefcase className="w-3.5 h-3.5 text-[#0d5c58]" />
          )}
          <span>{activePortalRole === 'student' ? 'Student Portal' : 'Faculty Portal'}</span>
        </span>
        <Link
          to="/"
          onClick={() => setIntendedRole(null)}
          className="text-[11px] text-slate-500 hover:text-[#0d5c58] hover:underline font-medium transition-colors"
        >
          Change role
        </Link>
      </div>

      {/* Header */}
      <div className="mb-5 text-left">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">
          WELCOME BACK
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-normal">
          Welcome back! Please enter your details.
        </p>
      </div>

      {/* Post-Registration Success Banner */}
      {isJustRegistered && (
        <div
          role="status"
          className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">
            Registration successful! Please sign in with your college email and password.
          </span>
        </div>
      )}

      {/* Login Error Banner */}
      {loginError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{loginError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <AuthInput
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your college email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          disabled={isSubmitting}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between pt-0.5 pb-1">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-slate-300 text-[#0f766e] focus:ring-[#0f766e]/30 focus:ring-offset-0 transition-colors"
            />
            <span className="text-xs text-slate-600 font-medium">Remember me</span>
          </label>

          <Link
            to={`/forgot-password?role=${activePortalRole}`}
            className="text-xs font-medium text-[#0f766e] hover:text-[#115e59] hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary Button: Dark teal */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] active:bg-[#073634] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Secondary Button: Sign in with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          to={`/signup?role=${activePortalRole}`}
          className="font-semibold text-[#0d5c58] hover:text-[#094340] hover:underline transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
};
