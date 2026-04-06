import React, { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { SprintMetricWithEntries, SprintSuggestion } from '../../types/sprint';
import { MetricRow } from './MetricRow';
import { MetricFormModal } from './MetricFormModal';
import { useThemeColors } from '../../hooks/useThemeColors';

type SaveData = Parameters<React.ComponentProps<typeof MetricFormModal>['onSave']>[0];

interface ManageMetricsPanelProps {
  sprintId: string;
  metrics: SprintMetricWithEntries[];
  suggestions: SprintSuggestion[];
  onAdd: (data: SaveData) => Promise<void>;
  onEdit: (metricId: string, data: SaveData) => Promise<void>;
  onDelete: (metricId: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
  triggerAddOpen?: boolean;
  onAddOpenHandled?: () => void;
}

export const ManageMetricsPanel: React.FC<ManageMetricsPanelProps> = ({
  sprintId,
  metrics,
  suggestions,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  triggerAddOpen,
  onAddOpenHandled,
}) => {
  const theme = useThemeColors();
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState<SprintMetricWithEntries | undefined>();
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setLocalMetrics([...metrics].sort((a, b) => a.display_order - b.display_order));
  }, [metrics]);

  useEffect(() => {
    if (triggerAddOpen) {
      setEditingMetric(undefined);
      setShowForm(true);
      onAddOpenHandled?.();
    }
  }, [triggerAddOpen, onAddOpenHandled]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localMetrics.findIndex(m => m.id === active.id);
    const newIndex = localMetrics.findIndex(m => m.id === over.id);
    const reordered = arrayMove(localMetrics, oldIndex, newIndex);
    setLocalMetrics(reordered);
    await onReorder(reordered.map(m => m.id));
  };

  const handleDelete = async (metricId: string) => {
    setDeleteError(null);
    try {
      await onDelete(metricId);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const currentNames = localMetrics.map(m => m.name);
  const nextOrder = localMetrics.length > 0
    ? Math.max(...localMetrics.map(m => m.display_order)) + 1
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.colors.text.primary }}>
          Manage Metrics
          <span style={{ marginLeft: '8px', fontSize: 13, fontWeight: 400, color: theme.colors.text.secondary }}>
            ({localMetrics.length})
          </span>
        </h3>
        <button
          onClick={() => { setEditingMetric(undefined); setShowForm(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Metric
        </button>
      </div>

      {deleteError && (
        <p style={{ color: theme.colors.status.error.dark, fontSize: 13, margin: '0 0 12px' }}>{deleteError}</p>
      )}

      {localMetrics.length === 0 ? (
        <p style={{ color: theme.colors.text.muted, fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
          No metrics added yet.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localMetrics.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {localMetrics.map(m => (
                <MetricRow
                  key={m.id}
                  metric={m}
                  onEdit={metric => { setEditingMetric(metric); setShowForm(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showForm && (
        <MetricFormModal
          sprintId={sprintId}
          existingMetric={editingMetric}
          existingNames={currentNames}
          nextDisplayOrder={nextOrder}
          suggestions={suggestions}
          hasExistingEntries={editingMetric ? editingMetric.entries.length > 0 : false}
          onSave={async data => {
            if (editingMetric) {
              await onEdit(editingMetric.id, data);
            } else {
              await onAdd(data);
            }
          }}
          onClose={() => { setShowForm(false); setEditingMetric(undefined); }}
        />
      )}
    </div>
  );
};
