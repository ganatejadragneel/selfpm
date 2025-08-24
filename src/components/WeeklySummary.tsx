import React, { useState, useMemo, useEffect } from 'react';
import type { Task } from '../types';
import { TrendingUp, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Calendar, Circle, FileText } from 'lucide-react';
import { startOfWeek, endOfWeek, format, addWeeks, getWeek, differenceInDays } from 'date-fns';
import { theme, priorityConfigs } from '../styles/theme';

interface WeeklySummaryProps {
  tasks: Task[];
  weekNumber: number;
  onTaskClick?: (task: Task) => void;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ tasks, weekNumber, onTaskClick }) => {
  // Get today's date at midnight for consistent comparison
  const todayForComparison = new Date();
  todayForComparison.setHours(0, 0, 0, 0);
  
  // Helper function to parse date string without timezone conversion
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Determine initial slide based on urgent tasks or today's deadlines
  const shouldShowDeadlineView = useMemo(() => {
    const pendingTasks = tasks.filter(t => t.status !== 'done' && !t.isRecurring);
    
    // Check for extreme priority tasks
    const hasUrgentTasks = pendingTasks.some(t => t.priority === 'urgent');
    
    // Check for tasks due today or overdue
    const hasTodayOrOverdueDeadlines = pendingTasks.some(t => {
      if (!t.dueDate) return false;
      const dueDate = parseLocalDate(t.dueDate);
      return dueDate.getTime() <= todayForComparison.getTime(); // Today or past dates
    });
    
    return hasUrgentTasks || hasTodayOrOverdueDeadlines;
  }, [tasks]);
  
  const [currentSlide, setCurrentSlide] = useState(shouldShowDeadlineView ? 1 : 0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const CARDS_PER_PAGE = 3;
  
  // Auto-switch to deadline view only on initial load and if user hasn't manually navigated
  useEffect(() => {
    if (shouldShowDeadlineView && currentSlide === 0 && !hasUserNavigated) {
      setCurrentSlide(1);
    }
  }, [shouldShowDeadlineView, currentSlide, hasUserNavigated]);

  // Use the same calculation as App.tsx for consistency
  const currentDate = new Date();
  const weekStartDate = addWeeks(currentDate, weekNumber - getWeek(currentDate));
  const weekStart = startOfWeek(weekStartDate);
  const weekEnd = endOfWeek(weekStart);
  
  // Use the same today variable for consistency
  const today = todayForComparison;

  // Filter and sort tasks for deadline view
  const sortedTasks = useMemo(() => {
    const filtered = tasks.filter(t => 
      t.status !== 'done' &&           // Filter out completed
      !t.isRecurring                    // Filter out recurring
    );

    return filtered.sort((a, b) => {
      // First priority: Extreme priority tasks come first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      
      // Handle tasks without due dates - they go to the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      const dateA = parseLocalDate(a.dueDate);
      const dateB = parseLocalDate(b.dueDate);
      
      // Sort by date (earliest first)
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedTasks.length / CARDS_PER_PAGE);
  
  // Get tasks for current page
  const currentPageTasks = sortedTasks.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  // Get urgency style for a task
  const getUrgencyStyle = (dueDate: string | undefined) => {
    if (!dueDate) return { 
      background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.1) 100%)',
      border: theme.colors.surface.glassBorder,
      glow: 'none',
      textColor: theme.colors.text.secondary
    };
    
    const due = parseLocalDate(dueDate);
    const daysUntil = differenceInDays(due, today);
    
    if (daysUntil < 0) return { 
      background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', // dark red for overdue
      border: '#dc2626',
      glow: '0 4px 20px rgba(220, 38, 38, 0.4)',
      textColor: 'white'
    };
    if (daysUntil === 0) return { 
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', // super red for today
      border: '#ef4444',
      glow: '0 4px 25px rgba(239, 68, 68, 0.5)',
      textColor: 'white'
    };
    if (daysUntil <= 2) return { 
      background: 'linear-gradient(135deg, #a16207 0%, #ca8a04 100%)', // dark yellow
      border: '#eab308',
      glow: '0 4px 20px rgba(234, 179, 8, 0.4)',
      textColor: 'white'
    };
    
    return { 
      background: 'rgba(255, 255, 255, 0.95)',
      border: theme.colors.surface.glassBorder,
      glow: theme.effects.shadow.sm,
      textColor: theme.colors.text.primary
    };
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    
    categories: {
      lifeAdmin: {
        total: tasks.filter(t => t.category === 'life_admin').length,
        completed: tasks.filter(t => t.category === 'life_admin' && t.status === 'done').length
      },
      work: {
        total: tasks.filter(t => t.category === 'work').length,
        completed: tasks.filter(t => t.category === 'work' && t.status === 'done').length
      },
      weeklyRecurring: {
        total: tasks.filter(t => t.category === 'weekly_recurring').length,
        completed: tasks.filter(t => t.category === 'weekly_recurring' && t.status === 'done').length
      }
    }
  };
  
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  
  // Calculate progress for tasks with measurable progress
  const progressTasks = tasks.filter(t => t.progressTotal);
  const totalProgress = progressTasks.reduce((acc, t) => acc + (t.progressCurrent || 0), 0);
  const totalGoal = progressTasks.reduce((acc, t) => acc + (t.progressTotal || 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />;
      default:
        return <Circle className="w-4 h-4" style={{ color: '#9ca3af' }} />;
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '32px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '500px'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradient-flow 3s ease-in-out infinite'
      }}></div>
      
      {/* Slideshow Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: 'transform 0.3s ease-in-out'
        }}>
          {/* Slide 1: Overview */}
          <div style={{
            minWidth: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>
                  Week {weekNumber} Overview
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: '1',
                  margin: 0
                }}>
                  {completionRate}%
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Complete</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '12px',
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '16px',
                  margin: '0 auto 12px auto',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <CheckCircle className="w-8 h-8" style={{ color: 'white' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669', margin: '0 0 4px 0' }}>
                  {stats.completed}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Done</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '12px',
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '16px',
                  margin: '0 auto 12px auto',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}>
                  <Clock className="w-8 h-8" style={{ color: 'white' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8', margin: '0 0 4px 0' }}>
                  {stats.inProgress}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>In Progress</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '12px',
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '16px',
                  margin: '0 auto 12px auto',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
                }}>
                  <AlertCircle className="w-8 h-8" style={{ color: 'white' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 4px 0' }}>
                  {stats.blocked}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Blocked</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '12px',
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '16px',
                  margin: '0 auto 12px auto',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                }}>
                  <TrendingUp className="w-8 h-8" style={{ color: 'white' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed', margin: '0 0 4px 0' }}>
                  {stats.todo}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>To Do</div>
              </div>
            </div>
            
            {totalGoal > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>Overall Progress</span>
                  <span style={{ fontWeight: '700', color: '#374151' }}>{totalProgress} / {totalGoal}</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: 'rgba(229, 231, 235, 0.8)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '10px',
                      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      width: `${(totalProgress / totalGoal) * 100}%`,
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
                    }}
                  />
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                  🏠 Life Admin
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>
                  {stats.categories.lifeAdmin.completed}/{stats.categories.lifeAdmin.total}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                  💼 Work Tasks
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                  {stats.categories.work.completed}/{stats.categories.work.total}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                  🔄 Weekly
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {stats.categories.weeklyRecurring.completed}/{stats.categories.weeklyRecurring.total}
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2: Deadline View */}
          <div style={{
            minWidth: '100%',
            paddingLeft: currentSlide === 1 ? '0' : '32px',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '24px', paddingLeft: '80px', paddingRight: '80px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 8px 0'
              }}>
                Deadline Priority View
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {sortedTasks.length} Urgent pending tasks
              </p>
            </div>

            {sortedTasks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: theme.colors.text.muted
              }}>
                <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending tasks</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>All tasks are completed!</p>
              </div>
            ) : (
              <div style={{ position: 'relative', height: '270px', marginBottom: '30px', paddingLeft: '60px', paddingRight: '60px' }}>
                {/* Task Cards Container */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  height: '100%'
                }}>
                  {currentPageTasks.map((task) => {
                    const urgencyStyle = getUrgencyStyle(task.dueDate);
                    const latestUpdate = task.updates && task.updates.length > 0 
                      ? task.updates[task.updates.length - 1].updateText 
                      : null;
                    const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        style={{
                          background: urgencyStyle.background,
                          border: `2px solid ${urgencyStyle.border}`,
                          borderRadius: theme.borderRadius.lg,
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: urgencyStyle.glow,
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                      >
                        {/* Category Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: theme.borderRadius.sm,
                          fontSize: '10px',
                          fontWeight: '600',
                          color: urgencyStyle.textColor,
                          backdropFilter: 'blur(10px)'
                        }}>
                          {task.category.replace('_', ' ').toUpperCase()}
                        </div>

                        {/* Task Title */}
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: urgencyStyle.textColor,
                          marginBottom: '12px',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {task.title}
                        </h3>

                        {/* Due Date */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: urgencyStyle.textColor
                        }}>
                          <Calendar className="w-4 h-4" />
                          {task.dueDate ? (
                            <>
                              {format(parseLocalDate(task.dueDate), 'MMM d, yyyy')}
                              {(() => {
                                const daysUntil = differenceInDays(parseLocalDate(task.dueDate), today);
                                if (daysUntil < 0) return ` (${Math.abs(daysUntil)} days overdue)`;
                                if (daysUntil === 0) return ' (Today!)';
                                if (daysUntil === 1) return ' (Tomorrow)';
                                if (daysUntil <= 7) return ` (${daysUntil} days)`;
                                return '';
                              })()}
                            </>
                          ) : (
                            'No deadline'
                          )}
                        </div>

                        {/* Status */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          fontSize: '13px',
                          color: urgencyStyle.textColor,
                          opacity: urgencyStyle.textColor === 'white' ? 0.9 : 0.8
                        }}>
                          {getStatusIcon(task.status)}
                          <span style={{ fontWeight: '500' }}>
                            {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>

                        {/* Priority */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: urgencyStyle.textColor,
                          opacity: urgencyStyle.textColor === 'white' ? 0.9 : 0.8
                        }}>
                          <span style={{ fontSize: '11px' }}>{priorityConfigs[task.priority].icon}</span>
                          <span>{priorityConfigs[task.priority].title.replace(' Priority', '')}</span>
                        </div>

                        {/* Subtasks Count */}
                        {totalSubtasks > 0 && (
                          <div style={{
                            fontSize: '13px',
                            color: urgencyStyle.textColor,
                            opacity: urgencyStyle.textColor === 'white' ? 0.9 : 0.7,
                            marginBottom: '12px'
                          }}>
                            ✓ {completedSubtasks}/{totalSubtasks} subtasks
                          </div>
                        )}

                        {/* Latest Update */}
                        {latestUpdate && (
                          <div style={{
                            marginTop: 'auto',
                            paddingTop: '12px',
                            borderTop: `1px solid ${urgencyStyle.textColor === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                            fontSize: '12px',
                            color: urgencyStyle.textColor,
                            opacity: urgencyStyle.textColor === 'white' ? 0.8 : 0.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            <FileText className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                            {latestUpdate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Arrows */}
                {totalPages > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      style={{
                        position: 'absolute',
                        left: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '48px',
                        height: '64px',
                        borderRadius: '12px',
                        background: currentPage === 0 
                          ? 'rgba(0,0,0,0.05)' 
                          : 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                        border: currentPage === 0 
                          ? '2px solid rgba(0,0,0,0.1)' 
                          : '2px solid rgba(102, 126, 234, 0.3)',
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: currentPage === 0 
                          ? 'inset 0 2px 4px rgba(0,0,0,0.1)' 
                          : '0 8px 24px rgba(102, 126, 234, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== 0) {
                          e.currentTarget.style.transform = 'translateY(-50%) translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%)';
                        if (currentPage !== 0) {
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-7 h-7" style={{ 
                        color: currentPage === 0 ? '#cbd5e1' : 'white',
                        filter: currentPage === 0 ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }} />
                    </button>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      style={{
                        position: 'absolute',
                        right: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '48px',
                        height: '64px',
                        borderRadius: '12px',
                        background: currentPage === totalPages - 1 
                          ? 'rgba(0,0,0,0.05)' 
                          : 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                        border: currentPage === totalPages - 1 
                          ? '2px solid rgba(0,0,0,0.1)' 
                          : '2px solid rgba(102, 126, 234, 0.3)',
                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: currentPage === totalPages - 1 
                          ? 'inset 0 2px 4px rgba(0,0,0,0.1)' 
                          : '0 8px 24px rgba(102, 126, 234, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== totalPages - 1) {
                          e.currentTarget.style.transform = 'translateY(-50%) translateX(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%)';
                        if (currentPage !== totalPages - 1) {
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-7 h-7" style={{ 
                        color: currentPage === totalPages - 1 ? '#cbd5e1' : 'white',
                        filter: currentPage === totalPages - 1 ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }} />
                    </button>

                    {/* Page Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '13px',
                      color: theme.colors.text.secondary,
                      fontWeight: '600',
                      padding: '4px 12px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '20px',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {currentPage * CARDS_PER_PAGE + 1}-{Math.min((currentPage + 1) * CARDS_PER_PAGE, sortedTasks.length)} of {sortedTasks.length} tasks
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: '32px'
      }}>
        <button
          onClick={() => {
            setCurrentSlide(Math.max(0, currentSlide - 1));
            setHasUserNavigated(true);
            if (currentSlide === 1) setCurrentPage(0); // Reset pagination when leaving deadline view
          }}
          disabled={currentSlide === 0}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: currentSlide === 0 
              ? 'rgba(0, 0, 0, 0.05)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: currentSlide === 0 
              ? '2px solid rgba(0, 0, 0, 0.1)' 
              : 'none',
            cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: currentSlide === 0 
              ? 'none' 
              : '0 8px 24px rgba(102, 126, 234, 0.3)',
            color: currentSlide === 0 ? '#cbd5e1' : 'white'
          }}
          onMouseEnter={(e) => {
            if (currentSlide !== 0) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            if (currentSlide !== 0) {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
            }
          }}
          aria-label="Previous view"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <div style={{
          padding: '8px 20px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '30px',
          fontSize: '14px',
          fontWeight: '600',
          color: theme.colors.primary.dark,
          minWidth: '200px',
          textAlign: 'center',
          border: '2px solid rgba(102, 126, 234, 0.2)'
        }}>
          {currentSlide === 0 ? 'Week Overview' : 'Deadline Priority View'}
        </div>

        <button
          onClick={() => {
            setCurrentSlide(Math.min(1, currentSlide + 1));
            setHasUserNavigated(true);
            if (currentSlide === 0) setCurrentPage(0); // Reset pagination when entering deadline view
          }}
          disabled={currentSlide === 1}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: currentSlide === 1 
              ? 'rgba(0, 0, 0, 0.05)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: currentSlide === 1 
              ? '2px solid rgba(0, 0, 0, 0.1)' 
              : 'none',
            cursor: currentSlide === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: currentSlide === 1 
              ? 'none' 
              : '0 8px 24px rgba(102, 126, 234, 0.3)',
            color: currentSlide === 1 ? '#cbd5e1' : 'white'
          }}
          onMouseEnter={(e) => {
            if (currentSlide !== 1) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            if (currentSlide !== 1) {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
            }
          }}
          aria-label="Next view"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      <style>
        {`
          @keyframes gradient-flow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>
    </div>
  );
};