import React from 'react';
import { Clock, CheckCircle2, XCircle, Ban, CheckCheck } from 'lucide-react';
import type { MeetingStatus } from '../../types/meeting.types';

interface MeetingStatusBadgeProps {
  status: MeetingStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const MeetingStatusBadge: React.FC<MeetingStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getBadgeConfig = (st: MeetingStatus) => {
    switch (st) {
      case 'ACCEPTED':
        return {
          label: 'Accepted',
          icon: CheckCircle2,
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500',
        };
      case 'PENDING':
        return {
          label: 'Pending',
          icon: Clock,
          bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
          dotColor: 'bg-amber-500 animate-pulse',
        };
      case 'REJECTED':
        return {
          label: 'Declined',
          icon: XCircle,
          bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
          dotColor: 'bg-rose-500',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: Ban,
          bgColor: 'bg-slate-100 text-slate-600 border-slate-200',
          dotColor: 'bg-slate-400',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: CheckCheck,
          bgColor: 'bg-teal-50 text-teal-800 border-teal-200',
          dotColor: 'bg-[#0d5c58]',
        };
      default:
        return {
          label: st,
          icon: Clock,
          bgColor: 'bg-slate-50 text-slate-600 border-slate-200',
          dotColor: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide rounded-full border shadow-2xs ${config.bgColor} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <Icon className={iconSizes} />
      <span>{config.label}</span>
    </span>
  );
};
