import React, { useState } from 'react';
import { Link2, Plus, X, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { theme } from '../../styles/theme';
import type { Task, TaskDependency, DependencyType } from '../../types';

interface TaskDependencyManagerProps {
  task: Task;
  allTasks: Task[];
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  onAddDependency: (taskId: string, dependsOnTaskId: string, type: DependencyType) => void;
  onRemoveDependency: (dependencyId: string) => void;
}

export const TaskDependencyManager: React.FC<TaskDependencyManagerProps> = ({
  task,
  allTasks,
  dependencies = [],
  dependents = [],
  onAddDependency,
  onRemoveDependency
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [dependencyType, setDependencyType] = useState<DependencyType>('finish_to_start');

  const availableTasks = allTasks.filter(t => 
    t.id !== task.id && 
    !dependencies.some(d => d.dependsOnTaskId === t.id)
  );

  const handleAddDependency = () => {
    if (selectedTaskId) {
      onAddDependency(task.id, selectedTaskId, dependencyType);
      setSelectedTaskId('');
      setShowAddForm(false);
    }
  };

  const getDependencyTypeLabel = (type: DependencyType) => {
    switch (type) {
      case 'finish_to_start':
        return 'Must finish before this starts';
      case 'start_to_start':
        return 'Must start before this starts';
      case 'finish_to_finish':
        return 'Must finish before this finishes';
      case 'start_to_finish':
        return 'Must start before this finishes';
    }
  };

  const getDependencyTypeIcon = (type: DependencyType) => {
    switch (type) {
      case 'finish_to_start':
        return '→';
      case 'start_to_start':
        return '⇉';
      case 'finish_to_finish':
        return '⇶';
      case 'start_to_finish':
        return '↷';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return theme.colors.status.success.dark;
      case 'in_progress':
        return '#3b82f6';
      case 'blocked':
        return theme.colors.status.error.dark;
      default:
        return theme.colors.text.muted;
    }
  };

  const canStartTask = () => {
    if (!dependencies || dependencies.length === 0) return true;
    
    return dependencies.every(dep => {
      const depTask = allTasks.find(t => t.id === dep.dependsOnTaskId);
      if (!depTask) return true;
      
      switch (dep.dependencyType) {
        case 'finish_to_start':
          return depTask.status === 'done';
        case 'start_to_start':
          return depTask.status !== 'todo';
        case 'finish_to_finish':
          return true; // Can start anytime
        case 'start_to_finish':
          return depTask.status !== 'todo';
        default:
          return true;
      }
    });
  };

  const isBlocked = task.status === 'todo' && !canStartTask();

  return (
    <div style={{
      background: theme.colors.surface.glass,
      backdropFilter: theme.effects.blur,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.surface.glassBorder}`,
      padding: theme.spacing.lg
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.lg
      }}>
        <Link2 className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
        <h3 style={{
          fontSize: theme.typography.sizes.base,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          flex: 1
        }}>
          Task Dependencies
        </h3>
        {isBlocked && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.sizes.xs,
            color: theme.colors.status.error.dark,
            fontWeight: theme.typography.weights.medium
          }}>
            <AlertCircle className="w-3 h-3" />
            Blocked
          </div>
        )}
      </div>

      {/* Dependencies (This task depends on) */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <div style={{
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.medium,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm
        }}>
          <Clock className="w-4 h-4" />
          This task depends on
        </div>

        {dependencies.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm
          }}>
            {dependencies.map(dep => {
              const depTask = allTasks.find(t => t.id === dep.dependsOnTaskId);
              if (!depTask) return null;

              return (
                <div
                  key={dep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.lg,
                    padding: theme.spacing.md,
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: theme.borderRadius.md,
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: theme.borderRadius.md,
                    background: `${getStatusColor(depTask.status)}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: getStatusColor(depTask.status)
                  }}>
                    {getDependencyTypeIcon(dep.dependencyType)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: theme.typography.sizes.sm,
                      fontWeight: theme.typography.weights.medium,
                      color: theme.colors.text.primary,
                      marginBottom: '2px'
                    }}>
                      {depTask.title}
                    </div>
                    <div style={{
                      fontSize: theme.typography.sizes.xs,
                      color: theme.colors.text.muted
                    }}>
                      {getDependencyTypeLabel(dep.dependencyType)}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: `${getStatusColor(depTask.status)}15`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.sizes.xs,
                    color: getStatusColor(depTask.status),
                    fontWeight: theme.typography.weights.medium
                  }}>
                    {depTask.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                    {depTask.status}
                  </div>

                  <button
                    onClick={() => onRemoveDependency(dep.id)}
                    style={{
                      width: '28px',
                      height: '28px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: theme.borderRadius.sm,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme.colors.text.muted,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = theme.colors.status.error.dark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme.colors.text.muted;
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.muted,
            fontSize: theme.typography.sizes.sm,
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: theme.borderRadius.md
          }}>
            No dependencies
          </div>
        )}

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              marginTop: theme.spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: 'transparent',
              color: theme.colors.primary.dark,
              border: `1px dashed ${theme.colors.primary.dark}`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
              e.currentTarget.style.borderStyle = 'solid';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderStyle = 'dashed';
            }}
          >
            <Plus className="w-4 h-4" />
            Add Dependency
          </button>
        )}

        {showAddForm && (
          <div style={{
            marginTop: theme.spacing.md,
            padding: theme.spacing.md,
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: theme.borderRadius.md,
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.sizes.sm,
                background: 'white',
                outline: 'none'
              }}
            >
              <option value="">Select a task...</option>
              {availableTasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.category})
                </option>
              ))}
            </select>

            <select
              value={dependencyType}
              onChange={(e) => setDependencyType(e.target.value as DependencyType)}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.md,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.sizes.sm,
                background: 'white',
                outline: 'none'
              }}
            >
              <option value="finish_to_start">Finish → Start (Must finish before this starts)</option>
              <option value="start_to_start">Start → Start (Must start before this starts)</option>
              <option value="finish_to_finish">Finish → Finish (Must finish before this finishes)</option>
              <option value="start_to_finish">Start → Finish (Must start before this finishes)</option>
            </select>

            <div style={{
              display: 'flex',
              gap: theme.spacing.sm
            }}>
              <button
                onClick={handleAddDependency}
                disabled={!selectedTaskId}
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  background: selectedTaskId ? theme.colors.primary.dark : theme.colors.text.muted,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: selectedTaskId ? 'pointer' : 'not-allowed',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  opacity: selectedTaskId ? 1 : 0.5
                }}
              >
                Add Dependency
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedTaskId('');
                }}
                style={{
                  padding: theme.spacing.sm,
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dependents (Tasks that depend on this) */}
      {dependents.length > 0 && (
        <div>
          <div style={{
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <ArrowRight className="w-4 h-4" />
            Tasks blocked by this
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm
          }}>
            {dependents.map(dep => {
              const depTask = allTasks.find(t => t.id === dep.taskId);
              if (!depTask) return null;

              return (
                <div
                  key={dep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.lg,
                    padding: theme.spacing.sm,
                    background: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.sizes.sm
                  }}
                >
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: theme.borderRadius.full,
                    background: getStatusColor(depTask.status)
                  }} />
                  <span style={{ color: theme.colors.text.primary }}>
                    {depTask.title}
                  </span>
                  <span style={{
                    fontSize: theme.typography.sizes.xs,
                    color: theme.colors.text.muted
                  }}>
                    ({getDependencyTypeLabel(dep.dependencyType).toLowerCase()})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};