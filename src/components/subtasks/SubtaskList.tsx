import React, { useState } from 'react';
import { theme } from '../../styles/theme';
import { Plus, ListTodo } from 'lucide-react';
import type { Subtask } from '../../types';
import { SubtaskItem } from './SubtaskItem';
import { useMigratedTaskStore } from '../../store/migratedTaskStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ taskId, subtasks }) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { addSubtask, updateSubtask, toggleSubtask, deleteSubtask, reorderSubtasks } = useMigratedTaskStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddSubtask = async () => {
    if (newSubtaskTitle.trim()) {
      await addSubtask(taskId, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setShowAddForm(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskTitle('');
      setShowAddForm(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex((item) => item.id === active.id);
      const newIndex = subtasks.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex);
        reorderSubtasks(taskId, reorderedSubtasks.map(s => s.id));
      }
    }
  };

  const completedCount = subtasks.filter(s => s.isCompleted).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div style={{ marginTop: theme.spacing.lg }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <ListTodo className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
          <h3 style={{
            fontSize: theme.typography.sizes.lg,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            margin: 0
          }}>
            Subtasks
          </h3>
          {totalCount > 0 && (
            <span style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.secondary,
              background: 'rgba(102, 126, 234, 0.1)',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.borderRadius.full,
              fontWeight: theme.typography.weights.medium
            }}>
              {completedCount}/{totalCount}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: theme.colors.primary.light,
            color: theme.colors.primary.dark,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.primary.dark;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.primary.light;
            e.currentTarget.style.color = theme.colors.primary.dark;
          }}
        >
          <Plus className="w-4 h-4" />
          Add Subtask
        </button>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: theme.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: progressPercentage === 100 ? 
                theme.colors.status.success.dark : 
                'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.3s ease',
              borderRadius: theme.borderRadius.full
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: theme.spacing.xs
          }}>
            <span style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.text.secondary
            }}>
              {Math.round(progressPercentage)}% complete
            </span>
            {progressPercentage === 100 && (
              <span style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.status.success.dark,
                fontWeight: theme.typography.weights.semibold
              }}>
                ✓ All subtasks completed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add Subtask Form */}
      {showAddForm && (
        <div style={{
          display: 'flex',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
          padding: theme.spacing.md,
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: theme.borderRadius.sm,
          border: `1px solid ${theme.colors.primary.light}`
        }}>
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter subtask title..."
            autoFocus
            style={{
              flex: 1,
              border: `2px solid ${theme.colors.primary.light}`,
              borderRadius: theme.borderRadius.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.sizes.sm,
              outline: 'none',
              background: 'white',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary.dark;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary.light;
            }}
          />
          <button
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: newSubtaskTitle.trim() ? theme.colors.primary.dark : theme.colors.text.muted,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: newSubtaskTitle.trim() ? 'pointer' : 'not-allowed',
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              transition: 'all 0.2s ease',
              minWidth: '60px'
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setNewSubtaskTitle('');
              setShowAddForm(false);
            }}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: 'none',
              color: theme.colors.text.secondary,
              border: `1px solid ${theme.colors.text.muted}`,
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
              fontSize: theme.typography.sizes.sm,
              transition: 'all 0.2s ease',
              minWidth: '60px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Subtask List with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {subtasks.length === 0 && !showAddForm ? (
            <div style={{
              textAlign: 'center',
              padding: `${theme.spacing.xl} ${theme.spacing.md}`,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.sizes.sm
            }}>
              <ListTodo className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No subtasks yet. Break down this task into smaller steps!</p>
            </div>
          ) : (
            <SortableContext
              items={subtasks.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={toggleSubtask}
                  onUpdate={updateSubtask}
                  onDelete={deleteSubtask}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    </div>
  );
};