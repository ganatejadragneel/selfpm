import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { theme, styleUtils } from '../../styles/theme';
import { Plus, Trash2 } from 'lucide-react';

type TaskType = 'yes_no' | 'dropdown';

export const AddCustomTaskForm: React.FC = () => {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('yes_no');
  const [options, setOptions] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    if (type === 'dropdown' && options.some(opt => !opt.trim())) {
      setError('All dropdown options must be filled');
      return;
    }

    if (!user) {
      setError('You must be logged in to add a task.');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        user_id: user.id,
        name,
        description,
        type,
        options: type === 'dropdown' ? options.filter(opt => opt.trim()) : null,
      };

      const { error: insertError } = await supabase.from('custom_tasks').insert(taskData);

      if (insertError) {
        throw insertError;
      }

      setSuccess('Custom task added successfully!');
      setName('');
      setDescription('');
      setType('yes_no');
      setOptions(['']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
      }}>Add Custom Daily Task</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: theme.spacing.md }}>
          <label htmlFor="taskName" style={labelStyle}>Task Name</label>
          <input
            id="taskName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styleUtils.input()}
            required
          />
        </div>
        <div style={{ marginBottom: theme.spacing.md }}>
          <label htmlFor="taskDescription" style={labelStyle}>Description</label>
          <textarea
            id="taskDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{...styleUtils.input(), height: '100px'}}
          />
        </div>
        <div style={{ marginBottom: theme.spacing.md }}>
          <label style={labelStyle}>Task Type</label>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="taskType"
                value="yes_no"
                checked={type === 'yes_no'}
                onChange={() => setType('yes_no')}
              />
              Yes / No
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="taskType"
                value="dropdown"
                checked={type === 'dropdown'}
                onChange={() => setType('dropdown')}
              />
              Dropdown
            </label>
          </div>
        </div>

        {type === 'dropdown' && (
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={labelStyle}>Dropdown Options</label>
            {options.map((option, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  style={styleUtils.input()}
                  placeholder={`Option ${index + 1}`}
                />
                <button type="button" onClick={() => removeOption(index)} style={removeButtonStyle}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addOption} style={addButtonStyle}>
              <Plus size={16} />
              Add Option
            </button>
          </div>
        )}

        {error && <p style={{ color: theme.colors.status.error.dark, marginBottom: theme.spacing.md }}>{error}</p>}
        {success && <p style={{ color: theme.colors.status.success.dark, marginBottom: theme.spacing.md }}>{success}</p>}
        
        <button type="submit" style={styleUtils.button.primary()} disabled={loading}>
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </form>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.sm,
  color: theme.colors.text.secondary,
  fontWeight: theme.typography.weights.medium,
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  cursor: 'pointer',
};

const addButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  background: 'none',
  border: `1px dashed ${theme.colors.text.muted}`,
  color: theme.colors.text.secondary,
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  borderRadius: theme.borderRadius.sm,
  cursor: 'pointer',
};

const removeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: theme.colors.text.muted,
  cursor: 'pointer',
  padding: theme.spacing.sm,
};
