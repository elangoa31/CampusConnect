import React from 'react';
import type { UserRole } from '../../types/auth.types';
import { GraduationCap, Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
        I am a
      </label>
      <div 
        role="radiogroup" 
        aria-label="Select user role" 
        className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200"
      >
        <button
          type="button"
          role="radio"
          aria-checked={selectedRole === 'student'}
          disabled={disabled}
          onClick={() => onChange('student')}
          className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 ${
            selectedRole === 'student'
              ? 'bg-white text-[#0f766e] shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={selectedRole === 'staff'}
          disabled={disabled}
          onClick={() => onChange('staff')}
          className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 ${
            selectedRole === 'staff'
              ? 'bg-white text-[#0f766e] shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Staff</span>
        </button>
      </div>
    </div>
  );
};
