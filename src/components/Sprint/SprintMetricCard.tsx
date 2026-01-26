import { useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { ChevronDown, ChevronUp, Moon, Sun, Activity, Dumbbell, Briefcase, Save } from 'lucide-react';
import { SleepInput, BooleanInput, DurationInput } from './inputs';
import {
  UI_LABELS,
  MAX_NOTES_LENGTH,
  FOCUS_METRICS,
} from '../../constants/sprint';
import type {
  SprintMetricWithEntries,
  EntryData,
  SleepEntryData,
  BooleanEntryData,
  DurationEntryData,
  SprintMetricEntry,
} from '../../types/sprint';

interface SprintMetricCardProps {
  metric: SprintMetricWithEntries;
  entryDate: string;
  onSave: (metricId: string, data: EntryData) => Promise<void>;
  saving?: boolean;
}

// Get icon for metric
const getMetricIcon = (metricName: string) => {
  switch (metricName) {
    case 'Sleep':
      return Moon;
    case 'Morning Routine':
      return Sun;
    case 'IP Attack':
      return Activity;
    case 'Gym':
      return Dumbbell;
    case 'Anthropic Progress':
      return Briefcase;
    default:
      return Activity;
  }
};

// Get existing entry for date
const getEntryForDate = (
  entries: SprintMetricEntry[],
  date: string
): SprintMetricEntry | null => {
  return entries.find((e) => e.entry_date === date) || null;
};

/**
 * SprintMetricCard - Expandable card for entering metric data
 * Handles all three metric types: sleep, boolean, duration
 */
export const SprintMetricCard = ({
  metric,
  entryDate,
  onSave,
  saving = false,
}: SprintMetricCardProps) => {
  const theme = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Get metric config for target description
  const metricConfig = FOCUS_METRICS.find((m) => m.name === metric.name);

  // Get existing entry
  const existingEntry = getEntryForDate(metric.entries, entryDate);

  // Local state for form data
  const [sleepData, setSleepData] = useState<{ bedAt: string | null; wakeAt: string | null }>({
    bedAt: null,
    wakeAt: null,
  });
  const [booleanData, setBooleanData] = useState<boolean | null>(null);
  const [durationData, setDurationData] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form data from existing entry
  useEffect(() => {
    if (existingEntry) {
      setSleepData({
        bedAt: existingEntry.bed_at || null,
        wakeAt: existingEntry.wake_at || null,
      });
      setBooleanData(existingEntry.completed ?? null);
      setDurationData(existingEntry.duration_minutes ?? null);
      setNotes(existingEntry.notes || '');
      setIsDirty(false);
    } else {
      // Reset to defaults
      setSleepData({ bedAt: null, wakeAt: null });
      setBooleanData(null);
      setDurationData(null);
      setNotes('');
      setIsDirty(false);
    }
  }, [existingEntry, entryDate]);

  // Handle save
  const handleSave = async () => {
    let data: EntryData;
    setSaveError(null);

    switch (metric.metric_type) {
      case 'sleep':
        if (!sleepData.bedAt || !sleepData.wakeAt) return;
        data = {
          bed_at: sleepData.bedAt,
          wake_at: sleepData.wakeAt,
          notes: notes || undefined,
        } as SleepEntryData;
        break;
      case 'boolean':
        if (booleanData === null) return;
        data = {
          completed: booleanData,
          notes: notes || undefined,
        } as BooleanEntryData;
        break;
      case 'duration':
        if (durationData === null) return;
        data = {
          duration_minutes: durationData,
          notes: notes || undefined,
        } as DurationEntryData;
        break;
      default:
        return;
    }

    try {
      await onSave(metric.id, data);
      setIsDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save entry';
      setSaveError(message);
      console.error('Save error:', err);
    }
  };

  // Check if form is valid for save
  const isValid = () => {
    switch (metric.metric_type) {
      case 'sleep':
        return sleepData.bedAt !== null && sleepData.wakeAt !== null;
      case 'boolean':
        return booleanData !== null;
      case 'duration':
        return durationData !== null && durationData >= 0;
      default:
        return false;
    }
  };

  // Memoized onChange handlers to prevent infinite loops in child components
  const handleSleepChange = useCallback(
    (bedAt: string | null, wakeAt: string | null) => {
      setSleepData({ bedAt, wakeAt });
      setIsDirty(true);
      setSaveError(null);
    },
    []
  );

  const handleBooleanChange = useCallback(
    (completed: boolean) => {
      setBooleanData(completed);
      setIsDirty(true);
      setSaveError(null);
    },
    []
  );

  const handleDurationChange = useCallback(
    (minutes: number) => {
      setDurationData(minutes);
      setIsDirty(true);
      setSaveError(null);
    },
    []
  );

  const Icon = getMetricIcon(metric.name);

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface.white,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.light}`,
        overflow: 'hidden',
        boxShadow: theme.effects.shadow.sm,
      }}
    >
      {/* Header - Always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          cursor: 'pointer',
          backgroundColor: expanded ? theme.colors.background.secondary : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.primary.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} color={theme.colors.primary.dark} />
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: theme.colors.text.primary,
              }}
            >
              {metric.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: theme.colors.text.muted,
              }}
            >
              {metricConfig?.dailyTargetDescription || ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Entry status indicator */}
          {existingEntry && (
            <div
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: theme.colors.status.success.light,
                color: theme.colors.status.success.dark,
                borderRadius: theme.borderRadius.full,
              }}
            >
              Logged
            </div>
          )}
          {isDirty && (
            <div
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: theme.colors.status.warning.light,
                color: theme.colors.status.warning.dark,
                borderRadius: theme.borderRadius.full,
              }}
            >
              Unsaved
            </div>
          )}
          {expanded ? (
            <ChevronUp size={20} color={theme.colors.text.muted} />
          ) : (
            <ChevronDown size={20} color={theme.colors.text.muted} />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{
            padding: '16px',
            borderTop: `1px solid ${theme.colors.border.light}`,
          }}
        >
          {/* Metric-specific input */}
          {metric.metric_type === 'sleep' && (
            <SleepInput
              bedAt={sleepData.bedAt}
              wakeAt={sleepData.wakeAt}
              onChange={handleSleepChange}
              entryDate={entryDate}
              disabled={saving}
            />
          )}

          {metric.metric_type === 'boolean' && (
            <BooleanInput
              completed={booleanData}
              onChange={handleBooleanChange}
              disabled={saving}
            />
          )}

          {metric.metric_type === 'duration' && (
            <DurationInput
              durationMinutes={durationData}
              onChange={handleDurationChange}
              metricName={metric.name}
              disabled={saving}
            />
          )}

          {/* Notes Section */}
          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: theme.colors.text.secondary,
                marginBottom: '6px',
              }}
            >
              {UI_LABELS.notesLabel}
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setIsDirty(true);
              }}
              placeholder={UI_LABELS.notesPlaceholder}
              disabled={saving}
              maxLength={MAX_NOTES_LENGTH}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px 12px',
                fontSize: '14px',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: saving
                  ? theme.colors.background.tertiary
                  : theme.colors.background.primary,
                color: theme.colors.text.primary,
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                fontSize: '11px',
                color:
                  notes.length > MAX_NOTES_LENGTH * 0.9
                    ? theme.colors.status.warning.dark
                    : theme.colors.text.muted,
                marginTop: '4px',
              }}
            >
              {notes.length} / {MAX_NOTES_LENGTH}
            </div>
          </div>

          {/* Save Error */}
          {saveError && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: theme.colors.status.error.light,
                border: `1px solid ${theme.colors.status.error.medium}`,
                borderRadius: theme.borderRadius.sm,
                color: theme.colors.status.error.dark,
                fontSize: '13px',
              }}
            >
              {saveError}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !isValid() || !isDirty}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor:
                saving || !isValid() || !isDirty
                  ? theme.colors.background.tertiary
                  : theme.colors.primary.dark,
              color: saving || !isValid() || !isDirty ? theme.colors.text.muted : 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: saving || !isValid() || !isDirty ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      )}
    </div>
  );
};
