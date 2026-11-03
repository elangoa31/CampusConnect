import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { getPasswordStrength } from '../../utils/validation';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  showStrengthMeter?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, value, onChange, showStrengthMeter = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const passwordStr = typeof value === 'string' ? value : '';
    const strength = showStrengthMeter && passwordStr ? getPasswordStrength(passwordStr) : null;

    const strengthColor = (score: number) => {
      switch (score) {
        case 1:
          return 'bg-red-400';
        case 2:
          return 'bg-amber-400';
        case 3:
          return 'bg-blue-400';
        case 4:
          return 'bg-emerald-500';
        default:
          return 'bg-slate-200';
      }
    };

    return (
      <div className="w-full space-y-1">
        <AuthInput
          label={label}
          type={showPassword ? 'text' : 'password'}
          ref={ref}
          value={value}
          onChange={onChange}
          error={error}
          leftIcon={<Lock className="w-4 h-4" />}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-[#0f766e] transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
          {...props}
        />

        {showStrengthMeter && passwordStr.length > 0 && strength && (
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Password strength:</span>
              <span className="font-semibold text-slate-700">{strength.feedback}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-all duration-300 ${
                    strength.score >= step
                      ? strengthColor(strength.score)
                      : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Must be at least 8 characters with letters, numbers, and symbols
            </p>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
