import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import type {
  TimetableEntry,
  TimetableFormData,
  DayOfWeek,
} from '../../types/staff.types';
import { DAYS_OF_WEEK } from '../../types/staff.types';
import { StaffService } from '../../services/staff.service';
import { validateTimetableEntryForm } from '../../utils/validation';

interface StaffTimetableManagerProps {
  userId: string;
  defaultDepartment?: string;
  timetable: TimetableEntry[];
  onTimetableUpdated: () => void;
}

export const StaffTimetableManager: React.FC<StaffTimetableManagerProps> = ({
  userId,
  defaultDepartment = '',
  timetable,
  onTimetableUpdated,
}) => {
  const [activeDayFilter, setActiveDayFilter] = useState<DayOfWeek | 'ALL'>('ALL');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<TimetableFormData>({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    subject: '',
    classroom: '',
    department: defaultDepartment || 'Computer Science',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Deletion confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = (day?: DayOfWeek) => {
    setFormData({
      day_of_week: day || (activeDayFilter === 'ALL' ? 'Monday' : activeDayFilter),
      start_time: '09:00',
      end_time: '10:00',
      subject: '',
      classroom: '',
      department: defaultDepartment || 'Computer Science',
    });
    setFormErrors({});
    setActionError(null);
    setModalMode('add');
    setEditingEntryId(null);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setFormData({
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      subject: entry.subject,
      classroom: entry.classroom,
      department: entry.department,
    });
    setFormErrors({});
    setActionError(null);
    setModalMode('edit');
    setEditingEntryId(entry.id);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingEntryId(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors = validateTimetableEntryForm(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (modalMode === 'add') {
        await StaffService.createTimetableEntry(userId, formData);
        setActionSuccess('Timetable class session added successfully!');
      } else if (modalMode === 'edit' && editingEntryId) {
        await StaffService.updateTimetableEntry(editingEntryId, formData);
        setActionSuccess('Timetable class session updated successfully!');
      }
      onTimetableUpdated();
      closeModal();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save timetable session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    setActionError(null);
    try {
      await StaffService.deleteTimetableEntry(entryId);
      setActionSuccess('Class session removed from timetable.');
      onTimetableUpdated();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete timetable entry.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter and sort entries
  const displayedEntries = (
    activeDayFilter === 'ALL'
      ? timetable
      : timetable.filter((e) => e.day_of_week === activeDayFilter)
  ).slice().sort((a, b) => {
    const dayOrder = DAYS_OF_WEEK.indexOf(a.day_of_week) - DAYS_OF_WEEK.indexOf(b.day_of_week);
    if (dayOrder !== 0) return dayOrder;
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs text-left space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Weekly Timetable Schedule
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {timetable.length} {timetable.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Configure your weekly lecture hours, laboratories, and departmental assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#0d5c58] hover:bg-[#094340] text-white shadow-sm transition-colors cursor-pointer self-start sm:self-center shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class Session</span>
        </button>
      </div>

      {/* Mandatory Disclaimer Requirement 5 */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Estimated Schedule Notice:</span> Timetable entries represent an estimated weekly schedule for informational guidance, never confirmed physical presence. Use the Availability tab above to broadcast live location and status.
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveDayFilter('ALL')}
          className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            activeDayFilter === 'ALL'
              ? 'bg-[#0d5c58] text-white border-[#0d5c58] shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Days ({timetable.length})
        </button>

        {DAYS_OF_WEEK.map((day) => {
          const count = timetable.filter((e) => e.day_of_week === day).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDayFilter(day)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                activeDayFilter === day
                  ? 'bg-[#0d5c58] text-white border-[#0d5c58] shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {day} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Timetable Entries List */}
      {displayedEntries.length === 0 ? (
        <div className="p-8 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0d5c58] flex items-center justify-center mx-auto border border-teal-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              No sessions scheduled for {activeDayFilter === 'ALL' ? 'the week' : activeDayFilter}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your lectures, lab practicals, or tutorial sessions so students know your expected hours.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#0d5c58]" />
            <span>Add Class for {activeDayFilter === 'ALL' ? 'Monday' : activeDayFilter}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/80 text-xs flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-teal-100/80 text-[#0d5c58] text-[10px] font-bold uppercase tracking-wider mb-1">
                      {entry.day_of_week}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {entry.subject}
                    </h4>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200/80 font-semibold text-teal-900 text-xs shadow-2xs shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#0d5c58]" />
                    {entry.start_time} - {entry.end_time}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-xs pt-1">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0d5c58]" />
                    {entry.classroom}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-600 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {entry.department}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => openEditModal(entry)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  title="Edit session"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={deletingId === entry.id}
                  onClick={() => handleDelete(entry.id)}
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                  title="Delete session"
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Timetable Modal Dialog */}
      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn text-left"
        >
          <div className="fixed inset-0" onClick={closeModal} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d5c58] flex items-center justify-center border border-teal-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {modalMode === 'add' ? 'Add Timetable Session' : 'Edit Timetable Session'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {actionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {actionError}
                </div>
              )}

              {/* Day of Week */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Day of Week</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) =>
                    setFormData({ ...formData, day_of_week: e.target.value as DayOfWeek })
                  }
                  className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Subject / Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                />
                {formErrors.subject && (
                  <p className="text-[11px] text-red-500">{formErrors.subject}</p>
                )}
              </div>

              {/* Classroom */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Classroom / Lab Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hall 302, CS Block or Networks Lab"
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                />
                {formErrors.classroom && (
                  <p className="text-[11px] text-red-500">{formErrors.classroom}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                />
                {formErrors.department && (
                  <p className="text-[11px] text-red-500">{formErrors.department}</p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                  />
                  {formErrors.start_time && (
                    <p className="text-[11px] text-red-500">{formErrors.start_time}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                  />
                  {formErrors.end_time && (
                    <p className="text-[11px] text-red-500">{formErrors.end_time}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl text-xs font-semibold bg-[#0d5c58] hover:bg-[#094340] text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'add' ? 'Add Session' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
