import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import type { SprintMetricWithEntries } from '../../types/sprint';

interface MetricRowProps {
  metric: SprintMetricWithEntries;
  onEdit: (metric: SprintMetricWithEntries) => void;
  onDelete: (metricId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  sleep: 'Time of Day',
  boolean: 'Boolean',
  duration: 'Duration',
};

const TYPE_COLORS: Record<string, string> = {
  sleep: '#6366f1',
  boolean: '#22c55e',
  duration: '#f59e0b',
};

const getTargetSummary = (metric: SprintMetricWithEntries): string => {
  const dt = metric.daily_target;
  if (dt.type === 'time_of_day') return `by ${dt.target_end}`;
  if (dt.type === 'number') return `${dt.value} min/day`;
  return 'completed';
};

export const MetricRow: React.FC<MetricRowProps> = ({ metric, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#475569', flexShrink: 0 }}>
        <GripVertical size={16} />
      </span>

      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '4px', flexShrink: 0,
        background: TYPE_COLORS[metric.metric_type] + '22',
        color: TYPE_COLORS[metric.metric_type],
      }}>
        {TYPE_LABELS[metric.metric_type]}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {metric.name}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: '2px' }}>
          {getTargetSummary(metric)} · {metric.weekly_target.count}/week
        </div>
      </div>

      <button onClick={() => onEdit(metric)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
        <Edit2 size={15} />
      </button>
      <button onClick={() => onDelete(metric.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
        <Trash2 size={15} />
      </button>
    </div>
  );
};
