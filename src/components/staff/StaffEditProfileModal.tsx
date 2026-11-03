import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Briefcase,
  IdCard,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { StaffProfile, StaffProfileFormData } from '../../types/staff.types';
import { StaffService } from '../../services/staff.service';
import { validateStaffProfileForm } from '../../utils/validation';

interface StaffEditProfileModalProps {
  profile: StaffProfile | null;
  onClose: () => void;
  onProfileUpdated: (updatedProfile: StaffProfile) => void;
}

export const StaffEditProfileModal: React.FC<StaffEditProfileModalProps> = ({
  profile,
  onClose,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState<StaffProfileFormData>({
    fullName: profile?.full_name || '',
    department:
      profile?.department && profile.department !== 'Not specified'
        ? profile.department
        : '',
    employeeId:
      profile?.employee_id && profile.employee_id !== 'Not provided'
        ? profile.employee_id
        : '',
    designation:
      profile?.designation && profile.designation !== 'Not specified'
        ? profile.designation
        : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const validate = (): boolean => {
    const errs = validateStaffProfileForm({
      ...formData,
      email: profile?.email,
    });
    setErrors(errs as Record<string, string>);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await StaffService.updateStaffProfile(profile.id, formData);
      onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const designationOptions = [
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Head of Department (HOD)',
    'Dean',
    'Visiting Faculty',
    'Lab Instructor',
    'Technical Officer',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn text-left font-sans"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d5c58] flex items-center justify-center border border-teal-100">
              <User className="w-4 h-4" />
            </div>
            <h3 id="edit-profile-title" className="font-bold text-base text-slate-900">
              Edit Faculty Profile
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Arthur Pendelton"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* College Email (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>College Email</span>
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400">Email is linked to your authentication account</span>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Department <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Science & Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
            />
            {errors.department && (
              <p className="text-[11px] text-red-500">{errors.department}</p>
            )}
          </div>

          {/* Employee ID */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <IdCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Employee ID <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              placeholder="e.g. EMP-2024-041"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
            />
            {errors.employeeId && (
              <p className="text-[11px] text-red-500">{errors.employeeId}</p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Designation <span className="text-red-500">*</span></span>
            </label>
            <div className="space-y-2">
              <select
                value={
                  designationOptions.includes(formData.designation)
                    ? formData.designation
                    : 'Other'
                }
                onChange={(e) => {
                  if (e.target.value !== 'Other') {
                    setFormData({ ...formData, designation: e.target.value });
                  } else {
                    setFormData({ ...formData, designation: '' });
                  }
                }}
                className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
              >
                {designationOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>

              {(!designationOptions.includes(formData.designation) ||
                formData.designation === '') && (
                <input
                  type="text"
                  placeholder="Enter custom designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                />
              )}
            </div>
            {errors.designation && (
              <p className="text-[11px] text-red-500">{errors.designation}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-[#0d5c58] hover:bg-[#094340] text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
