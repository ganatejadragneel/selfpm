import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, CheckCircle2, Clock, Target, Award, Activity } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { theme } from '../../styles/theme';
import type { Task } from '../../types';

interface ProgressAnalyticsDashboardProps {
  tasks: Task[];
  currentWeek: number;
}

interface DayStats {
  date: Date;
  completed: number;
  created: number;
  inProgress: number;
}

interface CategoryStats {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
  color: string;
}

export const ProgressAnalyticsDashboard: React.FC<ProgressAnalyticsDashboardProps> = ({ tasks, currentWeek }) => {
  const [weeklyStats, setWeeklyStats] = useState<DayStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    completionRate: 0,
    averageProgress: 0,
    streakDays: 0
  });

  useEffect(() => {
    calculateStats();
  }, [tasks, currentWeek]);

  const calculateStats = () => {
    // Overall stats
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Average progress - calculate for all tasks, using different methods
    let avgProgress = 0;
    let totalProgress = 0;
    let taskCount = 0;
    
    tasks.forEach(task => {
      let taskProgress = 0;
      
      if (task.status === 'done') {
        // Completed tasks are 100%
        taskProgress = 100;
      } else if (task.progressTotal && task.progressTotal > 0) {
        // Tasks with explicit progress tracking
        taskProgress = Math.round((task.progressCurrent || 0) / task.progressTotal * 100);
      } else if (task.subtasks && task.subtasks.length > 0) {
        // Tasks with subtasks - calculate based on subtask completion
        const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
        taskProgress = Math.round((completedSubtasks / task.subtasks.length) * 100);
      } else if (task.status === 'in_progress') {
        // In progress without progress tracking = 50%
        taskProgress = 50;
      }
      // 'todo' or 'blocked' tasks = 0%
      
      totalProgress += taskProgress;
      taskCount++;
    });
    
    avgProgress = taskCount > 0 ? Math.round(totalProgress / taskCount) : 0;

    setOverallStats({
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      completionRate,
      averageProgress: avgProgress,
      streakDays: calculateStreak()
    });

    // Category stats
    const categories: CategoryStats[] = [
      {
        name: 'Life Admin',
        total: tasks.filter(t => t.category === 'life_admin').length,
        completed: tasks.filter(t => t.category === 'life_admin' && t.status === 'done').length,
        inProgress: tasks.filter(t => t.category === 'life_admin' && t.status === 'in_progress').length,
        percentage: 0,
        color: '#667eea'
      },
      {
        name: 'Work Tasks',
        total: tasks.filter(t => t.category === 'work').length,
        completed: tasks.filter(t => t.category === 'work' && t.status === 'done').length,
        inProgress: tasks.filter(t => t.category === 'work' && t.status === 'in_progress').length,
        percentage: 0,
        color: '#f59e0b'
      },
      {
        name: 'Weekly Recurring',
        total: tasks.filter(t => t.category === 'weekly_recurring').length,
        completed: tasks.filter(t => t.category === 'weekly_recurring' && t.status === 'done').length,
        inProgress: tasks.filter(t => t.category === 'weekly_recurring' && t.status === 'in_progress').length,
        percentage: 0,
        color: '#10b981'
      }
    ];

    categories.forEach(cat => {
      cat.percentage = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
    });

    setCategoryStats(categories);

    // Weekly stats - use actual task data
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Group tasks by date for created and completed
    const tasksByDate = new Map<string, { created: Task[], completed: Task[], inProgress: Task[] }>();
    
    // Initialize all days
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      tasksByDate.set(dateKey, { created: [], completed: [], inProgress: [] });
    });
    
    // Categorize tasks by their dates
    tasks.forEach(task => {
      // Track created tasks
      if (task.createdAt) {
        const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
        const dayData = tasksByDate.get(createdDate);
        if (dayData) {
          dayData.created.push(task);
        }
      }
      
      // Track completed tasks
      if (task.status === 'done' && task.updatedAt) {
        const completedDate = format(new Date(task.updatedAt), 'yyyy-MM-dd');
        const dayData = tasksByDate.get(completedDate);
        if (dayData) {
          dayData.completed.push(task);
        }
      }
      
      // Track in-progress tasks (current status)
      if (task.status === 'in_progress') {
        const currentDate = format(today, 'yyyy-MM-dd');
        const dayData = tasksByDate.get(currentDate);
        if (dayData) {
          dayData.inProgress.push(task);
        }
      }
    });

    const dailyStats = days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = tasksByDate.get(dateKey) || { created: [], completed: [], inProgress: [] };
      
      return {
        date: day,
        completed: dayData.completed.length,
        created: dayData.created.length,
        inProgress: dayData.inProgress.length
      };
    });

    setWeeklyStats(dailyStats);
  };

  const calculateStreak = () => {
    // Calculate the current streak of days with completed tasks
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let streak = 0;
    let currentDate = new Date(today);
    
    // Group tasks by the date they were completed
    const completedTasksByDate = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.status === 'done' && task.updatedAt) {
        const dateKey = format(new Date(task.updatedAt), 'yyyy-MM-dd');
        completedTasksByDate.set(dateKey, (completedTasksByDate.get(dateKey) || 0) + 1);
      }
    });
    
    // Count consecutive days backwards from today
    while (true) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      
      // If we have completed tasks on this day, increment streak
      if (completedTasksByDate.has(dateKey)) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today doesn't have completed tasks yet, check yesterday
        if (streak === 0 && currentDate.toDateString() === today.toDateString()) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        // Streak is broken
        break;
      }
      
      // Limit to reasonable number of days to check
      if (streak > 365) break;
    }
    
    return streak;
  };


  return (
    <div style={{
      padding: theme.spacing.xl,
      background: theme.colors.surface.glass,
      backdropFilter: theme.effects.blur,
      borderRadius: theme.borderRadius.xl,
      border: `1px solid ${theme.colors.surface.glassBorder}`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing['2xl']
      }}>
        <TrendingUp className="w-6 h-6" style={{ color: theme.colors.primary.dark }} />
        <h2 style={{
          fontSize: theme.typography.sizes['2xl'],
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          margin: 0
        }}>
          Progress Analytics
        </h2>
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: theme.borderRadius.lg,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.primary.dark,
          fontWeight: theme.typography.weights.medium
        }}>
          <Calendar className="w-4 h-4" />
          Week {currentWeek}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing['2xl']
      }}>
        {/* Total Tasks */}
        <div style={{
          padding: theme.spacing.lg,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm
          }}>
            <Target className="w-4 h-4" style={{ color: theme.colors.primary.dark }} />
            <span style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.secondary,
              fontWeight: theme.typography.weights.medium
            }}>
              Total Tasks
            </span>
          </div>
          <div style={{
            fontSize: theme.typography.sizes['3xl'],
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.primary.dark
          }}>
            {overallStats.totalTasks}
          </div>
        </div>

        {/* Completed */}
        <div style={{
          padding: theme.spacing.lg,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm
          }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: theme.colors.status.success.dark }} />
            <span style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.secondary,
              fontWeight: theme.typography.weights.medium
            }}>
              Completed
            </span>
          </div>
          <div style={{
            fontSize: theme.typography.sizes['3xl'],
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.status.success.dark
          }}>
            {overallStats.completedTasks}
          </div>
        </div>

        {/* In Progress */}
        <div style={{
          padding: theme.spacing.lg,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm
          }}>
            <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />
            <span style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.secondary,
              fontWeight: theme.typography.weights.medium
            }}>
              In Progress
            </span>
          </div>
          <div style={{
            fontSize: theme.typography.sizes['3xl'],
            fontWeight: theme.typography.weights.bold,
            color: '#3b82f6'
          }}>
            {overallStats.inProgressTasks}
          </div>
        </div>

        {/* Completion Rate */}
        <div style={{
          padding: theme.spacing.lg,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm
          }}>
            <Award className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            <span style={{
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.secondary,
              fontWeight: theme.typography.weights.medium
            }}>
              Completion Rate
            </span>
          </div>
          <div style={{
            fontSize: theme.typography.sizes['3xl'],
            fontWeight: theme.typography.weights.bold,
            color: '#8b5cf6'
          }}>
            {overallStats.completionRate}%
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{
        marginBottom: theme.spacing['2xl']
      }}>
        <h3 style={{
          fontSize: theme.typography.sizes.lg,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.lg
        }}>
          Category Performance
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg
        }}>
          {categoryStats.map(cat => (
            <div key={cat.name}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.sm
              }}>
                <span style={{
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.text.primary
                }}>
                  {cat.name}
                </span>
                <span style={{
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.text.secondary
                }}>
                  {cat.completed}/{cat.total} ({cat.percentage}%)
                </span>
              </div>
              <div style={{
                height: '12px',
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.full,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${cat.percentage}%`,
                  background: `linear-gradient(90deg, ${cat.color} 0%, ${cat.color}dd 100%)`,
                  transition: 'width 0.5s ease',
                  borderRadius: theme.borderRadius.full
                }} />
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing.lg,
                marginTop: theme.spacing.xs,
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text.muted
              }}>
                <span>✓ {cat.completed} completed</span>
                <span>⟳ {cat.inProgress} in progress</span>
                <span>○ {cat.total - cat.completed - cat.inProgress} todo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div>
        <h3 style={{
          fontSize: theme.typography.sizes.lg,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.lg
        }}>
          Weekly Activity
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: theme.spacing.sm,
          height: '150px',
          padding: theme.spacing.lg,
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: theme.borderRadius.lg
        }}>
          {weeklyStats.map((day, index) => {
            const maxHeight = 120;
            const height = Math.max(20, (day.completed / 5) * maxHeight);
            
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.sm
                }}
              >
                <div style={{
                  width: '100%',
                  height: `${height}px`,
                  background: format(day.date, 'EEE') === format(new Date(), 'EEE')
                    ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(180deg, rgba(102, 126, 234, 0.6) 0%, rgba(102, 126, 234, 0.3) 100%)',
                  borderRadius: theme.borderRadius.lg,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: theme.typography.sizes.xs,
                    fontWeight: theme.typography.weights.bold,
                    color: theme.colors.primary.dark
                  }}>
                    {day.completed}
                  </div>
                </div>
                <span style={{
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.text.muted,
                  fontWeight: format(day.date, 'EEE') === format(new Date(), 'EEE')
                    ? theme.typography.weights.bold
                    : theme.typography.weights.normal
                }}>
                  {format(day.date, 'EEE')}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: theme.spacing.xl,
          marginTop: theme.spacing.lg,
          padding: theme.spacing.lg,
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: theme.borderRadius.lg,
          fontSize: theme.typography.sizes.sm
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <Activity className="w-4 h-4" style={{ color: theme.colors.primary.dark }} />
            <span style={{ color: theme.colors.text.secondary }}>Average Progress:</span>
            <span style={{ fontWeight: theme.typography.weights.bold, color: theme.colors.primary.dark }}>
              {overallStats.averageProgress}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <Award className="w-4 h-4" style={{ color: theme.colors.status.warning.dark }} />
            <span style={{ color: theme.colors.text.secondary }}>Current Streak:</span>
            <span style={{ fontWeight: theme.typography.weights.bold, color: theme.colors.status.warning.dark }}>
              {overallStats.streakDays} days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};