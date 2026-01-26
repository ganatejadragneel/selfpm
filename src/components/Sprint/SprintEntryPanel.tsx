import { useState, useMemo, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Calendar } from 'lucide-react';
import { format, parseISO, isToday, isYesterday, subDays } from 'date-fns';
import { SprintMetricCard } from './SprintMetricCard';
import { UI_LABELS, USER_TIMEZONE } from '../../constants/sprint';
import type { SprintWithMetrics, EntryData } from '../../types/sprint';

interface SprintEntryPanelProps {
  sprint: SprintWithMetrics;
  onSaveEntry: (metricId: string, entryDate: string, data: EntryData) => Promise<void>;
  saving?: boolean;
}

/**
 * Get today's date in user timezone as YYYY-MM-DD
 */
const getTodayDate = (): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: USER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

/**
 * Get yesterday's date in user timezone as YYYY-MM-DD
 */
const getYesterdayDate = (): string => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: USER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(yesterday);
};

/**
 * Check if a date is within sprint range
 */
const isDateInSprintRange = (date: string, startDate: string, endDate: string): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * SprintEntryPanel - Left panel for data entry
 * Shows all metrics with today/yesterday toggle
 */
export const SprintEntryPanel = ({ sprint, onSaveEntry, saving = false }: SprintEntryPanelProps) => {
  const theme = useThemeColors();

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Calculate available dates (today and yesterday that are within sprint range)
  const availableDates = useMemo(() => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    const dates: { date: string; label: string; isToday: boolean }[] = [];

    if (isDateInSprintRange(today, sprint.start_date, sprint.end_date)) {
      dates.push({ date: today, label: UI_LABELS.today, isToday: true });
    }

    if (isDateInSprintRange(yesterday, sprint.start_date, sprint.end_date)) {
      dates.push({ date: yesterday, label: UI_LABELS.yesterday, isToday: false });
    }

    return dates;
  }, [sprint.start_date, sprint.end_date]);

  // Validate selected date is still valid
  const validSelectedDate = useMemo(() => {
    if (availableDates.find((d) => d.date === selectedDate)) {
      return selectedDate;
    }
    return availableDates[0]?.date || getTodayDate();
  }, [selectedDate, availableDates]);

  // Handle save for a metric
  const handleSaveEntry = useCallback(
    async (metricId: string, data: EntryData) => {
      await onSaveEntry(metricId, validSelectedDate, data);
    },
    [onSaveEntry, validSelectedDate]
  );

  // Format selected date for display
  const formattedDate = useMemo(() => {
    const date = parseISO(validSelectedDate);
    const dayLabel = isToday(date)
      ? 'Today'
      : isYesterday(date)
        ? 'Yesterday'
        : format(date, 'EEEE');
    return `${dayLabel}, ${format(date, 'MMM d')}`;
  }, [validSelectedDate]);

  // Count entries for selected date
  const entryCount = useMemo(() => {
    return sprint.metrics.filter((m) => m.entries.some((e) => e.entry_date === validSelectedDate))
      .length;
  }, [sprint.metrics, validSelectedDate]);

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.md,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.background.secondary,
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.colors.text.primary,
            margin: 0,
            marginBottom: '16px',
          }}
        >
          {UI_LABELS.entryPanelTitle}
        </h3>

        {/* Date Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          {availableDates.map(({ date, label }) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor:
                  validSelectedDate === date
                    ? theme.colors.primary.dark
                    : theme.colors.background.primary,
                color: validSelectedDate === date ? 'white' : theme.colors.text.secondary,
                border: `1px solid ${
                  validSelectedDate === date
                    ? theme.colors.primary.dark
                    : theme.colors.border.light
                }`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Calendar size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Selected Date Display */}
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: theme.colors.text.primary,
              fontWeight: 500,
            }}
          >
            {formattedDate}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.text.muted,
            }}
          >
            {entryCount} of {sprint.metrics.length} logged
          </span>
        </div>
      </div>

      {/* Metrics List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {sprint.metrics
            .sort((a, b) => a.display_order - b.display_order)
            .map((metric) => (
              <SprintMetricCard
                key={metric.id}
                metric={metric}
                entryDate={validSelectedDate}
                onSave={handleSaveEntry}
                saving={saving}
              />
            ))}
        </div>
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.background.tertiary,
        }}
      >
        <p
          style={{
            fontSize: '11px',
            color: theme.colors.text.muted,
            margin: 0,
            textAlign: 'center',
          }}
        >
          You can only edit entries for today and yesterday
        </p>
      </div>
    </div>
  );
};
