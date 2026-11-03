import React from 'react';
import { Users, SearchX, RotateCcw } from 'lucide-react';

interface FacultyEmptyStateProps {
  type: 'no-faculty' | 'no-match';
  onClearFilters?: () => void;
}

export const FacultyEmptyState: React.FC<FacultyEmptyStateProps> = ({
  type,
  onClearFilters,
}) => {
  if (type === 'no-faculty') {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-2xs text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0d5c58] flex items-center justify-center mx-auto border border-teal-100 shadow-2xs">
          <Users className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            No Faculty Members Registered Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Faculty availability records will automatically appear here in real time as college staff members register and broadcast their availability.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 max-w-sm mx-auto">
          Connected directly to Supabase cloud database. All availability indicators and location updates are authenticated.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-2xs text-center space-y-4 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200 shadow-2xs">
        <SearchX className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          No Faculty Matching Your Criteria
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          We could not find any faculty matching your active search keywords or filter selections. Try broadening your criteria or clearing filters.
        </p>
      </div>

      {onClearFilters && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-[#0d5c58] bg-teal-50 hover:bg-teal-100/80 border border-teal-200 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Active Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
