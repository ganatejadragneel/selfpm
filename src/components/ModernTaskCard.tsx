import React, { useState } from 'react';
import type { Task } from '../types';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { theme, styleUtils } from '../styles/theme';
import { useTaskPriority } from '../hooks/useTaskPriority';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper function to parse date string without timezone conversion
const parseLocalDate = (dateString: string): Date => {
  // Split the date string (YYYY-MM-DD) and create date with local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

interface ModernTaskCardProps {
  task: Task;
  categoryConfig: any;
  onClick: () => void;
  onStatusToggle: () => void;
  onDelete: () => void;
}

export const ModernTaskCard: React.FC<ModernTaskCardProps> = ({ 
  task, 
  categoryConfig, 
  onClick, 
  onStatusToggle,
  onDelete 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { getPriorityStyle, getDueDateBadgeStyle } = useTaskPriority();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const getStatusIcon = () => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (task.status) {
      case 'done':
        return <CheckCircle2 {...iconProps} style={{ color: theme.colors.status.success.dark }} />;
      case 'in_progress':
        return <Clock {...iconProps} style={{ color: theme.colors.status.info.dark }} />;
      case 'blocked':
        return <AlertCircle {...iconProps} style={{ color: theme.colors.status.error.dark }} />;
      default:
        return <Circle {...iconProps} style={{ color: theme.colors.text.muted }} />;
    }
  };

  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const priorityStyle = getPriorityStyle(task, categoryConfig.accentColor);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...priorityStyle,
        borderRadius: theme.borderRadius.lg,
        border: isDragging 
          ? `2px solid ${categoryConfig.accentColor}` 
          : `1px solid ${theme.colors.surface.glassBorder}`,
        cursor: isDragging ? 'grabbing' : 'pointer',
        transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: theme.effects.blur,
        boxShadow: isDragging 
          ? `0 8px 32px ${categoryConfig.accentColor}44` 
          : theme.effects.shadow.sm,
        overflow: 'hidden',
        opacity: isDragging ? 0.8 : (task.status === 'done' ? 0.75 : 1),
        transform: isDragging ? `${style.transform} rotate(2deg)` : style.transform,
        zIndex: isDragging ? 1000 : 'auto',
        touchAction: 'none'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = theme.effects.shadow.md;
          e.currentTarget.style.borderColor = `${categoryConfig.accentColor}44`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = theme.effects.shadow.sm;
          e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
        }
      }}
    >
      <div 
        style={{ padding: theme.spacing.lg, display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}
        {...attributes}
        {...listeners}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusToggle();
          }}
          style={{
            ...styleUtils.button.icon(),
            marginTop: '2px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${categoryConfig.accentColor}15`;
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {getStatusIcon()}
        </button>
        
        <div 
          style={{ flex: 1, minWidth: 0 }}
          onClick={() => {
            // Only trigger onClick if not dragging
            if (!isDragging) {
              onClick();
            }
          }}
        >
          <h3 style={{
            fontSize: theme.typography.sizes.lg,
            fontWeight: theme.typography.weights.semibold,
            color: task.status === 'done' ? theme.colors.text.muted : theme.colors.text.primary,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            lineHeight: '1.4',
            margin: `0 0 ${theme.spacing.sm} 0`,
            wordBreak: 'break-word'
          }}>
            {task.title}
          </h3>
          
          {task.description && (
            <p style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.secondary,
              lineHeight: '1.4',
              margin: `0 0 ${theme.spacing.md} 0`,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {task.description}
            </p>
          )}
          
          {/* Task Metadata */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm, alignItems: 'center' }}>
            {task.dueDate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.sizes.xs,
                ...getDueDateBadgeStyle(task.dueDate, task.status)
              }}>
                <Calendar className="w-3 h-3" />
                {format(parseLocalDate(task.dueDate), 'MMM d')}
              </div>
            )}
            
            {totalSubtasks > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.sizes.xs,
                fontWeight: theme.typography.weights.medium,
                background: theme.colors.status.info.light,
                color: '#2563eb'
              }}>
                ✓ {completedSubtasks}/{totalSubtasks}
              </div>
            )}
            
            {task.progressTotal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <div style={{
                  width: '60px',
                  height: '4px',
                  background: 'rgba(229, 231, 235, 0.8)',
                  borderRadius: theme.spacing.xs,
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: categoryConfig.gradient,
                      borderRadius: theme.spacing.xs,
                      transition: 'all 0.3s ease',
                      width: `${(task.progressCurrent || 0) / task.progressTotal * 100}%`
                    }}
                  />
                </div>
                <span style={{
                  fontSize: theme.typography.sizes.xs,
                  fontWeight: theme.typography.weights.semibold,
                  color: '#4b5563',
                  minWidth: '45px'
                }}>
                  {task.progressCurrent}/{task.progressTotal}
                </span>
              </div>
            )}
            
            {task.isRecurring && (
              <div style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: '11px',
                fontWeight: theme.typography.weights.semibold,
                background: theme.colors.status.purple.light,
                color: '#7c3aed'
              }}>
                🔄 Weekly
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, alignItems: 'center' }}>
          <button
            onClick={handleDeleteClick}
            style={{
              border: 'none',
              background: showDeleteConfirm ? theme.colors.status.error.dark : theme.colors.status.error.light,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: theme.borderRadius.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: showDeleteConfirm ? 1 : 0.7
            }}
            title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete task'}
            onMouseEnter={(e) => {
              if (!showDeleteConfirm) {
                e.currentTarget.style.background = theme.colors.status.error.medium;
                e.currentTarget.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (!showDeleteConfirm) {
                e.currentTarget.style.background = theme.colors.status.error.light;
                e.currentTarget.style.opacity = '0.7';
              }
            }}
          >
            <Trash2 
              className="w-3 h-3" 
              style={{ 
                color: showDeleteConfirm ? 'white' : theme.colors.status.error.dark
              }} 
            />
          </button>
          
          <ChevronRight 
            className="w-4 h-4" 
            style={{ 
              color: theme.colors.text.muted, 
              opacity: 0.6,
              transition: 'all 0.2s ease'
            }} 
          />
        </div>
      </div>
    </div>
  );
};