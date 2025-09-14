import React, { useState, useMemo, useEffect } from 'react';
import type { Task } from '../types';
import { TrendingUp, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Calendar, Circle, FileText, ArrowRight } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
// Import only specific functions to reduce bundle size
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { addWeeks } from 'date-fns/addWeeks';
import { getWeek } from 'date-fns/getWeek';
import { theme, priorityConfigs } from '../styles/theme';
import { parseLocalDate, getDaysUntilDate, getDateUrgency } from '../utils/dateUtils';
import { filterPendingTasks, sortTasksByDeadlinePriority, shouldShowDeadlineView as checkShouldShowDeadlineView } from '../utils/taskFilters';
import { calculateTaskStatistics, calculateSubtaskStats } from '../utils/taskStatistics';
import { useMigratedTaskStore } from '../store/migratedTaskStore';
import { formatDuration, calculateTimeRemaining } from '../utils/timeUtils';

interface WeeklySummaryProps {
  tasks: Task[];
  weekNumber: number;
  onTaskClick?: (task: Task) => void;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ tasks, weekNumber, onTaskClick }) => {
  // Determine initial slide based on urgent tasks or today's deadlines
  const shouldShowDeadlineView = useMemo(() => checkShouldShowDeadlineView(tasks), [tasks]);
  const { isMobile, isSmallMobile } = useResponsive();
  
  const [currentSlide, setCurrentSlide] = useState(shouldShowDeadlineView ? 1 : 0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const CARDS_PER_PAGE = isMobile ? 2 : 3;

  const { migrateAllTasks } = useMigratedTaskStore();
  
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
  
  // Check if this is an older week (show migrate button)
  const actualCurrentWeek = getWeek(new Date());
  const isOlderWeek = weekNumber < actualCurrentWeek;
  
  // Count migratable tasks
  const migratableTasks = useMemo(() => {
    return tasks.filter(task => 
      task.category !== 'weekly_recurring' && 
      (task.status === 'todo' || task.status === 'in_progress')
    );
  }, [tasks]);

  const handleMigrate = async () => {
    if (migratableTasks.length === 0) return;
    
    setIsMigrating(true);
    try {
      await migrateAllTasks();
      setShowMigrateConfirm(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };
  

  // Filter and sort tasks for deadline view
  const sortedTasks = useMemo(() => {
    const filtered = filterPendingTasks(tasks);
    return sortTasksByDeadlinePriority(filtered);
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
    const urgency = getDateUrgency(dueDate);
    
    switch (urgency) {
      case 'overdue':
        return { 
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          border: '#dc2626',
          glow: '0 4px 20px rgba(220, 38, 38, 0.4)',
          textColor: 'white'
        };
      case 'today':
        return { 
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          border: '#ef4444',
          glow: '0 4px 25px rgba(239, 68, 68, 0.5)',
          textColor: 'white'
        };
      case 'urgent':
        return { 
          background: 'linear-gradient(135deg, #a16207 0%, #ca8a04 100%)',
          border: '#eab308',
          glow: '0 4px 20px rgba(234, 179, 8, 0.4)',
          textColor: 'white'
        };
      case 'none':
        return { 
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.1) 100%)',
          border: theme.colors.surface.glassBorder,
          glow: 'none',
          textColor: theme.colors.text.secondary
        };
      default:
        return { 
          background: 'rgba(255, 255, 255, 0.95)',
          border: theme.colors.surface.glassBorder,
          glow: theme.effects.shadow.sm,
          textColor: theme.colors.text.primary
        };
    }
  };

  const stats = useMemo(() => calculateTaskStatistics(tasks), [tasks]);
  const completionRate = stats.completionRate;
  const totalProgress = stats.progress.totalCurrent;
  const totalGoal = stats.progress.totalGoal;

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
      padding: isMobile ? '20px 16px' : '32px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: isMobile ? '400px' : '500px'
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
            <div style={{ 
              display: 'flex', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              justifyContent: 'space-between', 
              marginBottom: isMobile ? '24px' : '32px',
              flexDirection: isSmallMobile ? 'column' : 'row',
              gap: isSmallMobile ? '16px' : '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div>
                  <h2 style={{
                    fontSize: isMobile ? '20px' : '24px',
                    fontWeight: 'bold',
                    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                
                {/* Migrate All Button - Only show for older weeks with migratable tasks */}
                {isOlderWeek && migratableTasks.length > 0 && (
                  <button
                    onClick={() => setShowMigrateConfirm(true)}
                    disabled={isMigrating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: isMobile ? '8px 12px' : '12px 16px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isMigrating ? 'not-allowed' : 'pointer',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '600',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                      transition: 'all 0.2s ease',
                      opacity: isMigrating ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isMigrating) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 25px rgba(245, 158, 11, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      if (!isMigrating) {
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
                      }
                    }}
                    title={`Migrate ${migratableTasks.length} tasks to current week`}
                  >
                    {isMigrating ? (
                      <>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        {!isMobile && 'Migrating...'}
                      </>
                    ) : (
                      <>
                        <ArrowRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        {isMobile ? 'Migrate' : `Migrate All (${migratableTasks.length})`}
                      </>
                    )}
                  </button>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile 
                ? 'repeat(2, 1fr)' 
                : 'repeat(4, 1fr)', 
              gap: isMobile ? '16px' : '24px', 
              marginBottom: isMobile ? '24px' : '32px' 
            }}>
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
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isSmallMobile 
                ? '1fr' 
                : isMobile 
                  ? 'repeat(2, 1fr)' 
                  : 'repeat(3, 1fr)', 
              gap: '16px' 
            }}>
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
                  {stats.categories.life_admin.completed}/{stats.categories.life_admin.total}
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
                  {stats.categories.weekly_recurring.completed}/{stats.categories.weekly_recurring.total}
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
            <div style={{ 
              marginBottom: '24px', 
              paddingLeft: isMobile ? '16px' : '80px', 
              paddingRight: isMobile ? '16px' : '80px' 
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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
              <div style={{ 
                position: 'relative', 
                height: isMobile ? 'auto' : '270px', 
                marginBottom: '30px', 
                paddingLeft: isMobile ? '16px' : '60px', 
                paddingRight: isMobile ? '16px' : '60px' 
              }}>
                {/* Task Cards Container */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '12px',
                  height: isMobile ? 'auto' : '100%'
                }}>
                  {currentPageTasks.map((task) => {
                    const urgencyStyle = getUrgencyStyle(task.dueDate);
                    const latestUpdate = task.updates && task.updates.length > 0 
                      ? task.updates[0].updateText 
                      : null;
                    const { completed: completedSubtasks, total: totalSubtasks } = calculateSubtaskStats(task);

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
                        {/* Time Remaining and Category Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {/* Time Remaining */}
                          {task.estimatedDuration !== undefined && (
                            <div style={{
                              padding: '4px 8px',
                              background: task.status === 'done' 
                                ? 'rgba(16, 185, 129, 0.2)'
                                : calculateTimeRemaining(task.estimatedDuration, task.timeSpent, task.status) === 0
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : calculateTimeRemaining(task.estimatedDuration, task.timeSpent, task.status)! <= task.estimatedDuration * 0.3
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(255, 255, 255, 0.2)',
                              borderRadius: theme.borderRadius.sm,
                              fontSize: '10px',
                              fontWeight: '700',
                              color: task.status === 'done'
                                ? '#10b981'
                                : calculateTimeRemaining(task.estimatedDuration, task.timeSpent, task.status) === 0
                                  ? '#ef4444'
                                  : urgencyStyle.textColor,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${
                                task.status === 'done'
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : calculateTimeRemaining(task.estimatedDuration, task.timeSpent, task.status) === 0
                                    ? 'rgba(239, 68, 68, 0.3)'
                                    : 'rgba(255, 255, 255, 0.1)'
                              }`,
                              whiteSpace: 'nowrap'
                            }}>
                              {formatDuration(calculateTimeRemaining(task.estimatedDuration, task.timeSpent, task.status))} left
                            </div>
                          )}
                          
                          {/* Category Badge */}
                          <div style={{
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
                                const daysUntil = getDaysUntilDate(task.dueDate);
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
                          <span className={task.priority === 'urgent' ? 'urgent-priority-text' : ''} style={{ fontSize: '11px' }}>{priorityConfigs[task.priority].icon}</span>
                          <span className={task.priority === 'urgent' ? 'urgent-priority-text' : ''}>
                            {priorityConfigs[task.priority].title.replace(' Priority', '')}
                          </span>
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
        gap: isMobile ? '8px' : '20px',
        marginTop: isMobile ? '24px' : '32px',
        flexWrap: 'nowrap'
      }}>
        <button
          onClick={() => {
            setCurrentSlide(Math.max(0, currentSlide - 1));
            setHasUserNavigated(true);
            if (currentSlide === 1) setCurrentPage(0); // Reset pagination when leaving deadline view
          }}
          disabled={currentSlide === 0}
          style={{
            width: isMobile ? '40px' : '56px',
            height: isMobile ? '40px' : '56px',
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
          padding: isMobile ? '6px 12px' : '8px 20px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '30px',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '600',
          color: theme.colors.primary.dark,
          minWidth: isMobile ? '120px' : '200px',
          textAlign: 'center',
          border: '2px solid rgba(102, 126, 234, 0.2)',
          whiteSpace: 'nowrap'
        }}>
          {currentSlide === 0 
            ? (isMobile ? 'Overview' : 'Week Overview') 
            : (isMobile ? 'Deadlines' : 'Deadline Priority View')
          }
        </div>

        <button
          onClick={() => {
            setCurrentSlide(Math.min(1, currentSlide + 1));
            setHasUserNavigated(true);
            if (currentSlide === 0) setCurrentPage(0); // Reset pagination when entering deadline view
          }}
          disabled={currentSlide === 1}
          style={{
            width: isMobile ? '40px' : '56px',
            height: isMobile ? '40px' : '56px',
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

      {/* Migration Confirmation Dialog */}
      {showMigrateConfirm && (
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
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            borderRadius: '20px',
            padding: isMobile ? '24px' : '32px',
            minWidth: isMobile ? '320px' : '400px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
              }}>
                <ArrowRight className="w-8 h-8" style={{ color: 'white' }} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: theme.colors.text.primary,
                marginBottom: '8px',
                backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Migrate Tasks to Current Week
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.5',
                margin: 0
              }}>
                This will migrate {migratableTasks.length} tasks from Week {weekNumber} to Week {actualCurrentWeek}:
              </p>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '8px', fontWeight: '600' }}>
                Migration Details:
              </div>
              <ul style={{ fontSize: '13px', color: '#92400e', margin: 0, paddingLeft: '16px' }}>
                <li>To-Do tasks: Moved to Week {actualCurrentWeek}</li>
                <li>In-Progress tasks: Copied to Week {actualCurrentWeek} (original kept)</li>
                <li>Weekly recurring tasks are excluded</li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowMigrateConfirm(false)}
                disabled={isMigrating}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `2px solid ${theme.colors.border.light}`,
                  borderRadius: '12px',
                  cursor: isMigrating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  opacity: isMigrating ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isMigrating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.2s ease',
                  opacity: isMigrating ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isMigrating ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Migrating...
                  </>
                ) : (
                  'Yes, Migrate All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes gradient-flow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes urgent-text-blink {
            0%, 100% { 
              transform: scale(1);
              filter: brightness(1);
              text-shadow: 0 0 5px rgba(239, 68, 68, 0.6);
            }
            50% { 
              transform: scale(1.3);
              filter: brightness(1.4);
              text-shadow: 0 0 10px rgba(239, 68, 68, 1);
            }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .urgent-priority-text {
            animation: urgent-text-blink 2s ease-in-out infinite;
            display: inline-block;
          }
        `}
      </style>
    </div>
  );
};