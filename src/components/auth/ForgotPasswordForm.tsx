import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { AuthInput } from './AuthInput';
import type { ForgotPasswordFormData, AuthValidationErrors } from '../../types/auth.types';
import { validateForgotPasswordForm } from '../../utils/validation';

export const ForgotPasswordForm: React.FC = () => {
  const { resetPassword, isLoading } = useAuth();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });

  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForgotPasswordForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(formData.email);
      setIsSent(true);
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-left">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">
          FORGOT PASSWORD?
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
          Enter your registered college email to reset your password.
        </p>
      </div>

      {isSent ? (
        <div className="space-y-4 py-2 animate-fadeIn text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">
              Reset Link Sent
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              We have sent a password recovery link to{' '}
              <span className="font-semibold text-slate-800">{formData.email}</span>.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-500 space-y-1">
            <p>• Check your inbox and spam folder.</p>
            <p>• Follow the instructions in the email to set a new password.</p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsSent(false)}
              className="text-xs text-[#0d5c58] hover:underline font-medium"
            >
              Didn&apos;t receive it? Try another email
            </button>
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 text-center"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthInput
            label="College Email"
            type="email"
            placeholder="Enter your college email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ email: e.target.value });
              if (errors.email) setErrors({});
            }}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            disabled={isLoading || isSubmitting}
          />

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] active:bg-[#073634] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending reset link...</span>
              </>
            ) : (
              'Send reset link'
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d5c58] hover:text-[#094340] hover:underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
