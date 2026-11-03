import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Radio,
  Sparkles,
} from 'lucide-react';
import type {
  StaffProfile,
  AvailabilityUpdatePayload,
  CampusLocationPreset,
} from '../../types/staff.types';
import { LOCATION_PRESETS } from '../../types/staff.types';
import type { AvailabilityStatus } from '../../types/faculty.types';
import { StaffService } from '../../services/staff.service';
import { FacultyStatusBadge } from '../dashboard/FacultyStatusBadge';
import { formatRelativeTime } from '../../services/faculty.service';

interface StaffAvailabilityManagerProps {
  profile: StaffProfile | null;
  onAvailabilityUpdated: (updatedProfile: StaffProfile) => void;
}

export const StaffAvailabilityManager: React.FC<StaffAvailabilityManagerProps> = ({
  profile,
  onAvailabilityUpdated,
}) => {
  const getInitialLocation = () => {
    const existingLoc = profile?.location || '';
    const matchedPreset = LOCATION_PRESETS.find((p) => existingLoc.startsWith(p));
    if (matchedPreset) {
      const remainder = existingLoc
        .replace(matchedPreset, '')
        .replace(/^(\s*[-:]?\s*|\s*\(\s*)/, '')
        .replace(/\)\s*$/, '')
        .trim();
      return { preset: matchedPreset as CampusLocationPreset | 'Custom', details: remainder };
    }
    return {
      preset: existingLoc ? ('Custom' as const) : ('Department Office' as const),
      details: existingLoc,
    };
  };

  const initialLoc = getInitialLocation();
  const [status, setStatus] = useState<AvailabilityStatus>(
    profile?.availability_status || 'UNKNOWN'
  );
  const [selectedPreset, setSelectedPreset] = useState<CampusLocationPreset | 'Custom'>(
    initialLoc.preset
  );
  const [locationDetails, setLocationDetails] = useState<string>(initialLoc.details);
  const [statusMessage, setStatusMessage] = useState<string>(profile?.status_message || '');
  const [startTime, setStartTime] = useState<string>(profile?.status_start_time || '');
  const [endTime, setEndTime] = useState<string>(profile?.status_end_time || '');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleStatusSelect = (newStatus: AvailabilityStatus) => {
    setStatus(newStatus);
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Compute location string
    let finalLocation = '';
    if (selectedPreset === 'Custom') {
      finalLocation = locationDetails.trim();
    } else if (locationDetails.trim()) {
      finalLocation = `${selectedPreset} - ${locationDetails.trim()}`;
    } else {
      finalLocation = selectedPreset;
    }

    const payload: AvailabilityUpdatePayload = {
      availability_status: status,
      location: finalLocation || undefined,
      status_message: statusMessage.trim() || undefined,
      status_start_time: startTime.trim() || undefined,
      status_end_time: endTime.trim() || undefined,
    };

    try {
      const updated = await StaffService.updateAvailability(profile.id, payload);
      onAvailabilityUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update availability. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: {
    id: AvailabilityStatus;
    label: string;
    description: string;
    color: string;
    ringColor: string;
    activeBg: string;
  }[] = [
    {
      id: 'AVAILABLE',
      label: 'AVAILABLE',
      description: 'Present in office / lab and open for student discussions and consultations.',
      color: 'text-emerald-700 border-emerald-300',
      ringColor: 'ring-emerald-500',
      activeBg: 'bg-emerald-50/90 border-emerald-500 shadow-sm',
    },
    {
      id: 'BUSY',
      label: 'BUSY',
      description: 'Occupied with department duties, research, evaluation, or meetings.',
      color: 'text-rose-700 border-rose-300',
      ringColor: 'ring-rose-500',
      activeBg: 'bg-rose-50/90 border-rose-500 shadow-sm',
    },
    {
      id: 'IN CLASS',
      label: 'IN CLASS',
      description: 'Actively lecturing or conducting laboratory sessions with students.',
      color: 'text-sky-700 border-sky-300',
      ringColor: 'ring-sky-500',
      activeBg: 'bg-sky-50/90 border-sky-500 shadow-sm',
    },
    {
      id: 'ON LEAVE',
      label: 'ON LEAVE',
      description: 'Away on duty (OD), conference, medical, or approved academic leave.',
      color: 'text-amber-700 border-amber-300',
      ringColor: 'ring-amber-500',
      activeBg: 'bg-amber-50/90 border-amber-500 shadow-sm',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs text-left space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Availability & Location Broadcasting
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0d5c58] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Broadcast
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Broadcast your real-time status and campus room to students. Changes reflect instantly on the student portal.
          </p>
        </div>

        {/* Current active status summary pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs text-slate-500 font-medium">Currently:</span>
          <FacultyStatusBadge status={profile?.availability_status || 'UNKNOWN'} size="md" />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Status Selection Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            1. Select Availability Status <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {statusOptions.map((opt) => {
              const isSelected = status === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleStatusSelect(opt.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? opt.activeBg + ' ring-2 ' + opt.ringColor
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs tracking-wider">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#0d5c58]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Campus Location Selection (No GPS) */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0d5c58]" />
              <span>2. Current Campus Location</span>
            </label>
            <span className="text-[11px] text-slate-400 font-normal">
              Manual entry only (No GPS tracking)
            </span>
          </div>

          {/* Location Preset Chips */}
          <div className="flex flex-wrap gap-2">
            {LOCATION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setSaveSuccess(false);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedPreset === preset
                    ? 'bg-[#0d5c58] text-white border-[#0d5c58] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedPreset('Custom');
                setSaveSuccess(false);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedPreset === 'Custom'
                  ? 'bg-[#0d5c58] text-white border-[#0d5c58] shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              Other / Custom
            </button>
          </div>

          {/* Specific Room / Cabin / Details Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={
                selectedPreset === 'Custom'
                  ? 'Enter custom campus location (e.g. Auditorium Hall B, 2nd Floor)'
                  : `Specify room / cabin details for ${selectedPreset} (e.g. Cabin 304, CS Block)`
              }
              value={locationDetails}
              onChange={(e) => {
                setLocationDetails(e.target.value);
                setSaveSuccess(false);
              }}
              className="w-full text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors"
            />
          </div>
        </div>

        {/* 3. Optional Status Message & Time Window */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          {/* Status Message */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#0d5c58]" />
              <span>3. Optional Availability Message</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Free for consultations & doubt clearing until 4 PM"
              value={statusMessage}
              onChange={(e) => {
                setStatusMessage(e.target.value);
                setSaveSuccess(false);
              }}
              className="w-full text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors"
            />
          </div>

          {/* Time Window (Start and End Time) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0d5c58]" />
              <span>Time Window (Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setSaveSuccess(false);
                }}
                className="w-full text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                title="Start time"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setSaveSuccess(false);
                }}
                className="w-full text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e]"
                title="End time"
              />
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Availability status and location updated successfully! Broadcasted to students.</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Save Status Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Last status update:{' '}
              <strong className="text-slate-600 font-semibold">
                {formatRelativeTime(profile?.availability_updated_at)}
              </strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold bg-[#0d5c58] hover:bg-[#094340] text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Status...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>Save & Broadcast Status</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
