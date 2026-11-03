import React, { type InputHTMLAttributes, forwardRef } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightSlot,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `auth-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-wider text-slate-700 uppercase"
        >
          {label}
        </label>
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full text-sm text-slate-900 bg-white border rounded-xl py-2.5 transition-colors duration-150 placeholder:text-slate-400 placeholder:text-xs md:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightSlot ? 'pr-11' : 'pr-3.5'} ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 hover:border-slate-300'
            } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${className}`}
            {...props}
          />
          {rightSlot && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightSlot}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500 font-medium mt-0.5">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
