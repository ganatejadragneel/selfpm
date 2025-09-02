import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme } from '../../styles/theme';
import { formStyles } from '../../styles/formStyles';
import { Edit2, Trash2, Check, X, Plus, Calendar, Settings, Target, AlertTriangle } from 'lucide-react';
import type { CustomDailyTask } from '../../types';

export const DailyTasksView: React.FC = () => {
  const { user } = useSupabaseAuthStore();
  const [tasks, setTasks] = useState<CustomDailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', type: 'yes_no' as 'yes_no' | 'dropdown', options: [''] });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const { data: tasksData, error: tasksError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('new_user_id', user.id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData as CustomDailyTask[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const startEdit = (task: CustomDailyTask) => {
    setEditingTask(task.id);
    setEditForm({
      name: task.name,
      description: task.description || '',
      type: task.type,
      options: task.type === 'dropdown' && task.options ? [...task.options] : ['']
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditForm({ name: '', description: '', type: 'yes_no', options: [''] });
  };

  const saveEdit = async () => {
    if (!editingTask) return;

    try {
      const updatedTask = {
        name: editForm.name,
        description: editForm.description,
        type: editForm.type,
        options: editForm.type === 'dropdown' ? editForm.options.filter(opt => opt.trim()) : null,
      };

      const { error: updateError } = await supabase
        .from('custom_tasks')
        .update(updatedTask)
        .eq('id', editingTask);

      if (updateError) throw updateError;

      // Update local state
      setTasks(tasks.map(task => 
        task.id === editingTask ? { ...task, ...updatedTask } : task
      ));

      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const confirmDelete = (taskId: string) => {
    setDeleteConfirmId(taskId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error: deleteError } = await supabase
        .from('custom_tasks')
        .delete()
        .eq('id', deleteConfirmId);

      if (deleteError) throw deleteError;

      // Update local state
      setTasks(tasks.filter(task => task.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setDeleteConfirmId(null);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...editForm.options];
    newOptions[index] = value;
    setEditForm({ ...editForm, options: newOptions });
  };

  const addOption = () => {
    setEditForm({ ...editForm, options: [...editForm.options, ''] });
  };

  const removeOption = (index: number) => {
    const newOptions = editForm.options.filter((_, i) => i !== index);
    setEditForm({ ...editForm, options: newOptions });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        borderRadius: theme.borderRadius.xl,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: `3px solid ${theme.colors.primary.light}30`,
          borderTop: `3px solid ${theme.colors.primary.light}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: theme.spacing.md
        }} />
        <span style={{ color: theme.colors.text.secondary, fontWeight: 500 }}>Loading your daily tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        border: `2px solid ${theme.colors.status.error.light}`,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md
      }}>
        <AlertTriangle size={24} color={theme.colors.status.error.dark} />
        <span style={{ color: theme.colors.status.error.dark, fontWeight: 500 }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing['2xl'],
      border: '1px solid rgba(255, 255, 255, 0.8)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${theme.colors.status.success.light}, ${theme.colors.primary.light})`
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: theme.borderRadius.lg,
          background: theme.colors.status.success.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <Calendar size={24} color="white" />
        </div>
        <div>
          <h3 style={{
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
            background: `linear-gradient(135deg, ${theme.colors.status.success.dark}, ${theme.colors.primary.dark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Your Daily Tasks</h3>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.secondary,
            margin: 0
          }}>Manage and customize your daily tracking tasks</p>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['3xl'],
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
          borderRadius: theme.borderRadius.xl,
          border: `2px dashed ${theme.colors.primary.light}40`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: theme.borderRadius.lg,
            background: `linear-gradient(135deg, ${theme.colors.primary.light}20, ${theme.colors.status.info.light}20)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto ' + theme.spacing.lg,
            border: `2px solid ${theme.colors.primary.light}30`
          }}>
            <Target size={32} color={theme.colors.primary.light} />
          </div>
          <h4 style={{
            fontSize: theme.typography.sizes.lg,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm
          }}>No Daily Tasks Yet</h4>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.secondary,
            margin: 0,
            maxWidth: '300px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>Create your first custom daily task using the "Add Custom Task" form above to start tracking your daily habits and goals!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: theme.spacing.lg,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)',
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              border: `2px solid ${theme.colors.border.light}40`,
              backdropFilter: 'blur(15px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Task type indicator */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                background: task.type === 'yes_no' 
                  ? theme.colors.status.success.gradient 
                  : theme.colors.primary.gradient,
                borderRadius: `0 0 0 ${theme.borderRadius.md}`,
                fontSize: theme.typography.sizes.xs,
                color: 'white',
                fontWeight: theme.typography.weights.semibold,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {task.type === 'yes_no' ? 'Binary' : 'Options'}
              </div>
              
              {editingTask === task.id ? (
                // Edit Mode
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                  border: `1px solid ${theme.colors.primary.light}20`,
                  marginTop: theme.spacing.md
                }}>
                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label style={{
                      ...formStyles.label,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs
                    }}>
                      <div style={{
                        width: '4px',
                        height: '16px',
                        background: theme.colors.primary.gradient,
                        borderRadius: '2px'
                      }} />
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={formStyles.enhancedInput}
                      placeholder="Enter task name"
                    />
                  </div>

                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label style={{
                      ...formStyles.label,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs
                    }}>
                      <div style={{
                        width: '4px',
                        height: '16px',
                        background: theme.colors.status.info.gradient,
                        borderRadius: '2px'
                      }} />
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      style={{ 
                        ...formStyles.enhancedInput, 
                        height: '80px', 
                        resize: 'vertical' as const,
                        fontFamily: 'inherit'
                      }}
                      placeholder="Enter task description"
                    />
                  </div>

                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={{
                      ...formStyles.label,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs
                    }}>
                      <div style={{
                        width: '4px',
                        height: '16px',
                        background: theme.colors.status.warning.gradient,
                        borderRadius: '2px'
                      }} />
                      Task Type
                    </label>
                    <div style={{ display: 'flex', gap: theme.spacing.md }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          value="yes_no"
                          checked={editForm.type === 'yes_no'}
                          onChange={() => setEditForm({ ...editForm, type: 'yes_no' })}
                        />
                        Done / Not Done
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          value="dropdown"
                          checked={editForm.type === 'dropdown'}
                          onChange={() => setEditForm({ ...editForm, type: 'dropdown' })}
                        />
                        Dropdown
                      </label>
                    </div>
                  </div>

                  {editForm.type === 'dropdown' && (
                    <div style={{ marginBottom: theme.spacing.md }}>
                      <label style={{
                        ...formStyles.label,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs
                      }}>
                        <div style={{
                          width: '4px',
                          height: '16px',
                          background: theme.colors.primary.gradient,
                          borderRadius: '2px'
                        }} />
                        Dropdown Options
                      </label>
                      {editForm.options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            style={{ ...formStyles.enhancedInput, flex: 1 }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            style={{
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                              border: `1px solid ${theme.colors.status.error.light}`,
                              borderRadius: theme.borderRadius.md,
                              color: theme.colors.status.error.dark,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              flexShrink: 0
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addOption}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          background: 'none',
                          border: `1px dashed ${theme.colors.text.muted}`,
                          color: theme.colors.text.secondary,
                          padding: theme.spacing.sm,
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={16} />
                        Add Option
                      </button>
                    </div>
                  )}

                  <div style={{
                    display: 'flex', 
                    gap: theme.spacing.md,
                    marginTop: theme.spacing.xl,
                    paddingTop: theme.spacing.lg,
                    borderTop: `1px solid ${theme.colors.border.light}40`
                  }}>
                    <button onClick={saveEdit} style={{
                      ...formStyles.successButton,
                      flex: 1
                    }}>
                      <Check size={16} />
                      Save Changes
                    </button>
                    <button onClick={cancelEdit} style={{
                      ...formStyles.secondaryButton,
                      flex: 1
                    }}>
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div style={{ paddingTop: theme.spacing.md }}>
                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: theme.spacing.md,
                      marginBottom: theme.spacing.sm
                    }}>
                      <div style={{
                        width: '6px',
                        height: '32px',
                        background: task.type === 'yes_no' 
                          ? theme.colors.status.success.gradient
                          : theme.colors.primary.gradient,
                        borderRadius: '3px',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: theme.typography.sizes.lg,
                          fontWeight: theme.typography.weights.bold,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing.xs,
                          lineHeight: 1.2
                        }}>
                          {task.name}
                        </h4>
                        {task.description && (
                          <p style={{
                            fontSize: theme.typography.sizes.sm,
                            color: theme.colors.text.secondary,
                            marginBottom: theme.spacing.md,
                            lineHeight: 1.4,
                            fontStyle: 'italic'
                          }}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Task details */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.border.light}30`,
                      marginBottom: theme.spacing.lg
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        marginBottom: theme.spacing.xs
                      }}>
                        <Settings size={16} color={theme.colors.text.muted} />
                        <span style={{
                          fontSize: theme.typography.sizes.xs,
                          fontWeight: theme.typography.weights.semibold,
                          color: theme.colors.text.secondary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Configuration</span>
                      </div>
                      <div style={{
                        fontSize: theme.typography.sizes.sm,
                        color: theme.colors.text.primary,
                        fontWeight: 500
                      }}>
                        <span>Type: {task.type === 'yes_no' ? 'Done / Not Done' : 'Dropdown'}</span>
                        {task.type === 'dropdown' && task.options && (
                          <div style={{ marginTop: theme.spacing.xs }}>
                            <span style={{ color: theme.colors.text.secondary }}>Options: </span>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: theme.spacing.xs,
                              marginTop: theme.spacing.xs
                            }}>
                              {task.options.map((option, index) => (
                                <span
                                  key={index}
                                  style={{
                                    background: theme.colors.primary.gradient,
                                    color: 'white',
                                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                    borderRadius: theme.borderRadius.sm,
                                    fontSize: theme.typography.sizes.xs,
                                    fontWeight: 500
                                  }}
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.sm,
                    paddingTop: theme.spacing.md,
                    borderTop: `1px solid ${theme.colors.border.light}30`
                  }}>
                    <button
                      onClick={() => startEdit(task)}
                      style={{
                        ...enhancedIconButtonStyle,
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                        border: `1px solid ${theme.colors.primary.light}40`,
                        color: theme.colors.primary.dark,
                        flex: 1
                      }}
                      title="Edit task"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => confirmDelete(task.id)}
                      style={{
                        ...enhancedIconButtonStyle,
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                        border: `1px solid ${theme.colors.status.error.light}40`,
                        color: theme.colors.status.error.dark,
                        flex: 1
                      }}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            minWidth: '400px',
            boxShadow: theme.effects.shadow.lg
          }}>
            <h3 style={{
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
              textAlign: 'center'
            }}>
              Delete Daily Task
            </h3>
            <p style={{
              fontSize: theme.typography.sizes.base,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xl,
              textAlign: 'center'
            }}>
              Are you sure you want to delete this daily task? This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'center'
            }}>
              <button
                onClick={executeDelete}
                style={{
                  ...formStyles.dangerButton,
                  minWidth: '100px'
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  ...formStyles.secondaryButton,
                  minWidth: '100px'
                }}
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// All styles now use shared formStyles utilities - massive DRY improvement!
// Custom icon button style that extends shared secondary button
const enhancedIconButtonStyle: React.CSSProperties = {
  ...formStyles.secondaryButton,
  textAlign: 'center' as const,
};