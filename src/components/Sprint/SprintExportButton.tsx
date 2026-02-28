import { useState, useCallback, memo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Download, Check, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { SprintWithMetrics, SprintExport, WeeklyTarget } from '../../types/sprint';
import {
  generateDayColumns,
  calculateMetricWeeklyProgress,
  getCellDisplayValue,
  calculateSleepDuration,
} from '../../utils/sprintUtils';

interface SprintExportButtonProps {
  sprint: SprintWithMetrics;
  variant?: 'primary' | 'secondary';
}

/**
 * SprintExportButton - Exports sprint data as JSON file
 * Generates comprehensive export with all metrics, entries, and summary
 */
export const SprintExportButton = memo(function SprintExportButton({
  sprint,
  variant = 'secondary',
}: SprintExportButtonProps) {
  const theme = useThemeColors();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Generate export data
  const generateExportData = useCallback((): SprintExport => {
    const dayColumns = generateDayColumns(sprint.start_date, sprint.end_date);

    // Build metrics array with entries
    const metricsExport = sprint.metrics.map((metric) => {
      const progress = calculateMetricWeeklyProgress(metric, dayColumns);

      // Build daily target description
      let dailyTargetDesc = '';
      if (metric.metric_type === 'sleep') {
        dailyTargetDesc = 'wake_at <= 04:30';
      } else if (metric.metric_type === 'boolean') {
        dailyTargetDesc = 'completed == true';
      } else if (metric.metric_type === 'duration') {
        const target = metric.daily_target as { value: number };
        dailyTargetDesc = `duration_minutes >= ${target.value}`;
      }

      // Build entries array
      const entriesExport = dayColumns.map((day) => {
        const entry = metric.entries.find((e) => e.entry_date === day.date);
        const displayValue = getCellDisplayValue(
          entry || null,
          metric.metric_type,
          metric.name,
          day.isFuture
        );

        let values: Record<string, unknown> | null = null;

        if (entry) {
          if (metric.metric_type === 'sleep' && entry.bed_at && entry.wake_at) {
            const duration = calculateSleepDuration(entry.bed_at, entry.wake_at);
            values = {
              bed_at: entry.bed_at,
              wake_at: entry.wake_at,
              duration_hours: Math.round(duration * 100) / 100,
            };
          } else if (metric.metric_type === 'boolean' && entry.completed !== null) {
            values = { completed: entry.completed };
          } else if (metric.metric_type === 'duration' && entry.duration_minutes !== null) {
            values = { duration_minutes: entry.duration_minutes };
          }
        }

        return {
          date: day.date,
          has_entry: displayValue.hasEntry,
          values,
          met_target: displayValue.metTarget,
          notes: entry?.notes || null,
        };
      });

      return {
        name: metric.name,
        metric_type: metric.metric_type,
        daily_target: dailyTargetDesc,
        weekly_target: metric.weekly_target as WeeklyTarget,
        weekly_result: {
          achieved: progress.current,
          target: progress.target,
          met: progress.current >= progress.target,
        },
        entries: entriesExport,
      };
    });

    // Calculate summary
    const metricsFullyMet = metricsExport.filter((m) => m.weekly_result.met).length;

    // Days with all entries (non-future days where every metric has an entry)
    const nonFutureDays = dayColumns.filter((d) => !d.isFuture);
    const daysWithAllEntries = nonFutureDays.filter((day) => {
      return sprint.metrics.every((metric) =>
        metric.entries.some((e) => e.entry_date === day.date)
      );
    }).length;

    const exportData: SprintExport = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      sprint: {
        id: sprint.id,
        name: sprint.name,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        status: sprint.status,
      },
      metrics: metricsExport,
      summary: {
        metrics_fully_met: metricsFullyMet,
        metrics_total: sprint.metrics.length,
        days_with_all_entries: daysWithAllEntries,
        days_total: nonFutureDays.length,
      },
    };

    return exportData;
  }, [sprint]);

  // Handle export click
  const handleExport = useCallback(() => {
    try {
      const exportData = generateExportData();
      const json = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const fileName = `sprint_${format(parseISO(sprint.start_date), 'yyyy-MM-dd')}_export.json`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [generateExportData, sprint.start_date]);

  // Button styles based on variant
  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={handleExport}
      disabled={status === 'success'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: isPrimary ? '10px 16px' : '8px 12px',
        borderRadius: theme.borderRadius.md,
        backgroundColor: isPrimary
          ? status === 'success'
            ? theme.colors.status.success.medium
            : status === 'error'
              ? theme.colors.status.error.medium
              : theme.colors.primary.dark
          : status === 'success'
            ? theme.colors.status.success.light
            : status === 'error'
              ? theme.colors.status.error.light
              : theme.colors.background.secondary,
        color: isPrimary
          ? 'white'
          : status === 'success'
            ? theme.colors.status.success.dark
            : status === 'error'
              ? theme.colors.status.error.dark
              : theme.colors.text.primary,
        border: isPrimary
          ? 'none'
          : `1px solid ${
              status === 'success'
                ? theme.colors.status.success.medium
                : status === 'error'
                  ? theme.colors.status.error.medium
                  : theme.colors.border.light
            }`,
        fontSize: '14px',
        fontWeight: 500,
        cursor: status === 'success' ? 'default' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {status === 'success' ? (
        <>
          <Check size={16} />
          Exported
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle size={16} />
          Failed
        </>
      ) : (
        <>
          <Download size={16} />
          Export JSON
        </>
      )}
    </button>
  );
});
