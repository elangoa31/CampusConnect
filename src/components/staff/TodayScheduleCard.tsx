import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import type { TimetableEntry } from '../../types/staff.types';
import { StaffService } from '../../services/staff.service';

interface TodayScheduleCardProps {
  timetable: TimetableEntry[];
  onOpenTimetableTab: () => void;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  timetable,
  onOpenTimetableTab,
}) => {
  const { dayName, todayClasses } = StaffService.getTodaySchedule(timetable);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs text-left space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0d5c58] flex items-center justify-center border border-teal-100 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Today's Schedule
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {dayName} ({todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'})
              </span>
            </div>
          </div>

          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Estimated
          </span>
        </div>

        {/* Schedule list */}
        {todayClasses.length === 0 ? (
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700">
              No classes scheduled for {dayName}
            </p>
            <p className="text-[11px] text-slate-400">
              You are free for office hours, research, or department meetings.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {todayClasses.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 text-xs flex items-center justify-between gap-2 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold text-slate-900 block truncate">
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#0d5c58]" />
                      {item.classroom}
                    </span>
                    <span>•</span>
                    <span className="truncate">{item.department}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 font-semibold text-teal-900 text-xs bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/70">
                    <Clock className="w-3 h-3 text-[#0d5c58]" />
                    {item.start_time} - {item.end_time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer link to manage full timetable */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onOpenTimetableTab}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#0d5c58] hover:text-[#094340] hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
        >
          <span>View & Edit Weekly Timetable</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
