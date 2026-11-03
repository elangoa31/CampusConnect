import React from 'react';

interface FacultySkeletonGridProps {
  count?: number;
}

export const FacultySkeletonGrid: React.FC<FacultySkeletonGridProps> = ({
  count = 6,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4 text-left"
        >
          {/* Top: Avatar + Title + Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200" />
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-slate-200 rounded-md" />
                <div className="w-20 h-3 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="w-20 h-6 bg-slate-100 rounded-full" />
          </div>

          {/* Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="w-3/4 h-3 bg-slate-100 rounded-md" />
            <div className="w-1/2 h-3 bg-slate-100 rounded-md" />
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="w-24 h-3 bg-slate-100 rounded-md" />
            <div className="w-16 h-3 bg-slate-100 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
