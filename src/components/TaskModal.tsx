import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus } from '../types';
import { useTaskStore } from '../store/taskStore';
import { X, Plus, Check, Clock, AlertCircle, Edit3, Save, MessageSquare, Activity, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { SubtaskList } from './subtasks/SubtaskList';
import { AttachmentUpload } from './attachments/AttachmentUpload';
import { AttachmentList } from './attachments/AttachmentList';
import { ActivityTimeline } from './activity/ActivityTimeline';
import { CommentSection } from './activity/CommentSection';
import { SmartProgressManager } from './progress/SmartProgressManager';
import { TaskDependencyManager } from './dependencies/TaskDependencyManager';
import { theme } from '../styles/theme';

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  const { 
    tasks,
    updateTask, 
    addTaskUpdate, 
    addNote,
    updateProgressSettings,
    updateSubtaskWeight,
    addDependency,
    removeDependency,
  } = useTaskStore();
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [progressUpdate, setProgressUpdate] = useState('');
  const [newNote, setNewNote] = useState('');
  
  const [tempTitle, setTempTitle] = useState(task.title);
  const [tempDescription, setTempDescription] = useState(task.description || '');

  // Sync local state with task prop changes when not editing
  useEffect(() => {
    if (!editingTitle) {
      setTempTitle(task.title);
    }
  }, [task.title, editingTitle]);

  useEffect(() => {
    if (!editingDescription) {
      setTempDescription(task.description || '');
    }
  }, [task.description, editingDescription]);

  if (!isOpen) return null;

  const handleSaveTitle = () => {
    if (tempTitle.trim() && tempTitle !== task.title) {
      updateTask(task.id, { title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (tempDescription !== task.description) {
      updateTask(task.id, { description: tempDescription });
    }
    setEditingDescription(false);
  };


  const handleAddUpdate = () => {
    if (newUpdate.trim()) {
      const progressValue = progressUpdate ? parseInt(progressUpdate) : undefined;
      addTaskUpdate(task.id, newUpdate.trim(), progressValue);
      setNewUpdate('');
      setProgressUpdate('');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(task.id, newNote.trim());
      setNewNote('');
    }
  };

  const statusOptions: { value: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'todo', label: 'To Do', icon: <Clock className="w-4 h-4" />, color: 'text-gray-600' },
    { value: 'in_progress', label: 'In Progress', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600' },
    { value: 'done', label: 'Done', icon: <Check className="w-4 h-4" />, color: 'text-green-600' },
    { value: 'blocked', label: 'Blocked', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600' },
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: theme.spacing.lg
    }}>
      <div style={{
        background: theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderRadius: theme.borderRadius.xl,
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modern Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${theme.spacing.xl} ${theme.spacing.xl}`,
          borderBottom: `1px solid ${theme.colors.surface.glassBorder}`,
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ flex: 1, marginRight: theme.spacing.lg }}>
            {editingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTempTitle(task.title);
                      setEditingTitle(false);
                    }
                  }}
                  style={{
                    fontSize: theme.typography.sizes['2xl'],
                    fontWeight: theme.typography.weights.bold,
                    color: theme.colors.text.primary,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: `2px solid ${theme.colors.primary.dark}`,
                    borderRadius: theme.borderRadius.lg,
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    outline: 'none',
                    flex: 1,
                    minWidth: 0
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  style={{
                    padding: theme.spacing.md,
                    background: theme.colors.status.success.dark,
                    color: 'white',
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Save title"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <h2 style={{
                  fontSize: theme.typography.sizes['2xl'],
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text.primary,
                  margin: 0,
                  cursor: 'pointer',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.borderRadius.md,
                  transition: 'all 0.2s ease',
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-word'
                }}
                onClick={() => setEditingTitle(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                >
                  {task.title}
                </h2>
                <Edit3 
                  className="w-4 h-4" 
                  style={{ 
                    color: theme.colors.text.muted,
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditingTitle(true)}
                />
              </div>
            )}
          </div>
          
          {/* Category Badge */}
          <div style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: 'rgba(102, 126, 234, 0.15)',
            color: theme.colors.primary.dark,
            borderRadius: theme.borderRadius.full,
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.medium,
            marginRight: theme.spacing.md
          }}>
            {task.category.replace('_', ' ').toUpperCase()}
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: theme.spacing.md,
              background: 'none',
              border: 'none',
              color: theme.colors.text.muted,
              cursor: 'pointer',
              borderRadius: theme.borderRadius.full,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = theme.colors.status.error.dark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = theme.colors.text.muted;
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          height: 'calc(90vh - 180px)',
          minHeight: '500px'
        }}>
          {/* Main Content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: theme.spacing.xl,
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            {/* Status and Priority Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: theme.spacing.lg, 
              marginBottom: theme.spacing.xl 
            }}>
              {/* Status Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm
                }}>
                  Status
                </label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    border: `1px solid ${theme.colors.surface.glassBorder}`,
                    borderRadius: theme.borderRadius.lg,
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.medium,
                    background: theme.colors.surface.glass,
                    backdropFilter: theme.effects.blur,
                    color: theme.colors.text.primary,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary.dark;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Due Date Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm
                }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    border: `1px solid ${theme.colors.surface.glassBorder}`,
                    borderRadius: theme.borderRadius.lg,
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    fontSize: theme.typography.sizes.base,
                    fontWeight: theme.typography.weights.medium,
                    background: theme.colors.surface.glass,
                    backdropFilter: theme.effects.blur,
                    color: theme.colors.text.primary,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary.dark;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Progress Section */}
            {task.progressTotal && (
              <div style={{ marginBottom: theme.spacing.xl }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm
                }}>
                  Progress
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: theme.spacing.lg,
                  padding: theme.spacing.lg,
                  background: theme.colors.surface.glass,
                  backdropFilter: theme.effects.blur,
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.surface.glassBorder}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: theme.borderRadius.full,
                      overflow: 'hidden',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: theme.borderRadius.full,
                        width: `${(task.progressCurrent || 0) / task.progressTotal * 100}%`,
                        transition: 'width 0.3s ease',
                        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                      }} />
                    </div>
                    <div style={{
                      marginTop: theme.spacing.xs,
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.text.secondary,
                      textAlign: 'center'
                    }}>
                      {Math.round((task.progressCurrent || 0) / task.progressTotal * 100)}% Complete
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <input
                      type="number"
                      value={task.progressCurrent || 0}
                      onChange={(e) => updateTask(task.id, { progressCurrent: parseInt(e.target.value) || 0 })}
                      min="0"
                      max={task.progressTotal}
                      style={{
                        width: '80px',
                        maxWidth: '80px',
                        border: `1px solid ${theme.colors.surface.glassBorder}`,
                        borderRadius: theme.borderRadius.md,
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        fontSize: theme.typography.sizes.sm,
                        fontWeight: theme.typography.weights.medium,
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: theme.colors.text.primary,
                        outline: 'none',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.primary.dark;
                        e.currentTarget.style.boxShadow = `0 0 0 2px rgba(102, 126, 234, 0.1)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.weights.medium
                    }}>
                      / {task.progressTotal}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <label style={{
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text.primary
                }}>
                  Description
                </label>
                {!editingDescription && (
                  <Edit3 
                    className="w-4 h-4" 
                    style={{ 
                      color: theme.colors.text.muted,
                      cursor: 'pointer'
                    }}
                    onClick={() => setEditingDescription(true)}
                  />
                )}
              </div>
              
              {editingDescription ? (
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setTempDescription(task.description || '');
                        setEditingDescription(false);
                      }
                      if (e.key === 'Enter' && e.metaKey) {
                        handleSaveDescription();
                      }
                    }}
                    placeholder="Add a detailed description..."
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      border: `2px solid ${theme.colors.primary.dark}`,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.lg,
                      fontSize: theme.typography.sizes.base,
                      fontWeight: theme.typography.weights.medium,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      color: theme.colors.text.primary,
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: '1.5',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: theme.spacing.sm,
                    marginTop: theme.spacing.sm
                  }}>
                    <button
                      onClick={() => {
                        setTempDescription(task.description || '');
                        setEditingDescription(false);
                      }}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.surface.glassBorder}`,
                        borderRadius: theme.borderRadius.md,
                        cursor: 'pointer',
                        fontSize: theme.typography.sizes.sm,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        background: theme.colors.primary.dark,
                        color: 'white',
                        border: 'none',
                        borderRadius: theme.borderRadius.md,
                        cursor: 'pointer',
                        fontSize: theme.typography.sizes.sm,
                        fontWeight: theme.typography.weights.semibold,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      Save Description
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    border: `1px solid ${theme.colors.surface.glassBorder}`,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    background: theme.colors.surface.glass,
                    backdropFilter: theme.effects.blur,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    overflowY: 'auto'
                  }}
                  onClick={() => setEditingDescription(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.surface.glass;
                    e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
                  }}
                >
                  {task.description ? (
                    <p style={{
                      fontSize: theme.typography.sizes.base,
                      color: theme.colors.text.primary,
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {task.description}
                    </p>
                  ) : (
                    <p style={{
                      fontSize: theme.typography.sizes.base,
                      color: theme.colors.text.muted,
                      fontStyle: 'italic',
                      margin: 0
                    }}>
                      Click to add a detailed description...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Subtasks */}
            <SubtaskList taskId={task.id} subtasks={task.subtasks || []} />

            {/* Smart Progress Tracking */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div style={{ marginBottom: theme.spacing.xl }}>
                <SmartProgressManager 
                  task={task}
                  onUpdateProgress={updateProgressSettings}
                  onUpdateSubtaskWeight={updateSubtaskWeight}
                />
              </div>
            )}

            {/* Task Dependencies */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <TaskDependencyManager
                task={task}
                allTasks={tasks}
                dependencies={task.dependencies || []}
                dependents={task.dependents || []}
                onAddDependency={addDependency}
                onRemoveDependency={removeDependency}
              />
            </div>

            {/* Add Update Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <Activity className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
                <label style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text.primary
                }}>
                  Add Progress Update
                </label>
              </div>
              
              <div style={{ 
                padding: theme.spacing.lg,
                background: 'rgba(102, 126, 234, 0.03)',
                backdropFilter: theme.effects.blur,
                borderRadius: theme.borderRadius.lg,
                border: `2px solid rgba(102, 126, 234, 0.15)`,
                boxShadow: 'inset 0 1px 3px rgba(102, 126, 234, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}>
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="What progress did you make? Share updates, blockers, or achievements..."
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minHeight: '80px',
                    border: `2px solid rgba(0, 0, 0, 0.1)`,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    fontSize: theme.typography.sizes.base,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    color: theme.colors.text.primary,
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary.dark;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
                
                <div style={{ position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    Progress Value (Optional)
                  </label>
                  <input
                    type="number"
                    value={progressUpdate}
                    onChange={(e) => setProgressUpdate(e.target.value)}
                    placeholder={task.progressTotal ? `Enter value (0-${task.progressTotal})` : 'Enter progress value'}
                    min="0"
                    max={task.progressTotal || undefined}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      border: `2px solid rgba(0, 0, 0, 0.1)`,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      paddingRight: task.progressTotal ? '60px' : theme.spacing.md, // Make room for the "/ max" indicator if total exists
                      fontSize: theme.typography.sizes.base,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      color: theme.colors.text.primary,
                      outline: 'none',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary.dark;
                      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                    }}
                  />
                  {task.progressTotal && (
                    <div style={{
                      position: 'absolute',
                      right: theme.spacing.md,
                      bottom: theme.spacing.md,
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.text.muted,
                      pointerEvents: 'none',
                      fontWeight: theme.typography.weights.medium
                    }}>
                      / {task.progressTotal}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  marginTop: theme.spacing.sm,
                  paddingTop: theme.spacing.md,
                  borderTop: `1px solid rgba(102, 126, 234, 0.1)`
                }}>
                  <button
                    onClick={handleAddUpdate}
                    disabled={!newUpdate.trim()}
                    style={{
                      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                      background: newUpdate.trim() 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(0, 0, 0, 0.2)',
                      color: 'white',
                      border: newUpdate.trim()
                        ? '2px solid rgba(102, 126, 234, 0.3)'
                        : '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: theme.borderRadius.lg,
                      cursor: newUpdate.trim() ? 'pointer' : 'not-allowed',
                      fontSize: theme.typography.sizes.base,
                      fontWeight: theme.typography.weights.bold,
                      transition: 'all 0.2s ease',
                      boxShadow: newUpdate.trim() 
                        ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      minWidth: '140px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (newUpdate.trim()) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newUpdate.trim()) {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Sidebar */}
          <div style={{
            width: '400px',
            borderLeft: `1px solid ${theme.colors.surface.glassBorder}`,
            padding: theme.spacing.xl,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            overflowY: 'auto'
          }}>
            {/* Recent Updates */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <Activity className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
                <h3 style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text.primary,
                  margin: 0
                }}>
                  Recent Updates
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {task.updates?.slice(0, 5).map(update => (
                  <div 
                    key={update.id} 
                    style={{
                      padding: theme.spacing.md,
                      background: theme.colors.surface.glass,
                      backdropFilter: theme.effects.blur,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.surface.glassBorder}`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.colors.surface.glass;
                      e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
                    }}
                  >
                    <div style={{
                      fontSize: theme.typography.sizes.xs,
                      color: theme.colors.text.muted,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.typography.weights.medium
                    }}>
                      {(() => {
                        try {
                          if (update.createdAt) {
                            const date = new Date(update.createdAt);
                            if (!isNaN(date.getTime())) {
                              return format(date, 'MMM d, h:mm a');
                            }
                          }
                          return 'Just now';
                        } catch (error) {
                          return 'Just now';
                        }
                      })()}
                    </div>
                    <div style={{
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.text.primary,
                      lineHeight: '1.4',
                      marginBottom: update.progressValue !== undefined ? theme.spacing.xs : 0
                    }}>
                      {update.updateText}
                    </div>
                    {update.progressValue !== undefined && (
                      <div style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.status.success.dark,
                        fontWeight: theme.typography.weights.semibold,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: theme.borderRadius.sm,
                        display: 'inline-block'
                      }}>
                        Progress: {update.progressValue}
                      </div>
                    )}
                  </div>
                ))}
                {!task.updates?.length && (
                  <div style={{
                    padding: theme.spacing.lg,
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: theme.typography.sizes.sm,
                    fontStyle: 'italic'
                  }}>
                    <Activity className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                    No updates yet. Add your first progress update above!
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div style={{ marginBottom: theme.spacing.xl }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <Paperclip className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
                <h3 style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text.primary,
                  margin: 0
                }}>
                  Attachments {task.attachments && task.attachments.length > 0 && `(${task.attachments.length})`}
                </h3>
              </div>
              
              <AttachmentList attachments={task.attachments || []} />
              
              <div style={{ marginTop: theme.spacing.lg }}>
                <AttachmentUpload taskId={task.id} />
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <MessageSquare className="w-5 h-5" style={{ color: theme.colors.status.warning.dark }} />
                <h3 style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text.primary,
                  margin: 0
                }}>
                  Notes
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                {task.notes?.slice(0, 3).map(note => (
                  <div 
                    key={note.id} 
                    style={{
                      padding: theme.spacing.md,
                      background: 'rgba(255, 193, 7, 0.1)',
                      backdropFilter: theme.effects.blur,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid rgba(255, 193, 7, 0.3)`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 193, 7, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.3)';
                    }}
                  >
                    <div style={{
                      fontSize: theme.typography.sizes.xs,
                      color: theme.colors.text.muted,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.typography.weights.medium
                    }}>
                      {(() => {
                        try {
                          if (note.createdAt) {
                            const date = new Date(note.createdAt);
                            if (!isNaN(date.getTime())) {
                              return format(date, 'MMM d, h:mm a');
                            }
                          }
                          return 'Just now';
                        } catch (error) {
                          return 'Just now';
                        }
                      })()}
                    </div>
                    <div style={{
                      fontSize: theme.typography.sizes.sm,
                      color: theme.colors.text.primary,
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.4'
                    }}>
                      {note.content}
                    </div>
                  </div>
                ))}
                {!task.notes?.length && (
                  <div style={{
                    padding: theme.spacing.lg,
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: theme.typography.sizes.sm,
                    fontStyle: 'italic'
                  }}>
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
                    No notes yet. Add your first note below!
                  </div>
                )}
              </div>
              
              <div style={{ 
                padding: theme.spacing.md,
                background: theme.colors.surface.glass,
                backdropFilter: theme.effects.blur,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.surface.glassBorder}`,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm
              }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a quick note, reminder, or thought..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    border: `1px solid ${theme.colors.surface.glassBorder}`,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.sm,
                    fontSize: theme.typography.sizes.sm,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: theme.colors.text.primary,
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: '1.4'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.status.warning.dark;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(255, 193, 7, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    background: newNote.trim() 
                      ? theme.colors.status.warning.dark
                      : theme.colors.text.muted,
                    color: 'white',
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.semibold,
                    transition: 'all 0.2s ease',
                    boxShadow: newNote.trim() 
                      ? '0 4px 12px rgba(255, 193, 7, 0.3)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.xs
                  }}
                  onMouseEnter={(e) => {
                    if (newNote.trim()) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 193, 7, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newNote.trim()) {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div style={{ marginTop: theme.spacing['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
                <MessageSquare className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
                <h3 style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text.primary,
                  margin: 0
                }}>
                  Comments
                </h3>
              </div>
              <CommentSection taskId={task.id} comments={task.comments || []} />
            </div>

            {/* Activity Timeline */}
            <div style={{ marginTop: theme.spacing['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
                <Activity className="w-5 h-5" style={{ color: theme.colors.status.info.dark }} />
                <h3 style={{
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.bold,
                  color: theme.colors.text.primary,
                  margin: 0
                }}>
                  Activity
                </h3>
              </div>
              <ActivityTimeline activities={task.activities || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};