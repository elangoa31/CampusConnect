import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Building2,
  Hash,
  BookOpen,
  Briefcase,
  BadgeCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { RoleSelector } from './RoleSelector';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import type { SignupFormData, AuthValidationErrors, UserRole } from '../../types/auth.types';
import { validateSignupForm } from '../../utils/validation';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, intendedRole, setIntendedRole } = useAuth();

  const roleQuery = searchParams.get('role');
  const initialRole: UserRole = (roleQuery === 'student' || roleQuery === 'staff')
    ? roleQuery
    : (intendedRole || 'student');

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    role: initialRole,
    department: '',
    registerNumber: '',
    yearOfStudy: '',
    employeeId: '',
    designation: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!registeredSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/login?role=${formData.role}&registered=true`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [registeredSuccess, formData.role, navigate]);

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
    setIntendedRole(role);
    setSubmitError(null);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.role;
      delete newErrors.registerNumber;
      delete newErrors.yearOfStudy;
      delete newErrors.employeeId;
      delete newErrors.designation;
      return newErrors;
    });
  };

  const handleChange = (field: keyof SignupFormData, value: string) => {
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

    const validationErrors = validateSignupForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError('Please complete all required fields correctly before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData);
      setRegisteredSuccess(true);
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="w-full text-center space-y-4 py-4 animate-fadeIn">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            REGISTRATION COMPLETE
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            Your {formData.role === 'staff' ? 'Faculty' : 'Student'} account has been created for{' '}
            <span className="font-semibold text-slate-800">{formData.email}</span>.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Name:</span>
            <span className="font-medium text-slate-800">{formData.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Role:</span>
            <span className="font-medium capitalize text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px]">
              {formData.role}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Department:</span>
            <span className="font-medium text-slate-800">{formData.department}</span>
          </div>
          {formData.role === 'student' && formData.registerNumber && (
            <div className="flex justify-between">
              <span className="text-slate-400">Register No:</span>
              <span className="font-medium text-slate-800">{formData.registerNumber}</span>
            </div>
          )}
          {formData.role === 'student' && formData.yearOfStudy && (
            <div className="flex justify-between">
              <span className="text-slate-400">Year of Study:</span>
              <span className="font-medium text-slate-800">{formData.yearOfStudy}</span>
            </div>
          )}
          {formData.role === 'staff' && formData.employeeId && (
            <div className="flex justify-between">
              <span className="text-slate-400">Employee ID:</span>
              <span className="font-medium text-slate-800">{formData.employeeId}</span>
            </div>
          )}
          {formData.role === 'staff' && formData.designation && (
            <div className="flex justify-between">
              <span className="text-slate-400">Designation:</span>
              <span className="font-medium text-slate-800">{formData.designation}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
          Redirecting to {formData.role === 'staff' ? 'faculty' : 'student'} login in {countdown}s...
        </p>

        <Link
          to={`/login?role=${formData.role}&registered=true`}
          className="inline-block w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 text-center"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 text-left">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] uppercase">
          CREATE ACCOUNT
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-normal">
          Join your campus community.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Role Selection */}
        <RoleSelector
          selectedRole={formData.role}
          onChange={handleRoleChange}
          disabled={isSubmitting}
        />

        {/* Full Name */}
        <AuthInput
          label="Full Name"
          type="text"
          placeholder="e.g. Dr. Jane Smith or Alex Johnson"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="name"
          disabled={isSubmitting}
        />

        {/* College Email */}
        <AuthInput
          label="College Email"
          type="email"
          placeholder="yourname@college.edu"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          disabled={isSubmitting}
        />

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

        {/* Student-specific conditional fields */}
        {formData.role === 'student' && (
          <div className="space-y-3.5 pt-0.5">
            <AuthInput
              label="Register Number"
              type="text"
              placeholder="e.g. 717821F101"
              value={formData.registerNumber || ''}
              onChange={(e) => handleChange('registerNumber', e.target.value)}
              error={errors.registerNumber}
              leftIcon={<Hash className="w-4 h-4" />}
              disabled={isSubmitting}
            />

            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                Year of Study
              </label>
              <div className="relative">
                <select
                  value={formData.yearOfStudy || ''}
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
          </div>
        )}

        {/* Staff-specific conditional fields */}
        {formData.role === 'staff' && (
          <div className="space-y-3.5 pt-0.5">
            <AuthInput
              label="Employee ID"
              type="text"
              placeholder="e.g. EMP-2041"
              value={formData.employeeId || ''}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              error={errors.employeeId}
              leftIcon={<BadgeCheck className="w-4 h-4" />}
              disabled={isSubmitting}
            />

            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                Designation
              </label>
              <div className="relative">
                <select
                  value={formData.designation || ''}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full text-sm text-slate-900 bg-white border rounded-xl py-2.5 px-3.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] appearance-none ${
                    errors.designation
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <option value="">Select Designation</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                  <option value="Dean">Dean / Director</option>
                  <option value="Lab Instructor / Technical Staff">Lab Instructor / Technical Staff</option>
                </select>
                <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              {errors.designation && (
                <p className="text-xs text-red-500 font-medium">{errors.designation}</p>
              )}
            </div>
          </div>
        )}

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          showStrengthMeter={true}
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          placeholder="Repeat your password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        {/* Form-level Error Alert */}
        {submitError && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{submitError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] active:bg-[#073634] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Switch to Signin */}
      <div className="mt-4 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link
          to={`/login?role=${formData.role}`}
          className="font-semibold text-[#0d5c58] hover:text-[#094340] hover:underline transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};
