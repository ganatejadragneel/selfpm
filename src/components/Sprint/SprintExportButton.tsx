import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Download, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { SprintWithMetrics, SprintExport, WeeklyTarget } from '../../types/sprint';
import { useSprintStore } from '../../store/sprintStore';
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

// ─── Export data builders ────────────────────────────────────────────────────

function buildExportData(sprint: SprintWithMetrics): SprintExport {
  const dayColumns = generateDayColumns(sprint.start_date, sprint.end_date);

  const metricsExport = sprint.metrics.map((metric) => {
    const progress = calculateMetricWeeklyProgress(metric, dayColumns);

    let dailyTargetDesc = '';
    if (metric.metric_type === 'sleep') dailyTargetDesc = 'wake_at <= target';
    else if (metric.metric_type === 'boolean') dailyTargetDesc = 'completed == true';
    else if (metric.metric_type === 'duration') {
      const target = metric.daily_target as { value: number };
      dailyTargetDesc = `duration_minutes >= ${target.value}`;
    }

    const entriesExport = dayColumns.map((day) => {
      const entry = metric.entries.find((e) => e.entry_date === day.date);
      const displayValue = getCellDisplayValue(entry || null, metric.metric_type, metric.daily_target, day.isFuture);
      let values: Record<string, unknown> | null = null;
      if (entry) {
        if (metric.metric_type === 'sleep' && entry.bed_at && entry.wake_at) {
          values = { bed_at: entry.bed_at, wake_at: entry.wake_at, duration_hours: Math.round(calculateSleepDuration(entry.bed_at, entry.wake_at) * 100) / 100 };
        } else if (metric.metric_type === 'boolean' && entry.completed !== null) {
          values = { completed: entry.completed };
        } else if (metric.metric_type === 'duration' && entry.duration_minutes !== null) {
          values = { duration_minutes: entry.duration_minutes };
        }
      }
      return { date: day.date, has_entry: displayValue.hasEntry, values, met_target: displayValue.metTarget, notes: entry?.notes || null };
    });

    return {
      name: metric.name,
      metric_type: metric.metric_type,
      daily_target: dailyTargetDesc,
      weekly_target: metric.weekly_target as WeeklyTarget,
      weekly_result: { achieved: progress.current, target: progress.target, met: progress.current >= progress.target },
      entries: entriesExport,
    };
  });

  const nonFutureDays = dayColumns.filter((d) => !d.isFuture);
  const metricsFullyMet = metricsExport.filter((m) => m.weekly_result.met).length;
  const daysWithAllEntries = nonFutureDays.filter((day) =>
    sprint.metrics.every((metric) => metric.entries.some((e) => e.entry_date === day.date))
  ).length;

  return {
    export_version: '1.0',
    exported_at: new Date().toISOString(),
    sprint: { id: sprint.id, name: sprint.name, start_date: sprint.start_date, end_date: sprint.end_date, status: sprint.status },
    metrics: metricsExport,
    summary: { metrics_fully_met: metricsFullyMet, metrics_total: sprint.metrics.length, days_with_all_entries: daysWithAllEntries, days_total: nonFutureDays.length },
  };
}

