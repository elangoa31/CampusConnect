import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import type { FacultyFilters } from '../../types/faculty.types';

interface FacultyFiltersBarProps {
  filters: FacultyFilters;
  onChange: (filters: FacultyFilters) => void;
  departments: string[];
  designations: string[];
  totalResults: number;
  totalFaculty: number;
}

export const FacultyFiltersBar: React.FC<FacultyFiltersBarProps> = ({
  filters,
  onChange,
  departments,
  designations,
  totalResults,
  totalFaculty,
}) => {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.department !== 'ALL' ||
    filters.designation !== 'ALL' ||
    filters.availability !== 'ALL';

  const handleClear = () => {
    onChange({
      searchQuery: '',
      department: 'ALL',
      designation: 'ALL',
      availability: 'ALL',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4 text-left">
      {/* Top Row: Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) =>
            onChange({ ...filters, searchQuery: e.target.value })
          }
          placeholder="Search faculty by name, department, or office location..."
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/20 focus:border-[#0d5c58] transition-colors placeholder:text-slate-400 text-slate-900"
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, searchQuery: '' })}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Row: Filter Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={filters.department}
              onChange={(e) =>
                onChange({ ...filters, department: e.target.value })
              }
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/20 focus:border-[#0d5c58] appearance-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div className="relative">
            <select
              value={filters.designation}
              onChange={(e) =>
                onChange({ ...filters, designation: e.target.value })
              }
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/20 focus:border-[#0d5c58] appearance-none cursor-pointer"
            >
              <option value="ALL">All Designations</option>
              {designations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="relative">
            <select
              value={filters.availability}
              onChange={(e) =>
                onChange({ ...filters, availability: e.target.value })
              }
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/20 focus:border-[#0d5c58] appearance-none cursor-pointer"
            >
              <option value="ALL">All Availability Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="IN CLASS">In Class</option>
              <option value="ON LEAVE">On Leave</option>
              <option value="UNKNOWN">Unknown Status</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button & Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing <strong className="text-slate-800">{totalResults}</strong> of {totalFaculty}
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
