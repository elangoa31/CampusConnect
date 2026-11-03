import React from 'react';
import type { AvailabilityStatus } from '../../types/faculty.types';

interface FacultyStatusBadgeProps {
  status: AvailabilityStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const FacultyStatusBadge: React.FC<FacultyStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  // Requirement 5 Color Mapping:
  // AVAILABLE – Green
  // BUSY – Red
  // IN CLASS – Blue
  // ON LEAVE – Orange
  // UNKNOWN – Grey
  const configMap: Record<
    AvailabilityStatus,
    {
      label: string;
      bgClass: string;
      textClass: string;
      borderClass: string;
      dotClass: string;
      pulse?: boolean;
    }
  > = {
    AVAILABLE: {
      label: 'AVAILABLE',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200/80',
      dotClass: 'bg-emerald-500',
      pulse: true,
    },
    BUSY: {
      label: 'BUSY',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
      borderClass: 'border-rose-200/80',
      dotClass: 'bg-rose-500',
    },
    'IN CLASS': {
      label: 'IN CLASS',
      bgClass: 'bg-sky-50',
      textClass: 'text-sky-700',
      borderClass: 'border-sky-200/80',
      dotClass: 'bg-sky-500',
    },
    'ON LEAVE': {
      label: 'ON LEAVE',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-200/80',
      dotClass: 'bg-amber-500',
    },
    UNKNOWN: {
      label: 'UNKNOWN',
      bgClass: 'bg-slate-100',
      textClass: 'text-slate-600',
      borderClass: 'border-slate-200',
      dotClass: 'bg-slate-400',
    },
  };

  const current = configMap[status] || configMap.UNKNOWN;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded-full border shadow-2xs transition-colors ${current.bgClass} ${current.textClass} ${current.borderClass} ${sizeClasses}`}
    >
      <span className="relative flex">
        {current.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizes} ${current.dotClass}`}
        />
      </span>
      <span>{current.label}</span>
    </span>
  );
};
