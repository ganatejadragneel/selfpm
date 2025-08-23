import React, { useState } from 'react';
import { theme } from '../../styles/theme';
import { Check, X, Edit2, Trash2, GripVertical } from 'lucide-react';
import type { Subtask } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (subtaskId: string) => void;
  onUpdate: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({ 
  subtask, 
  onToggle, 
  onUpdate, 
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== subtask.title) {
      onUpdate(subtask.id, editTitle.trim());
    }
    setIsEditing(false);
    setEditTitle(subtask.title);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(subtask.title);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete(subtask.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        background: isDragging 
          ? 'rgba(102, 126, 234, 0.15)' 
          : subtask.isCompleted 
          ? 'rgba(16, 185, 129, 0.05)'
          : theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${
          isDragging 
            ? 'rgba(102, 126, 234, 0.4)' 
            : subtask.isCompleted 
            ? 'rgba(16, 185, 129, 0.2)'
            : theme.colors.surface.glassBorder
        }`,
        cursor: isDragging ? 'grabbing' : 'default',
        opacity: subtask.isCompleted ? 0.8 : 1,
        boxShadow: isDragging 
          ? '0 8px 32px rgba(102, 126, 234, 0.3)' 
          : theme.effects.shadow.sm,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          color: theme.colors.text.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: theme.borderRadius.sm,
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
        title="Drag to reorder"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
          e.currentTarget.style.color = theme.colors.primary.dark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = theme.colors.text.muted;
        }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Completion Toggle */}
      <button
        onClick={() => onToggle(subtask.id)}
        style={{
          width: '24px',
          height: '24px',
          border: subtask.isCompleted 
            ? `2px solid ${theme.colors.status.success.dark}` 
            : `2px solid rgba(102, 126, 234, 0.3)`,
          background: subtask.isCompleted 
            ? theme.colors.status.success.dark 
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: theme.borderRadius.sm,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          boxShadow: subtask.isCompleted 
            ? '0 2px 8px rgba(16, 185, 129, 0.3)'
            : '0 1px 4px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={(e) => {
          if (!subtask.isCompleted) {
            e.currentTarget.style.borderColor = theme.colors.status.success.dark;
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.transform = 'scale(1.05)';
          } else {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!subtask.isCompleted) {
            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
          }
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {subtask.isCompleted && <Check className="w-3.5 h-3.5" style={{ color: 'white' }} />}
      </button>

      {/* Title - Editable */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          autoFocus
          style={{
            flex: 1,
            border: `2px solid ${theme.colors.primary.dark}`,
            borderRadius: theme.borderRadius.md,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.medium,
            outline: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.medium,
            color: subtask.isCompleted ? theme.colors.text.muted : theme.colors.text.primary,
            textDecoration: subtask.isCompleted ? 'line-through' : 'none',
            cursor: subtask.isCompleted ? 'default' : 'pointer',
            wordBreak: 'break-word',
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.sm,
            transition: 'all 0.2s ease',
            lineHeight: '1.4'
          }}
          onClick={() => !subtask.isCompleted && setIsEditing(true)}
          title={subtask.isCompleted ? '' : 'Click to edit'}
          onMouseEnter={(e) => {
            if (!subtask.isCompleted && !isEditing) {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!subtask.isCompleted && !isEditing) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {subtask.title}
        </span>
      )}

      {/* Action Buttons */}
      {!isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text.muted,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
            title="Edit subtask"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
              e.currentTarget.style.color = theme.colors.primary.dark;
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.color = theme.colors.text.muted;
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDeleteClick}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: showDeleteConfirm 
                ? theme.colors.status.error.dark 
                : 'rgba(255, 255, 255, 0.7)',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showDeleteConfirm ? 'white' : theme.colors.text.muted,
              transition: 'all 0.2s ease',
              boxShadow: showDeleteConfirm 
                ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
            title={showDeleteConfirm ? 'Click again to confirm deletion' : 'Delete subtask'}
            onMouseEnter={(e) => {
              if (!showDeleteConfirm) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = theme.colors.status.error.dark;
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
              } else {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showDeleteConfirm) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.color = theme.colors.text.muted;
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Actions */}
      {isEditing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <button
            onClick={handleSave}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              background: theme.colors.status.success.dark,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
            title="Save changes"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <Check className="w-4 h-4" />
          </button>

          <button
            onClick={handleCancel}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text.secondary,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
            title="Cancel editing"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = theme.colors.status.error.dark;
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.color = theme.colors.text.secondary;
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};