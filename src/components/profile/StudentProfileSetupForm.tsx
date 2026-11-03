import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Building2,
  Hash,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { AuthInput } from '../auth/AuthInput';
import type { StudentProfileFormData, AuthValidationErrors } from '../../types/auth.types';
import { validateStudentProfileForm } from '../../utils/validation';

export const StudentProfileSetupForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const { user, profile, updateStudentProfile, signOut } = useAuth();

  const [formData, setFormData] = useState<StudentProfileFormData>(() => {
    const email = profile?.email || user?.email || '';
    const fullName =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      '';

    const existingDept =
      profile?.department &&
      profile.department !== 'General' &&
      profile.department !== 'Not specified'
        ? profile.department
        : (user?.user_metadata?.department && user.user_metadata.department !== 'General'
            ? user.user_metadata.department
            : '');

    const existingReg =
      profile?.register_number && profile.register_number !== 'N/A'
        ? profile.register_number
        : (user?.user_metadata?.register_number && user.user_metadata.register_number !== 'N/A'
            ? user.user_metadata.register_number
            : '');

    const existingYear =
      profile?.year_of_study && profile.year_of_study !== 'N/A'
        ? profile.year_of_study
        : (user?.user_metadata?.year_of_study && user.user_metadata.year_of_study !== 'N/A'
            ? user.user_metadata.year_of_study
            : '');

    return {
      fullName,
      email,
      department: existingDept,
      registerNumber: existingReg,
      yearOfStudy: existingYear,
    };
  });

  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof StudentProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateStudentProfileForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError('Please complete all required fields correctly before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStudentProfile({
        fullName: formData.fullName,
        department: formData.department,
        registerNumber: formData.registerNumber,
        yearOfStudy: formData.yearOfStudy,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/student/dashboard', { replace: true });
      }, 700);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save student profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Portal Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-50 text-[#0d5c58] border border-teal-200/60 shadow-sm">
          <GraduationCap className="w-3.5 h-3.5 text-[#0d5c58]" />
          <span>Student Portal</span>
        </span>

        {isEditMode ? (
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#0d5c58] hover:underline font-medium transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Dashboard</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => signOut()}
            className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline font-medium transition-colors cursor-pointer"
          >
            Switch account
          </button>
        )}
      </div>

      {/* Header */}
      <div className="mb-5 text-left">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">
          {isEditMode ? 'EDIT PROFILE' : 'PROFILE SETUP'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-normal">
          {isEditMode
            ? 'Update your academic and personal information.'
            : 'Complete your profile to access real-time faculty availability.'}
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div
          role="status"
          className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Profile saved successfully! Redirecting to student dashboard...
          </span>
        </div>
      )}

      {/* Error Alert */}
      {submitError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{submitError}</span>
        </div>
      )}

      {/* Setup Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <AuthInput
          label="Full Name"
          type="text"
          placeholder="e.g. Alex Johnson"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="name"
          disabled={isSubmitting}
        />

        {/* College Email (Read-only from Google/Auth) */}
        <div className="text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
              College Email
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-medium bg-teal-50 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              Verified Identity
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={formData.email}
              disabled={true}
              readOnly={true}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100/80 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed select-none font-medium"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Account email linked to your authenticated session.
          </p>
        </div>

        {/* Department */}
        <AuthInput
          label="Department"
          type="text"
          placeholder="e.g. Computer Science & Engineering"
          value={formData.department}
          onChange={(e) => handleChange('department', e.target.value)}
          error={errors.department}
          leftIcon={<Building2 className="w-4 h-4" />}
          disabled={isSubmitting}
        />

        {/* Register Number */}
        <AuthInput
          label="Register Number"
          type="text"
          placeholder="e.g. 717821F101"
          value={formData.registerNumber}
          onChange={(e) => handleChange('registerNumber', e.target.value)}
          error={errors.registerNumber}
          leftIcon={<Hash className="w-4 h-4" />}
          disabled={isSubmitting}
        />

        {/* Year of Study */}
        <div className="text-left space-y-1.5">
          <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
            Year of Study
          </label>
          <div className="relative">
            <select
              value={formData.yearOfStudy}
              onChange={(e) => handleChange('yearOfStudy', e.target.value)}
              disabled={isSubmitting}
              className={`w-full text-sm text-slate-900 bg-white border rounded-xl py-2.5 px-3.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] appearance-none ${
                errors.yearOfStudy
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <option value="">Select Year of Study</option>
              <option value="1st Year">1st Year (Freshman)</option>
              <option value="2nd Year">2nd Year (Sophomore)</option>
              <option value="3rd Year">3rd Year (Junior)</option>
              <option value="4th Year">4th Year (Senior)</option>
              <option value="Postgraduate">Postgraduate / Research</option>
            </select>
            <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          {errors.yearOfStudy && (
            <p className="text-xs text-red-500 font-medium">{errors.yearOfStudy}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={isSubmitting || saveSuccess}
            aria-busy={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] active:bg-[#073634] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving profile...</span>
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Complete Setup & Continue'
            )}
          </button>

          {isEditMode && (
            <Link
              to="/student/dashboard"
              className="block w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};
