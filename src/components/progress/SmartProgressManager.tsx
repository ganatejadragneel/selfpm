import React, { useState } from 'react';
import { Calculator, Zap, Settings, Info, CheckCircle2 } from 'lucide-react';
import { theme } from '../../styles/theme';
import type { Task } from '../../types';

interface SmartProgressManagerProps {
  task: Task;
  onUpdateProgress: (taskId: string, settings: {
    autoProgress: boolean;
    weightedProgress: boolean;
  }) => void;
  onUpdateSubtaskWeight: (subtaskId: string, weight: number) => void;
}

export const SmartProgressManager: React.FC<SmartProgressManagerProps> = ({
  task,
  onUpdateProgress,
  onUpdateSubtaskWeight
}) => {
  const [autoProgress, setAutoProgress] = useState(task.autoProgress || false);
  const [weightedProgress, setWeightedProgress] = useState(task.weightedProgress || false);
  const [showWeightEditor, setShowWeightEditor] = useState(false);

  const calculateProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.progressCurrent || 0;
    }

    if (autoProgress) {
      if (weightedProgress) {
        // Calculate weighted progress
        const totalWeight = task.subtasks.reduce((sum, st) => sum + (st.weight || 1), 0);
        const completedWeight = task.subtasks
          .filter(st => st.isCompleted)
          .reduce((sum, st) => sum + (st.weight || 1), 0);
        return Math.round((completedWeight / totalWeight) * 100);
      } else {
        // Simple percentage based on completed subtasks
        const completed = task.subtasks.filter(st => st.isCompleted).length;
        return Math.round((completed / task.subtasks.length) * 100);
      }
    }

    return task.progressCurrent || 0;
  };

  const handleToggleAutoProgress = () => {
    const newValue = !autoProgress;
    setAutoProgress(newValue);
    onUpdateProgress(task.id, {
      autoProgress: newValue,
      weightedProgress
    });
  };

  const handleToggleWeightedProgress = () => {
    const newValue = !weightedProgress;
    setWeightedProgress(newValue);
    onUpdateProgress(task.id, {
      autoProgress,
      weightedProgress: newValue
    });
    if (newValue && !showWeightEditor) {
      setShowWeightEditor(true);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return theme.colors.status.success.dark;
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return theme.colors.status.warning.dark;
    return theme.colors.text.muted;
  };

  const calculatedProgress = calculateProgress();

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
        <Calculator className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
        <h3 style={{
          fontSize: theme.typography.sizes.base,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          flex: 1
        }}>
          Smart Progress Tracking
        </h3>
        <Settings
          className="w-4 h-4"
          style={{ 
            color: theme.colors.text.muted,
            cursor: 'pointer'
          }}
          onClick={() => setShowWeightEditor(!showWeightEditor)}
        />
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.sm
        }}>
          <span style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.secondary
          }}>
            Progress
          </span>
          <span style={{
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: getProgressColor(calculatedProgress)
          }}>
            {calculatedProgress}%
          </span>
        </div>
        <div style={{
          height: '8px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: theme.borderRadius.full,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${calculatedProgress}%`,
            background: `linear-gradient(90deg, ${getProgressColor(calculatedProgress)} 0%, ${getProgressColor(calculatedProgress)}dd 100%)`,
            transition: 'all 0.3s ease',
            borderRadius: theme.borderRadius.full
          }} />
        </div>
      </div>

      {/* Auto Progress Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        background: autoProgress ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${autoProgress ? 'rgba(102, 126, 234, 0.2)' : 'transparent'}`,
        transition: 'all 0.2s ease'
      }}>
        <button
          onClick={handleToggleAutoProgress}
          style={{
            width: '48px',
            height: '24px',
            borderRadius: theme.borderRadius.full,
            background: autoProgress ? theme.colors.primary.dark : 'rgba(0, 0, 0, 0.2)',
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: theme.borderRadius.full,
            background: 'white',
            position: 'absolute',
            top: '2px',
            left: autoProgress ? '26px' : '2px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            color: theme.colors.text.primary,
            marginBottom: '2px'
          }}>
            Automatic Progress Calculation
          </div>
          <div style={{
            fontSize: theme.typography.sizes.xs,
            color: theme.colors.text.muted
          }}>
            Progress updates automatically based on subtask completion
          </div>
        </div>
        <Zap 
          className="w-4 h-4" 
          style={{ 
            color: autoProgress ? theme.colors.primary.dark : theme.colors.text.muted,
            opacity: autoProgress ? 1 : 0.5
          }} 
        />
      </div>

      {/* Weighted Progress Toggle */}
      {autoProgress && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          background: weightedProgress ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${weightedProgress ? 'rgba(139, 92, 246, 0.2)' : 'transparent'}`,
          transition: 'all 0.2s ease'
        }}>
          <button
            onClick={handleToggleWeightedProgress}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: theme.borderRadius.full,
              background: weightedProgress ? '#8b5cf6' : 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: theme.borderRadius.full,
              background: 'white',
              position: 'absolute',
              top: '2px',
              left: weightedProgress ? '26px' : '2px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.text.primary,
              marginBottom: '2px'
            }}>
              Weighted Subtasks
            </div>
            <div style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.text.muted
            }}>
              Assign importance weights to subtasks (1-10)
            </div>
          </div>
        </div>
      )}

      {/* Weight Editor */}
      {showWeightEditor && weightedProgress && task.subtasks && task.subtasks.length > 0 && (
        <div style={{
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          background: 'rgba(139, 92, 246, 0.02)',
          borderRadius: theme.borderRadius.md,
          border: '1px solid rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <Info className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            Subtask Weights
          </div>

          {task.subtasks.map(subtask => (
            <div
              key={subtask.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                padding: theme.spacing.sm,
                background: 'white',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              {subtask.isCompleted && (
                <CheckCircle2 
                  className="w-4 h-4" 
                  style={{ color: theme.colors.status.success.dark }} 
                />
              )}
              <span style={{
                flex: 1,
                fontSize: theme.typography.sizes.sm,
                color: subtask.isCompleted ? theme.colors.text.muted : theme.colors.text.primary,
                textDecoration: subtask.isCompleted ? 'line-through' : 'none'
              }}>
                {subtask.title}
              </span>
              <input
                type="range"
                min="1"
                max="10"
                value={subtask.weight || 1}
                onChange={(e) => onUpdateSubtaskWeight(subtask.id, parseInt(e.target.value))}
                style={{
                  width: '100px',
                  accentColor: '#8b5cf6'
                }}
              />
              <span style={{
                width: '30px',
                textAlign: 'center',
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                color: '#8b5cf6'
              }}>
                {subtask.weight || 1}
              </span>
            </div>
          ))}

          <div style={{
            marginTop: theme.spacing.md,
            padding: theme.spacing.sm,
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.sizes.xs,
            color: theme.colors.text.secondary
          }}>
            <strong>Tip:</strong> Higher weights mean the subtask contributes more to overall progress
          </div>
        </div>
      )}
    </div>
  );
};