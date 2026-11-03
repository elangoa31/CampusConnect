import React from 'react';
import { Users, CheckCircle2, Clock, Sparkles, ArrowRight } from 'lucide-react';
import type { FacultyStats } from '../../types/faculty.types';

interface DashboardOverviewCardsProps {
  stats: FacultyStats;
  onFilterByStatus?: (status: string) => void;
}

export const DashboardOverviewCards: React.FC<DashboardOverviewCardsProps> = ({
  stats,
  onFilterByStatus,
}) => {
  const cards = [
    {
      title: 'Total Faculty',
      count: stats.total,
      subtitle: 'Registered departments',
      icon: Users,
      bgColor: 'bg-teal-50',
      iconColor: 'text-[#0d5c58]',
      borderColor: 'border-teal-100/80',
      statusFilter: 'ALL',
    },
    {
      title: 'Available Faculty',
      count: stats.available,
      subtitle: 'Ready for meeting',
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100/80',
      statusFilter: 'AVAILABLE',
      indicatorClass: 'bg-emerald-500',
    },
    {
      title: 'Currently Busy',
      count: stats.busy,
      subtitle: 'In class or occupied',
      icon: Clock,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-100/80',
      statusFilter: 'BUSY',
      indicatorClass: 'bg-rose-500',
    },
    {
      title: 'Recently Updated',
      count: stats.recentlyUpdated ?? 0,
      subtitle: 'Broadcast within 24h',
      icon: Sparkles,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100/80',
      statusFilter: 'RECENTLY_UPDATED',
      indicatorClass: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isClickable = Boolean(onFilterByStatus);

        return (
          <div
            key={card.title}
            onClick={() => {
              if (isClickable && onFilterByStatus) {
                onFilterByStatus(card.statusFilter);
              }
            }}
            className={`bg-white rounded-2xl p-5 border ${card.borderColor} shadow-2xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between group ${
              isClickable ? 'cursor-pointer hover:-translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${card.bgColor} ${card.iconColor} flex items-center justify-center`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.count}
              </span>
              {card.indicatorClass && (
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className={`w-2 h-2 rounded-full ${card.indicatorClass}`} />
                </span>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{card.subtitle}</span>
              {isClickable && (
                <span className="text-[#0d5c58] opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-0.5 transition-opacity">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
