import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme } from '../../styles/theme';
import { Edit2, Trash2, Check, X, Plus } from 'lucide-react';

interface CustomTask {
  id: string;
  name: string;
  description: string;
  type: 'yes_no' | 'dropdown';
  options: string[] | null;
}

export const DailyTasksView: React.FC = () => {
  const { user } = useSupabaseAuthStore();
  const [tasks, setTasks] = useState<CustomTask[]>([]);
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
      setTasks(tasksData as CustomTask[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const startEdit = (task: CustomTask) => {
    setEditingTask(task.id);
    setEditForm({
      name: task.name,
      description: task.description,
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
    return <div style={{ color: theme.colors.text.muted }}>Loading your daily tasks...</div>;
  }

  if (error) {
    return <div style={{ color: theme.colors.status.error.dark }}>{error}</div>;
  }

  return (
    <div>
      <h3 style={{
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
      }}>
        Manage Your Daily Tasks
      </h3>
      
      {tasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: theme.spacing.xl,
          color: theme.colors.text.muted,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: theme.borderRadius.lg,
          border: `1px dashed ${theme.colors.border.light}`
        }}>
          <p style={{ marginBottom: theme.spacing.sm }}>No daily tasks created yet.</p>
          <p style={{ fontSize: theme.typography.sizes.sm }}>Use "Add Custom Task" to create your first daily task!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              border: `1px solid ${theme.colors.border.light}`,
              backdropFilter: 'blur(10px)'
            }}>
              {editingTask === task.id ? (
                // Edit Mode
                <div>
                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={labelStyle}>Task Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={inputStyle}
                      placeholder="Enter task name"
                    />
                  </div>

                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                      placeholder="Enter task description"
                    />
                  </div>

                  <div style={{ marginBottom: theme.spacing.md }}>
                    <label style={labelStyle}>Task Type</label>
                    <div style={{ display: 'flex', gap: theme.spacing.md }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          value="yes_no"
                          checked={editForm.type === 'yes_no'}
                          onChange={() => setEditForm({ ...editForm, type: 'yes_no' })}
                        />
                        Yes / No
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
                      <label style={labelStyle}>Dropdown Options</label>
                      {editForm.options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            style={iconButtonStyle}
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

                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <button onClick={saveEdit} style={saveButtonStyle}>
                      <Check size={16} />
                      Save
                    </button>
                    <button onClick={cancelEdit} style={cancelButtonStyle}>
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: theme.typography.sizes.base,
                        fontWeight: theme.typography.weights.semibold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs
                      }}>
                        {task.name}
                      </h4>
                      {task.description && (
                        <p style={{
                          fontSize: theme.typography.sizes.sm,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing.sm
                        }}>
                          {task.description}
                        </p>
                      )}
                      <div style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.text.muted
                      }}>
                        Type: {task.type === 'yes_no' ? 'Yes / No' : 'Dropdown'}
                        {task.type === 'dropdown' && task.options && (
                          <span> • Options: {task.options.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                      <button
                        onClick={() => startEdit(task)}
                        style={iconButtonStyle}
                        title="Edit task"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(task.id)}
                        style={{ ...iconButtonStyle, color: theme.colors.status.error.dark }}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                  ...deleteButtonStyle,
                  minWidth: '100px'
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  ...cancelButtonStyle,
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

// Styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.xs,
  fontSize: theme.typography.sizes.sm,
  fontWeight: theme.typography.weights.medium,
  color: theme.colors.text.secondary,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: theme.spacing.sm,
  border: `1px solid ${theme.colors.border.light}`,
  borderRadius: theme.borderRadius.sm,
  fontSize: theme.typography.sizes.sm,
  backgroundColor: 'white',
  color: theme.colors.text.primary,
  outline: 'none',
  boxSizing: 'border-box'
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: theme.colors.text.muted,
  cursor: 'pointer',
  padding: theme.spacing.xs,
  borderRadius: theme.borderRadius.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const saveButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.xs,
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  backgroundColor: theme.colors.status.success.dark,
  color: 'white',
  border: 'none',
  borderRadius: theme.borderRadius.sm,
  cursor: 'pointer',
  fontSize: theme.typography.sizes.sm,
  fontWeight: theme.typography.weights.medium,
};

const cancelButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.xs,
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  backgroundColor: 'transparent',
  color: theme.colors.text.secondary,
  border: `1px solid ${theme.colors.border.light}`,
  borderRadius: theme.borderRadius.sm,
  cursor: 'pointer',
  fontSize: theme.typography.sizes.sm,
  fontWeight: theme.typography.weights.medium,
};

const deleteButtonStyle: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  backgroundColor: theme.colors.status.error.dark,
  color: 'white',
  border: 'none',
  borderRadius: theme.borderRadius.sm,
  cursor: 'pointer',
  fontSize: theme.typography.sizes.sm,
  fontWeight: theme.typography.weights.medium,
};