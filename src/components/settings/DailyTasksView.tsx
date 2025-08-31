import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../styles/theme';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CustomTask {
  id: string;
  name: string;
  description: string;
  type: 'yes_no' | 'dropdown';
  options: string[] | null;
}

interface DailyTracking {
  [taskId: string]: string | null;
}

export const DailyTasksView: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [tracking, setTracking] = useState<DailyTracking>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchTasksAndTracking = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const { data: tasksData, error: tasksError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData as CustomTask[]);

      if (tasksData && tasksData.length > 0) {
        try {
          const { data: trackingData, error: trackingError } = await supabase
            .from('daily_task_tracking')
            .select('task_id, value')
            .eq('user_id', user.id)
            .eq('date', today);

          if (trackingError && trackingError.code !== 'PGRST116') throw trackingError;

          const trackingMap = trackingData?.reduce((acc, item) => {
            acc[item.task_id] = item.value;
            return acc;
          }, {} as DailyTracking) || {};
          setTracking(trackingMap);
        } catch (trackingErr) {
          console.error('Error fetching tracking data:', trackingErr);
          // Do not set the main error state, allow tasks to be displayed
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchTasksAndTracking();
  }, [fetchTasksAndTracking]);

  const handleTrack = async (taskId: string, value: string) => {
    if (!user) return;

    const optimisticTracking = { ...tracking, [taskId]: value };
    setTracking(optimisticTracking);

    try {
      const { error: upsertError } = await supabase
        .from('daily_task_tracking')
        .upsert({ task_id: taskId, user_id: user.id, date: today, value }, { onConflict: 'task_id,user_id,date' });

      if (upsertError) throw upsertError;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracking');
      // Revert optimistic update on error
      fetchTasksAndTracking();
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
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
      }}>Your Custom Daily Tasks for {format(new Date(), 'MMMM d, yyyy')}</h3>
      
      {tasks.length === 0 ? (
        <p>No Daily tasks added yet. Add some from "Add Custom Task" to get started!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map(task => (
            <li key={task.id} style={taskItemStyle}>
              <div style={{ flex: 1 }}>
                <p style={taskNameStyle}>{task.name}</p>
                <p style={taskDescriptionStyle}>{task.description}</p>
                <div style={{ marginTop: theme.spacing.md }}>
                  {task.type === 'yes_no' ? (
                    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                      <button 
                        onClick={() => handleTrack(task.id, 'yes')} 
                        style={getTrackingButtonStyle(tracking[task.id] === 'yes')}>
                          Yes
                      </button>
                      <button 
                        onClick={() => handleTrack(task.id, 'no')} 
                        style={getTrackingButtonStyle(tracking[task.id] === 'no')}>
                          No
                      </button>
                    </div>
                  ) : (
                    <select 
                      value={tracking[task.id] || ''} 
                      onChange={(e) => handleTrack(task.id, e.target.value)}
                      style={selectStyle}
                    >
                      <option value="" disabled>Select...</option>
                      {task.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <button style={iconButtonStyle} title="Edit (coming soon)" disabled>
                  <Edit size={16} />
                </button>
                <button style={iconButtonStyle} title="Delete (coming soon)" disabled>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const taskItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing.lg,
  background: theme.colors.surface.light,
  borderRadius: theme.borderRadius.md,
  marginBottom: theme.spacing.md,
  border: `1px solid ${theme.colors.surface.glassBorder}`,
};

const taskNameStyle: React.CSSProperties = {
  fontWeight: theme.typography.weights.semibold,
  color: theme.colors.text.primary,
  margin: 0,
};

const taskDescriptionStyle: React.CSSProperties = {
  color: theme.colors.text.secondary,
  margin: `${theme.spacing.sm} 0`,
  fontSize: theme.typography.sizes.sm,
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: theme.colors.text.secondary,
  cursor: 'pointer',
  padding: theme.spacing.sm,
  borderRadius: theme.borderRadius.sm,
  opacity: 0.5, // Disabled for now
};

const getTrackingButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  borderRadius: theme.borderRadius.md,
  border: `1px solid ${isActive ? theme.colors.primary.base : theme.colors.surface.glassBorder}`,
  background: isActive ? theme.colors.primary.light : 'transparent',
  color: isActive ? theme.colors.primary.dark : theme.colors.text.secondary,
  cursor: 'pointer',
  fontWeight: theme.typography.weights.medium,
  transition: 'all 0.2s ease',
});

const selectStyle: React.CSSProperties = {
  padding: theme.spacing.sm,
  borderRadius: theme.borderRadius.md,
  border: `1px solid ${theme.colors.surface.glassBorder}`,
  background: 'transparent',
  color: theme.colors.text.primary,
};