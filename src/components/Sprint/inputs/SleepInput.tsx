import { useState, useEffect, useMemo, useCallback } from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { Moon, Sun, Clock } from 'lucide-react';
import { UI_LABELS } from '../../../constants/sprint';
import type { SprintMetricWithEntries } from '../../../types/sprint';

interface SleepInputProps {
  bedAt: string | null;
  wakeAt: string | null;
  onChange: (bedAt: string | null, wakeAt: string | null) => void;
  disabled?: boolean;
  entryDate: string; // YYYY-MM-DD format
  metric: SprintMetricWithEntries;
}

/**
 * Convert local time to ISO timestamp
 * Properly handles timezone by creating date in local time first
 */
const createTimestamp = (time: string, isWakeTime: boolean, baseDate: string): string => {
  const [hours, minutes] = time.split(':').map(Number);

  // Parse baseDate as local date components (not UTC)
  const [year, month, day] = baseDate.split('-').map(Number);

  // Create date in local timezone
  let targetDay = day;
  let targetMonth = month;
  let targetYear = year;

  // For bedtime (not wake time), it's the night before entry_date
  if (!isWakeTime) {
    // Subtract one day (handle month/year boundaries)
    const tempDate = new Date(year, month - 1, day - 1);
    targetYear = tempDate.getFullYear();
    targetMonth = tempDate.getMonth() + 1;
    targetDay = tempDate.getDate();
  }

  // Create the timestamp in local timezone
  const localDate = new Date(targetYear, targetMonth - 1, targetDay, hours, minutes, 0, 0);

  // Convert to ISO string (this will be in UTC)
  return localDate.toISOString();
};

/**
 * Sleep input component with bedtime and wake time pickers
 * Handles DST-safe timestamp creation
 */
export const SleepInput = ({
  bedAt,
  wakeAt,
  onChange,
  disabled = false,
  entryDate,
  metric,
}: SleepInputProps) => {
  const theme = useThemeColors();

  const defaultBed  = metric.daily_target.type === 'time_of_day' ? metric.daily_target.target_start : '22:00';
  const defaultWake = metric.daily_target.type === 'time_of_day' ? metric.daily_target.target_end   : '06:00';

  const startLabel = metric.components.bed_at?.label  ?? 'Start Time';
  const endLabel   = metric.components.wake_at?.label ?? 'End Time';

  // Local state for time inputs (HH:MM format)
  const [bedTime, setBedTime] = useState(defaultBed);
  const [wakeTime, setWakeTime] = useState(defaultWake);
  const [initialized, setInitialized] = useState(false);

  // Parse existing values on mount/change
  useEffect(() => {
    if (bedAt) {
      const date = new Date(bedAt);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setBedTime(`${hours}:${minutes}`);
    }
    if (wakeAt) {
      const date = new Date(wakeAt);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setWakeTime(`${hours}:${minutes}`);
    }
  }, [bedAt, wakeAt]);

  // Sync default values to parent on mount when no existing entry
  useEffect(() => {
    // Only initialize once per entryDate, and only if parent has no values
    if (!bedAt && !wakeAt && entryDate && !initialized) {
      const defaultBedTimestamp = createTimestamp(defaultBed, false, entryDate);
      const defaultWakeTimestamp = createTimestamp(defaultWake, true, entryDate);
      onChange(defaultBedTimestamp, defaultWakeTimestamp);
      setInitialized(true);
    }
  }, [bedAt, wakeAt, entryDate, onChange, initialized, defaultBed, defaultWake]);

  // Reset initialized flag when entryDate changes
  useEffect(() => {
    setInitialized(false);
  }, [entryDate]);

  // Calculate sleep duration
  const sleepDuration = useMemo(() => {
    if (!bedAt || !wakeAt) return null;

    const bed = new Date(bedAt);
    const wake = new Date(wakeAt);
    const diffMs = wake.getTime() - bed.getTime();

    if (diffMs <= 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }, [bedAt, wakeAt]);

  // Handle bedtime change
  const handleBedTimeChange = useCallback(
    (newBedTime: string) => {
      setBedTime(newBedTime);

      const bedTimestamp = createTimestamp(newBedTime, false, entryDate);
      const wakeTimestamp = createTimestamp(wakeTime, true, entryDate);
      onChange(bedTimestamp, wakeTimestamp);
    },
    [entryDate, wakeTime, onChange]
  );

  // Handle wake time change
  const handleWakeTimeChange = useCallback(
    (newWakeTime: string) => {
      setWakeTime(newWakeTime);

      const bedTimestamp = createTimestamp(bedTime, false, entryDate);
      const wakeTimestamp = createTimestamp(newWakeTime, true, entryDate);
      onChange(bedTimestamp, wakeTimestamp);
    },
    [entryDate, bedTime, onChange]
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: disabled ? theme.colors.background.tertiary : theme.colors.background.primary,
    color: theme.colors.text.primary,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 500,
    color: theme.colors.text.secondary,
    marginBottom: '6px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Bedtime Input */}
      <div>
        <label style={labelStyle}>
          <Moon size={14} />
          {startLabel}
        </label>
        <input
          type="time"
          value={bedTime}
          onChange={(e) => handleBedTimeChange(e.target.value)}
          disabled={disabled}
          style={inputStyle}
        />
        <div
          style={{
            fontSize: '11px',
            color: theme.colors.text.muted,
            marginTop: '4px',
          }}
        >
          Night before (when you went to bed)
        </div>
      </div>

      {/* Wake Time Input */}
      <div>
        <label style={labelStyle}>
          <Sun size={14} />
          {endLabel}
        </label>
        <input
          type="time"
          value={wakeTime}
          onChange={(e) => handleWakeTimeChange(e.target.value)}
          disabled={disabled}
          style={inputStyle}
        />
        <div
          style={{
            fontSize: '11px',
            color: theme.colors.text.muted,
            marginTop: '4px',
          }}
        >
          Target: 4:30 AM or earlier
        </div>
      </div>

      {/* Duration Display */}
      {sleepDuration && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: theme.colors.primary.light,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.primary.medium}`,
          }}
        >
          <Clock size={16} color={theme.colors.primary.dark} />
          <div>
            <div
              style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
              }}
            >
              {UI_LABELS.sleepDuration}
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.colors.primary.dark,
              }}
            >
              {sleepDuration.hours}h {sleepDuration.minutes}m
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
