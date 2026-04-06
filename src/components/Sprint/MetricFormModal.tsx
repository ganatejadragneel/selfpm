import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { SprintMetric, MetricType, DailyTarget, SprintSuggestion, MetricComponents } from '../../types/sprint';
import { COMPONENTS_FOR_TYPE } from '../../constants/sprint';
import { SuggestionsPanel } from './SuggestionsPanel';

interface MetricFormModalProps {
  sprintId: string;
  existingMetric?: SprintMetric;
  existingNames: string[];
  nextDisplayOrder: number;
  suggestions: SprintSuggestion[];
  hasExistingEntries?: boolean;
  onSave: (data: {
    name: string;
    metric_type: MetricType;
    components: MetricComponents;
    daily_target: DailyTarget;
    weekly_target: { type: 'frequency'; count: number; total: number };
    display_order: number;
    typeChanged: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: MetricType; label: string }[] = [
  { value: 'sleep',    label: 'Time of Day' },
  { value: 'boolean',  label: 'Boolean' },
  { value: 'duration', label: 'Duration' },
];

export const MetricFormModal: React.FC<MetricFormModalProps> = ({
  sprintId: _sprintId,
  existingMetric,
  existingNames,
  nextDisplayOrder,
  suggestions,
  hasExistingEntries = false,
  onSave,
  onClose,
}) => {
  const isEdit = !!existingMetric;

  const [name, setName]           = useState(existingMetric?.name ?? '');
  const [type, setType]           = useState<MetricType>(existingMetric?.metric_type ?? 'boolean');
  const [weeklyTarget, setWeekly] = useState(existingMetric?.weekly_target.count ?? 5);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const existingTod = existingMetric?.daily_target.type === 'time_of_day'
    ? existingMetric.daily_target : null;
  const existingComps = existingMetric?.components;

  const [startLabel,   setStartLabel]   = useState(existingComps?.bed_at?.label  ?? 'Start Time');
  const [endLabel,     setEndLabel]     = useState(existingComps?.wake_at?.label ?? 'End Time');
  const [targetStart,  setTargetStart]  = useState(existingTod?.target_start ?? '22:00');
  const [targetEnd,    setTargetEnd]    = useState(existingTod?.target_end   ?? '06:00');

  const existingDur = existingMetric?.daily_target.type === 'number'
    ? existingMetric.daily_target.value : 60;
  const [durationTarget, setDuration] = useState(existingDur);

  const [originalType] = useState<MetricType>(existingMetric?.metric_type ?? 'boolean');

  useEffect(() => {
    if (!isEdit) return;
    setStartLabel('Start Time');
    setEndLabel('End Time');
    setTargetStart('22:00');
    setTargetEnd('06:00');
    setDuration(60);
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFromSuggestion = (s: SprintSuggestion) => {
    setName(s.name);
    setType(s.metric_type);
    setWeekly(s.weekly_target.count);
    if (s.daily_target.type === 'time_of_day') {
      setTargetStart(s.daily_target.target_start);
      setTargetEnd(s.daily_target.target_end);
      setStartLabel(s.components.bed_at?.label  ?? 'Start Time');
      setEndLabel  (s.components.wake_at?.label ?? 'End Time');
    } else if (s.daily_target.type === 'number') {
      setDuration(s.daily_target.value);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (name.trim().length > 100) errs.name = 'Max 100 characters';
    const otherNames = isEdit
      ? existingNames.filter(n => n.toLowerCase() !== existingMetric!.name.toLowerCase())
      : existingNames;
    if (otherNames.some(n => n.toLowerCase() === name.trim().toLowerCase())) {
      errs.name = 'A metric with this name already exists';
    }
    if (weeklyTarget < 1 || weeklyTarget > 7) errs.weekly = 'Must be 1–7';
    if (type === 'duration' && (durationTarget < 1 || durationTarget > 1440)) {
      errs.duration = 'Must be 1–1440 minutes';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildDailyTarget = (): DailyTarget => {
    if (type === 'sleep')   return { type: 'time_of_day', target_start: targetStart, target_end: targetEnd };
    if (type === 'boolean') return { type: 'boolean', value: true };
    return { type: 'number', value: durationTarget };
  };

  const buildComponents = (): MetricComponents => {
    if (type === 'sleep') {
      return {
        bed_at:  { type: 'timestamp' as const, label: startLabel },
        wake_at: { type: 'timestamp' as const, label: endLabel },
      };
    }
    return { ...COMPONENTS_FOR_TYPE[type] };
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        metric_type: type,
        components: buildComponents(),
        daily_target: buildDailyTarget(),
        weekly_target: { type: 'frequency', count: weeklyTarget, total: 7 },
        display_order: existingMetric?.display_order ?? nextDisplayOrder,
        typeChanged: isEdit && type !== originalType,
      });
      onClose();
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    background: 'rgba(255,255,255,0.05)',
    color: '#f8fafc',
    fontSize: 14,
    boxSizing: 'border-box',
  });

  const modal = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Form card */}
        <div style={{
          background: '#1e293b', borderRadius: '16px', padding: '28px',
          width: 420, border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>

          <h3 style={{ margin: '0 0 24px', color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
            {isEdit ? 'Edit Metric' : 'Add Metric'}
          </h3>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: '6px' }}>Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)} maxLength={100}
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.name}</p>}
          </div>

          {/* Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: '6px' }}>Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as MetricType)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#f8fafc', fontSize: 14 }}
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {isEdit && type !== originalType && hasExistingEntries && (
              <p style={{ color: '#f59e0b', fontSize: 12, margin: '4px 0 0' }}>
                Changing type will delete all existing entries for this metric.
              </p>
            )}
          </div>

          {/* Daily target — Time of Day */}
          {type === 'sleep' && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>Daily Target</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <input
                    placeholder="Start label" value={startLabel}
                    onChange={e => setStartLabel(e.target.value)} maxLength={50}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 13, boxSizing: 'border-box' }}
                  />
                  <input
                    type="time" value={targetStart} onChange={e => setTargetStart(e.target.value)}
                    style={{ marginTop: 6, width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <input
                    placeholder="End label" value={endLabel}
                    onChange={e => setEndLabel(e.target.value)} maxLength={50}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 13, boxSizing: 'border-box' }}
                  />
                  <input
                    type="time" value={targetEnd} onChange={e => setTargetEnd(e.target.value)}
                    style={{ marginTop: 6, width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Daily target — Duration */}
          {type === 'duration' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: '6px' }}>Target Minutes (1–1440)</label>
              <input
                type="number" min={1} max={1440}
                value={durationTarget} onChange={e => setDuration(Number(e.target.value))}
                style={inputStyle(!!errors.duration)}
              />
              {errors.duration && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.duration}</p>}
            </div>
          )}

          {/* Weekly target */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: '6px' }}>Weekly Target (days/week, 1–7)</label>
            <input
              type="number" min={1} max={7}
              value={weeklyTarget} onChange={e => setWeekly(Number(e.target.value))}
              style={inputStyle(!!errors.weekly)}
            />
            {errors.weekly && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.weekly}</p>}
          </div>

          {errors.submit && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: '12px' }}>{errors.submit}</p>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Metric'}
            </button>
          </div>
        </div>

        {/* Suggestions sidebar */}
        <SuggestionsPanel
          suggestions={suggestions}
          currentMetricNames={existingNames}
          onSelect={applyFromSuggestion}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
