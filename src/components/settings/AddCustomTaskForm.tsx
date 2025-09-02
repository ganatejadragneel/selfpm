import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme } from '../../styles/theme';
import { formStyles, getInputStyle, getButtonState, formIcons } from '../../styles/formStyles';
import { Plus, Trash2, CheckCircle2, Target } from 'lucide-react';
import { MAX_DROPDOWN_OPTIONS } from '../../constants/dailyTasks';

type TaskType = 'yes_no' | 'dropdown';

export const AddCustomTaskForm: React.FC = () => {
  const { user } = useSupabaseAuthStore();
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
    if (options.length < MAX_DROPDOWN_OPTIONS) {
      setOptions([...options, '']);
    }
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

    if (type === 'dropdown' && options.filter(opt => opt.trim()).length > MAX_DROPDOWN_OPTIONS) {
      setError(`Dropdown tasks cannot have more than ${MAX_DROPDOWN_OPTIONS} options`);
      return;
    }

    if (!user) {
      setError('You must be logged in to add a task.');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        user_id: null, // Legacy field, set to null for Supabase Auth users
        new_user_id: user.id, // Use new_user_id for Supabase Auth
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
    <div style={formStyles.formCard}>
      {/* Header decoration */}
      <div style={{
        ...formStyles.headerDecoration,
        background: `linear-gradient(90deg, ${theme.colors.primary.light}, ${theme.colors.status.success.light})`
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
          background: theme.colors.primary.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <Target size={24} color="white" />
        </div>
        <div>
          <h3 style={{
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
            background: `linear-gradient(135deg, ${theme.colors.primary.dark}, ${theme.colors.status.success.dark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Create Daily Task</h3>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.secondary,
            margin: 0
          }}>Design a custom task to track in your daily routine</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{
          marginBottom: theme.spacing.lg,
          position: 'relative'
        }}>
          <label htmlFor="taskName" style={{
            ...formStyles.label,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            fontWeight: theme.typography.weights.semibold
          }}>
            <div style={{
              width: '4px',
              height: '16px',
              background: theme.colors.primary.gradient,
              borderRadius: '2px'
            }} />
            Task Name *
          </label>
          <input
            id="taskName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={getInputStyle(!!name.trim())}
            placeholder="Enter a descriptive name for your task"
            required
          />
        </div>
        <div style={{
          marginBottom: theme.spacing.lg,
          position: 'relative'
        }}>
          <label htmlFor="taskDescription" style={{
            ...formStyles.label,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            fontWeight: theme.typography.weights.semibold
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
            id="taskDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              ...formStyles.textarea,
            }}
            placeholder="Add details about what this task involves (optional)"
          />
        </div>
        <div style={{
          marginBottom: theme.spacing.xl,
          position: 'relative'
        }}>
          <label style={{
            ...formStyles.label,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            fontWeight: theme.typography.weights.semibold,
            marginBottom: theme.spacing.md
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
            <div
              onClick={() => setType('yes_no')}
              style={{
                ...taskTypeCardStyle,
                border: type === 'yes_no' 
                  ? `2px solid ${theme.colors.status.success.light}`
                  : `1px solid ${theme.colors.border.light}`,
                background: type === 'yes_no'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.8)',
                transform: type === 'yes_no' ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: type === 'yes_no' 
                  ? '0 8px 24px rgba(16, 185, 129, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.xs
              }}>
                <CheckCircle2 size={20} color={type === 'yes_no' ? theme.colors.status.success.dark : theme.colors.text.muted} />
                <span style={{
                  fontWeight: theme.typography.weights.semibold,
                  color: type === 'yes_no' ? theme.colors.status.success.dark : theme.colors.text.primary
                }}>Done / Not Done</span>
              </div>
              <p style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text.secondary,
                margin: 0
              }}>Simple binary completion tracking</p>
            </div>
            
            <div
              onClick={() => setType('dropdown')}
              style={{
                ...taskTypeCardStyle,
                border: type === 'dropdown' 
                  ? `2px solid ${theme.colors.primary.light}`
                  : `1px solid ${theme.colors.border.light}`,
                background: type === 'dropdown'
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.8)',
                transform: type === 'dropdown' ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: type === 'dropdown' 
                  ? '0 8px 24px rgba(59, 130, 246, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.xs
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: type === 'dropdown' ? theme.colors.primary.gradient : theme.colors.text.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white'
                }}>▼</div>
                <span style={{
                  fontWeight: theme.typography.weights.semibold,
                  color: type === 'dropdown' ? theme.colors.primary.dark : theme.colors.text.primary
                }}>Dropdown</span>
              </div>
              <p style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text.secondary,
                margin: 0
              }}>Custom options for detailed tracking</p>
            </div>
          </div>
        </div>

        {type === 'dropdown' && (
          <div style={{
            marginBottom: theme.spacing.xl,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            border: `1px solid ${theme.colors.primary.light}20`
          }}>
            <label style={{
              ...formStyles.label,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              fontWeight: theme.typography.weights.semibold,
              marginBottom: theme.spacing.md
            }}>
              <div style={{
                width: '4px',
                height: '16px',
                background: theme.colors.primary.gradient,
                borderRadius: '2px'
              }} />
              Dropdown Options ({options.filter(opt => opt.trim()).length}/{MAX_DROPDOWN_OPTIONS})
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm
            }}>
              {options.map((option, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'relative',
                    flex: 1
                  }}>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      style={{
                        ...formStyles.enhancedInput,
                        paddingLeft: '40px',
                        borderColor: option.trim() ? theme.colors.primary.light : theme.colors.border.light
                      }}
                      placeholder={`Option ${index + 1} (e.g., "Excellent", "Good", "Needs work")`}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: option.trim() ? theme.colors.primary.gradient : theme.colors.text.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                  </div>
                  {options.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeOption(index)} 
                      style={{
                        ...enhancedRemoveButtonStyle,
                        opacity: options.length > 1 ? 1 : 0.5
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addOption} 
              disabled={options.length >= MAX_DROPDOWN_OPTIONS}
              style={{
                ...enhancedAddButtonStyle,
                opacity: options.length >= MAX_DROPDOWN_OPTIONS ? 0.5 : 1,
                cursor: options.length >= MAX_DROPDOWN_OPTIONS ? 'not-allowed' : 'pointer',
                background: options.length >= MAX_DROPDOWN_OPTIONS 
                  ? 'rgba(248, 250, 252, 0.5)'
                  : enhancedAddButtonStyle.background,
                borderColor: options.length >= MAX_DROPDOWN_OPTIONS 
                  ? theme.colors.border.light
                  : theme.colors.primary.light,
                color: options.length >= MAX_DROPDOWN_OPTIONS 
                  ? theme.colors.text.muted
                  : theme.colors.primary.dark,
              }}
            >
              <Plus size={16} />
              {options.length >= MAX_DROPDOWN_OPTIONS ? `Maximum ${MAX_DROPDOWN_OPTIONS} options reached` : 'Add Another Option'}
            </button>
          </div>
        )}

        {error && (
          <div style={formStyles.errorMessage}>
            <div style={formIcons.errorIcon}>!</div>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}
        
        {success && (
          <div style={formStyles.successMessage}>
            <CheckCircle2 size={20} color={theme.colors.status.success.dark} />
            <p style={{ margin: 0 }}>{success}</p>
          </div>
        )}
        
        <button 
          type="submit" 
          style={{
            ...enhancedSubmitButtonStyle,
            ...getButtonState(loading, false)
          }} 
          disabled={loading}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm
          }}>
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Creating Task...</span>
              </>
            ) : (
              <>
                <Target size={18} />
                <span>Create Daily Task</span>
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
};

// Using shared form styles (DRY principle applied)

const taskTypeCardStyle: React.CSSProperties = {
  flex: 1,
  padding: theme.spacing.lg,
  borderRadius: theme.borderRadius.lg,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(10px)',
  minHeight: '80px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const enhancedAddButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
  width: '100%',
  marginTop: theme.spacing.md,
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
  border: `2px dashed ${theme.colors.primary.light}`,
  color: theme.colors.primary.dark,
  borderRadius: theme.borderRadius.md,
  cursor: 'pointer',
  fontSize: theme.typography.sizes.sm,
  fontWeight: theme.typography.weights.semibold,
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const enhancedRemoveButtonStyle: React.CSSProperties = {
  ...formStyles.dangerButton,
  width: '40px',
  height: '40px',
  padding: theme.spacing.sm,
};

// Custom gradient button style for this specific form
const enhancedSubmitButtonStyle: React.CSSProperties = {
  ...formStyles.primaryButton,
  background: `linear-gradient(135deg, ${theme.colors.primary.dark} 0%, ${theme.colors.status.success.dark} 100%)`,
};