function buildCsvContent(sprints: SprintWithMetrics[]): string {
  const rows: string[] = ['Sprint,Start Date,End Date,Metric,Type,Date,Day,Value,Met Target,Notes'];
  for (const sprint of sprints) {
    const dayColumns = generateDayColumns(sprint.start_date, sprint.end_date);
    for (const metric of sprint.metrics) {
      for (const day of dayColumns) {
        if (day.isFuture) continue;
        const entry = metric.entries.find((e) => e.entry_date === day.date);
        const display = getCellDisplayValue(entry || null, metric.metric_type, metric.daily_target, false);
        const value = display.hasEntry ? display.displayText : '';
        const metTarget = display.metTarget === null ? '' : display.metTarget ? 'Yes' : 'No';
        const notes = entry?.notes?.replace(/"/g, '""') ?? '';
        const sprintName = sprint.name.replace(/"/g, '""');
        const metricName = metric.name.replace(/"/g, '""');
        rows.push(`"${sprintName}",${sprint.start_date},${sprint.end_date},"${metricName}",${metric.metric_type},${day.date},${day.dayName},"${value}",${metTarget},"${notes}"`);
      }
    }
  }
  return rows.join('\n');
}

function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SprintExportButton = memo(function SprintExportButton({
  sprint,
  variant = 'secondary',
}: SprintExportButtonProps) {
  const theme = useThemeColors();
  const { fetchCompletedSprints, fetchSprintById } = useSprintStore();
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [weeksBack, setWeeksBack] = useState(1);
  const [moreFormat, setMoreFormat] = useState<'csv' | 'json'>('csv');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  // Recalculate dropdown position when opened
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }, [open]);

  // Close dropdown when clicking outside both the button and the portal dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideWrapper && !insideDropdown) {
        setOpen(false);
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const flash = (result: 'success' | 'error') => {
    setStatus(result);
    setTimeout(() => { setStatus('idle'); setOpen(false); setShowMore(false); }, 2000);
  };

  const handleExportCurrentJson = useCallback(() => {
    try {
      const data = buildExportData(sprint);
      triggerDownload(JSON.stringify(data, null, 2), `sprint_${sprint.start_date}_export.json`, 'application/json');
      flash('success');
    } catch { flash('error'); }
  }, [sprint]);

  const handleExportCurrentCsv = useCallback(() => {
    try {
      triggerDownload(buildCsvContent([sprint]), `sprint_${sprint.start_date}_export.csv`, 'text/csv');
      flash('success');
    } catch { flash('error'); }
  }, [sprint]);

  const handleMoreExport = useCallback(async () => {
    setStatus('loading');
    try {
      const allCompleted = await fetchCompletedSprints();
      // Most recent N, plus current sprint
      const recent = allCompleted
        .sort((a, b) => b.start_date.localeCompare(a.start_date))
        .slice(0, weeksBack);
      const fullSprints: SprintWithMetrics[] = [sprint];
      for (const s of recent) {
        const full = await fetchSprintById(s.id);
        if (full) fullSprints.push(full);
      }
      // Sort oldest first for readability
      fullSprints.sort((a, b) => a.start_date.localeCompare(b.start_date));
      const dateTag = `${fullSprints[0].start_date}_to_${fullSprints[fullSprints.length - 1].end_date}`;
      if (moreFormat === 'json') {
        const data = fullSprints.map(buildExportData);
        triggerDownload(JSON.stringify(data, null, 2), `sprints_${dateTag}_export.json`, 'application/json');
      } else {
        triggerDownload(buildCsvContent(fullSprints), `sprints_${dateTag}_export.csv`, 'text/csv');
      }
      flash('success');
    } catch { flash('error'); }
  }, [sprint, weeksBack, moreFormat, fetchCompletedSprints, fetchSprintById]);

  const isPrimary = variant === 'primary';
  const baseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: isPrimary ? '10px 16px' : '8px 12px',
    borderRadius: theme.borderRadius.md,
    background: isPrimary ? theme.colors.primary.dark : theme.colors.background.secondary,
    color: isPrimary ? '#fff' : theme.colors.text.primary,
    border: isPrimary ? 'none' : `1px solid ${theme.colors.border.light}`,
    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: dropdownPos?.top ?? 0,
    right: dropdownPos?.right ?? 0,
    zIndex: 9999,
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.effects.shadow.md,
    minWidth: 180, overflow: 'hidden',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
    padding: '10px 14px', background: 'none', border: 'none',
    color: theme.colors.text.primary, fontSize: 13, cursor: 'pointer', textAlign: 'left',
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={() => { if (status === 'idle') { setOpen(o => !o); setShowMore(false); } }}
        style={{
          ...baseStyle,
          background: status === 'success' ? theme.colors.status.success.light : status === 'error' ? theme.colors.status.error.light : baseStyle.background,
          color: status === 'success' ? theme.colors.status.success.dark : status === 'error' ? theme.colors.status.error.dark : baseStyle.color,
        }}
      >
        {status === 'success' ? <><Check size={16} />Exported</> :
         status === 'error' ? <><AlertCircle size={16} />Failed</> :
         status === 'loading' ? <><Download size={16} />Exporting…</> :
         <><Download size={16} />Export<ChevronDown size={14} /></>}
      </button>

      {open && status === 'idle' && dropdownPos && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
          {/* Current week */}
          <button style={itemStyle} onClick={handleExportCurrentCsv} onMouseEnter={e => (e.currentTarget.style.background = theme.colors.background.secondary)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Download size={14} /> CSV — this week
          </button>
          <button style={itemStyle} onClick={handleExportCurrentJson} onMouseEnter={e => (e.currentTarget.style.background = theme.colors.background.secondary)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Download size={14} /> JSON — this week
          </button>

          <div style={{ height: 1, background: theme.colors.border.light, margin: '4px 0' }} />

          {/* More — multi-week */}
          <button
            style={{ ...itemStyle, justifyContent: 'space-between' }}
            onClick={() => setShowMore(v => !v)}
            onMouseEnter={e => (e.currentTarget.style.background = theme.colors.background.secondary)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={14} /> More…
            </span>
            <ChevronRight size={14} style={{ transform: showMore ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {showMore && (
            <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${theme.colors.border.light}` }}>
              <label style={{ fontSize: 12, color: theme.colors.text.secondary, display: 'block', marginBottom: 6 }}>
                Previous weeks to include
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeksBack}
                onChange={e => setWeeksBack(Math.max(1, Math.min(52, Number(e.target.value))))}
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: 6,
                  border: `1px solid ${theme.colors.border.light}`,
                  background: theme.colors.background.secondary,
                  color: theme.colors.text.primary, fontSize: 13,
                  boxSizing: 'border-box', marginBottom: 10,
                }}
              />
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {(['csv', 'json'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setMoreFormat(fmt)}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: moreFormat === fmt ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : theme.colors.background.secondary,
                      color: moreFormat === fmt ? '#fff' : theme.colors.text.secondary,
                    }}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={handleMoreExport}
                style={{
                  width: '100%', padding: '7px 0', borderRadius: 6, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Export {weeksBack} week{weeksBack !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
        , document.body)
      }
    </div>
  );
});
