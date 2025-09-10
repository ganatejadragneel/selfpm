import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Calendar, CheckCircle2, X, StickyNote } from 'lucide-react';
import { theme } from '../styles/theme';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import { supabase } from '../lib/supabase';
import { TaskNoteModal } from './TaskNoteModal';
import { getTodayLocalString, isSameLocalDate } from '../utils/dateUtils';
import type { CustomDailyTask } from '../types';


export const DailyTaskTracker: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customTasks, setCustomTasks] = useState<CustomDailyTask[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CustomDailyTask | null>(null);
  
  const { user } = useSupabaseAuthStore();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchCustomTasksAndCompletions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Reset alt_task_done for new day
      await supabase.rpc('reset_alt_task_daily');
      
      // Get today's date in local timezone
      const today = getTodayLocalString();
      
      // Fetch custom daily tasks
      const { data: customTasksData, error: tasksError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('new_user_id', user.id);
      
      if (tasksError) {
        console.error('Error fetching custom tasks:', tasksError);
        return;
      }
      
      // Fetch today's completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('daily_task_completions')
        .select('*')
        .eq('new_user_id', user.id)
        .eq('completion_date', today);
      
      if (completionsError) {
        console.error('Error fetching completions:', completionsError);
      }

      // Fetch today's notes
      const { data: notesData, error: notesError } = await supabase
        .from('daily_task_notes')
        .select('*')
        .eq('new_user_id', user.id)
        .eq('note_date', today);
      
      if (notesError) {
        console.error('Error fetching notes:', notesError);
      }
      
      // Combine tasks with their completion status and notes
      const tasksWithCompletions: CustomDailyTask[] = (customTasksData || []).map(task => {
        const completion = (completionsData || []).find(
          comp => comp.custom_task_id === task.id
        );
        const note = (notesData || []).find(
          n => n.custom_task_id === task.id
        );
        
        return {
          id: task.id,
          name: task.name,
          description: task.description,
          type: task.type as 'yes_no' | 'dropdown',
          options: task.options || [],
          currentValue: completion?.value || (task.type === 'yes_no' ? 'Not Done' : ''),
          completedToday: !!completion,
          noteText: note?.note_text || '',
          alt_task: task.alt_task || undefined,
          alt_task_done: task.alt_task_done || false
        };
      });
      
      setCustomTasks(tasksWithCompletions);
    } catch (error) {
      console.error('Error fetching custom tasks and completions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch custom daily tasks and today's completion status
  useEffect(() => {
    if (!user) return;
    
    fetchCustomTasksAndCompletions();
  }, [user, fetchCustomTasksAndCompletions]);

  // Check for day change and refresh data accordingly
  useEffect(() => {
    if (!user) return;

    let lastKnownDate = getTodayLocalString();
    
    // Check every minute if the date has changed
    const dateCheckInterval = setInterval(() => {
      const currentDate = getTodayLocalString();
      
      if (!isSameLocalDate(currentDate, lastKnownDate)) {
        console.log('New day detected, refreshing daily tasks...');
        lastKnownDate = currentDate;
        fetchCustomTasksAndCompletions(); // This will fetch today's completions (which will be empty for new day)
      }
    }, 60000); // Check every minute

    return () => clearInterval(dateCheckInterval);
  }, [user, fetchCustomTasksAndCompletions]);

  const handleTaskValueChange = async (taskId: string, newValue: string) => {
    if (!user) return;
    
    try {
      const today = getTodayLocalString();
      
      // Update or insert completion record
      const { error } = await supabase
        .from('daily_task_completions')
        .upsert({
          custom_task_id: taskId,
          new_user_id: user.id,
          value: newValue,
          completion_date: today
        }, {
          onConflict: 'custom_task_id,new_user_id,completion_date'
        });
      
      if (error) {
        console.error('Error updating task completion:', error);
        return;
      }
      
      // Update local state immediately (optimistic update)
      setCustomTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                currentValue: newValue,
                completedToday: true
              }
            : task
        )
      );
    } catch (error) {
      console.error('Failed to update task value:', error);
    }
  };

  const handleAltTaskChange = async (taskId: string, isDone: boolean) => {
    if (!user) return;
    
    try {
      // Update alt_task_done in the custom_tasks table
      const { error } = await supabase
        .from('custom_tasks')
        .update({ alt_task_done: isDone })
        .eq('id', taskId)
        .eq('new_user_id', user.id);
      
      if (error) {
        console.error('Error updating alt task status:', error);
        return;
      }
      
      // Update local state immediately (optimistic update)
      setCustomTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, alt_task_done: isDone }
            : task
        )
      );
    } catch (error) {
      console.error('Failed to update alt task status:', error);
    }
  };

  const completedCount = customTasks.filter(task => 
    task.type === 'yes_no' 
      ? task.currentValue === 'Done'
      : task.currentValue && task.currentValue !== ''
  ).length;
  
  const totalCount = customTasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Handle mobile toggle
  const handleMobileToggle = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  // Handle mobile close
  const handleMobileClose = () => {
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  // Handle hover for desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
    }
  };

  // Handle opening note modal
  const handleOpenNoteModal = (task: CustomDailyTask) => {
    setSelectedTask(task);
    setNoteModalOpen(true);
  };

  // Handle note save
  const handleNoteSaved = (taskId: string, noteText: string | null) => {
    setCustomTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, noteText: noteText || '' }
          : task
      )
    );
  };

  // Swipe gesture handling for mobile
  useEffect(() => {
    if (!isMobile || !isExpanded) return;

    let startX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      // Swipe left to close
      if (diff > 50) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isExpanded]);

  const stripWidth = isExpanded 
    ? (isMobile ? '100vw' : '25vw') 
    : '2.5vw';

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
          onClick={handleMobileClose}
        />
      )}

      {/* Main tracker component */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: stripWidth,
          background: isExpanded 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'
            : theme.colors.surface.white,
          borderRight: isExpanded 
            ? `3px solid transparent`
            : `2px solid ${theme.colors.border.light}`,
          backgroundImage: isExpanded 
            ? `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%), linear-gradient(90deg, ${theme.colors.primary.light}, ${theme.colors.status.success.light})`
            : 'none',
          backgroundClip: isExpanded ? 'padding-box, border-box' : 'padding-box',
          backgroundOrigin: isExpanded ? 'border-box' : 'border-box',
          boxShadow: isExpanded 
            ? '4px 0 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '2px 0 8px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)',
          zIndex: 999,
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          transform: isMobile && !isExpanded ? 'translateX(-90%)' : 'translateX(0)',
          cursor: !isExpanded && !isMobile ? 'pointer' : 'default',
          overflow: 'hidden'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={isMobile ? handleMobileToggle : undefined}
      >
        {/* Collapsed state - 2.5% strip */}
        {!isExpanded && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing.sm,
            background: completionPercentage === 100 
              ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' 
              : completionPercentage > 50 
                ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
                : 'linear-gradient(180deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)',
            borderRight: completionPercentage === 100 
              ? `2px solid ${theme.colors.status.success.medium}`
              : completionPercentage > 50 
                ? `2px solid ${theme.colors.status.warning.medium}`
                : `2px solid ${theme.colors.primary.medium}`,
            position: 'relative'
          }}>
            {/* Expand hint icon with subtle animation */}
            <ChevronRight 
              size={18}
              color={completionPercentage === 100 
                ? theme.colors.status.success.dark
                : completionPercentage > 50 
                  ? theme.colors.status.warning.dark
                  : theme.colors.primary.dark}
              style={{ 
                marginBottom: theme.spacing.sm,
                transition: 'all 0.3s ease',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
              }}
            />
            
            {/* Task count badge with gradient */}
            {totalCount > 0 && (
              <div style={{
                background: completionPercentage === 100 
                  ? theme.colors.status.success.gradient
                  : completionPercentage > 50 
                    ? theme.colors.status.warning.gradient
                    : theme.colors.primary.gradient,
                color: 'white',
                borderRadius: theme.borderRadius.full,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: theme.spacing.sm,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {completedCount}/{totalCount}
              </div>
            )}
            
            {/* Calendar icon with better styling */}
            <Calendar 
              size={14}
              color={theme.colors.text.secondary}
              style={{ 
                marginBottom: theme.spacing.sm,
                opacity: 0.8
              }}
            />
            
            {/* Vertical text hint with better typography */}
            <div style={{
              writingMode: 'vertical-rl',
              fontSize: '11px',
              color: theme.colors.text.secondary,
              fontWeight: 600,
              letterSpacing: '2px',
              marginTop: theme.spacing.md,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              DAILY
            </div>
          </div>
        )}

        {/* Expanded state - task list */}
        {isExpanded && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: theme.spacing.lg,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Header with gradient accent */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.lg,
              paddingBottom: theme.spacing.md,
              borderBottom: `2px solid transparent`,
              backgroundImage: `linear-gradient(90deg, ${theme.colors.primary.light}, ${theme.colors.status.success.light})`,
              backgroundSize: '100% 2px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom'
            }}>
              <div>
                <h3 style={{
                  margin: 0,
                  color: theme.colors.text.primary,
                  fontSize: '20px',
                  fontWeight: 700,
                  background: theme.colors.primary.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  Daily Tasks
                </h3>
                <div style={{
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs,
                  fontWeight: 500
                }}>
                  {completedCount} of {totalCount} completed
                  {totalCount > 0 && (
                    <span style={{
                      marginLeft: theme.spacing.sm,
                      padding: '2px 8px',
                      borderRadius: theme.borderRadius.full,
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: completionPercentage === 100 
                        ? theme.colors.status.success.light
                        : completionPercentage > 50 
                          ? theme.colors.status.warning.light
                          : theme.colors.status.info.light,
                      color: completionPercentage === 100 
                        ? theme.colors.status.success.dark
                        : completionPercentage > 50 
                          ? theme.colors.status.warning.dark
                          : theme.colors.status.info.dark
                    }}>
                      {Math.round(completionPercentage)}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* Close button for mobile with better styling */}
              {isMobile && (
                <button
                  onClick={handleMobileClose}
                  style={{
                    background: theme.colors.surface.glass,
                    border: `1px solid ${theme.colors.border.light}`,
                    cursor: 'pointer',
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.status.error.light;
                    e.currentTarget.style.color = theme.colors.status.error.dark;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface.glass;
                    e.currentTarget.style.color = theme.colors.text.secondary;
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Enhanced Progress bar */}
            {totalCount > 0 && (
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: theme.borderRadius.full,
                marginBottom: theme.spacing.lg,
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${completionPercentage}%`,
                  background: completionPercentage === 100 
                    ? theme.colors.status.success.gradient
                    : completionPercentage > 50 
                      ? theme.colors.status.warning.gradient
                      : theme.colors.primary.gradient,
                  borderRadius: theme.borderRadius.full,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  position: 'relative'
                }} />
              </div>
            )}

            {/* Task list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: theme.spacing.sm
            }}>
              {loading ? (
                <div style={{
                  textAlign: 'center',
                  color: theme.colors.text.muted,
                  padding: theme.spacing.xl
                }}>
                  Loading daily tasks...
                </div>
              ) : customTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: theme.colors.text.muted,
                  padding: theme.spacing.xl,
                  fontSize: theme.typography.sizes.sm
                }}>
                  <CheckCircle2 size={48} style={{ marginBottom: theme.spacing.md, opacity: 0.3 }} />
                  <div>No daily tasks yet</div>
                  <div style={{ marginTop: theme.spacing.xs, fontSize: theme.typography.sizes.xs }}>
                    Add custom daily tasks in Settings to track them here
                  </div>
                </div>
              ) : (
                customTasks.map(task => {
                  const isCompleted = task.type === 'yes_no' 
                    ? task.currentValue === 'Done'
                    : task.currentValue && task.currentValue !== '';
                  
                  return (
                    <div
                      key={task.id}
                      style={{
                        marginBottom: theme.spacing.md,
                        padding: theme.spacing.md,
                        background: isCompleted
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%)',
                        borderRadius: theme.borderRadius.lg,
                        border: isCompleted 
                          ? `2px solid ${theme.colors.status.success.light}`
                          : `1px solid ${theme.colors.border.light}`,
                        boxShadow: isCompleted
                          ? '0 4px 12px rgba(16, 185, 129, 0.15)'
                          : '0 2px 8px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {isCompleted && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '40px',
                          height: '40px',
                          background: theme.colors.status.success.gradient,
                          borderRadius: '0 12px 0 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircle2 size={16} color="white" />
                        </div>
                      )}

                      <div style={{
                        fontSize: theme.typography.sizes.base,
                        fontWeight: 600,
                        color: isCompleted ? theme.colors.status.success.dark : theme.colors.text.primary,
                        marginBottom: theme.spacing.sm,
                        paddingRight: isCompleted ? '40px' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: theme.spacing.sm
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          flex: 1
                        }}>
                          <div style={{
                            width: '4px',
                            height: '20px',
                            background: isCompleted 
                              ? theme.colors.status.success.gradient
                              : theme.colors.primary.gradient,
                            borderRadius: '2px'
                          }} />
                          {task.name}
                          {task.alt_task && task.alt_task_done && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 8px',
                              background: theme.colors.status.purple.gradient,
                              borderRadius: theme.borderRadius.full,
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'white',
                              marginLeft: theme.spacing.sm,
                              boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
                            }}>
                              ALT ✓
                            </div>
                          )}
                          {task.noteText && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: theme.colors.status.info.dark,
                              borderRadius: '50%',
                              position: 'relative',
                              top: '-8px',
                              right: '-4px'
                            }} />
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenNoteModal(task)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: theme.borderRadius.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: theme.typography.sizes.xs,
                            color: task.noteText ? theme.colors.status.info.dark : theme.colors.text.muted,
                            transition: 'all 0.2s ease',
                            opacity: 0.7
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'none';
                            e.currentTarget.style.opacity = '0.7';
                          }}
                        >
                          <StickyNote size={14} />
                          {task.noteText ? 'Edit Note' : 'Add Note'}
                        </button>
                      </div>

                      {task.description && (
                        <div style={{
                          fontSize: theme.typography.sizes.sm,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing.md,
                          paddingLeft: '16px',
                          fontStyle: 'italic',
                          opacity: 0.8
                        }}>
                          {task.description}
                        </div>
                      )}

                      {/* Alternative Task Section */}
                      {task.alt_task && (
                        <div style={{
                          marginBottom: theme.spacing.md,
                          padding: theme.spacing.md,
                          background: task.alt_task_done
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%)',
                          borderRadius: theme.borderRadius.md,
                          border: task.alt_task_done 
                            ? `2px solid ${theme.colors.status.purple.light}`
                            : `1px solid ${theme.colors.border.light}`,
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{
                            fontSize: theme.typography.sizes.sm,
                            color: theme.colors.text.secondary,
                            marginBottom: theme.spacing.sm,
                            fontWeight: 500
                          }}>
                            Alt:
                          </div>
                          <div style={{
                            fontSize: theme.typography.sizes.base,
                            color: task.alt_task_done ? theme.colors.status.purple.dark : theme.colors.text.primary,
                            marginBottom: theme.spacing.sm,
                            fontWeight: 500
                          }}>
                            {task.alt_task}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: theme.spacing.lg,
                            alignItems: 'center'
                          }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              cursor: 'pointer',
                              fontSize: theme.typography.sizes.sm,
                              color: theme.colors.text.primary
                            }}>
                              <input
                                type="radio"
                                name={`alt-task-${task.id}`}
                                checked={task.alt_task_done === true}
                                onChange={() => handleAltTaskChange(task.id, true)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  accentColor: theme.colors.status.purple.dark
                                }}
                              />
                              Done
                            </label>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              cursor: 'pointer',
                              fontSize: theme.typography.sizes.sm,
                              color: theme.colors.text.primary
                            }}>
                              <input
                                type="radio"
                                name={`alt-task-${task.id}`}
                                checked={task.alt_task_done === false}
                                onChange={() => handleAltTaskChange(task.id, false)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  accentColor: theme.colors.border.medium
                                }}
                              />
                              Not Done
                            </label>
                          </div>
                        </div>
                      )}

                      {task.type === 'yes_no' && (
                        <select
                          value={task.currentValue || 'Not Done'}
                          onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: theme.borderRadius.md,
                            border: `2px solid ${isCompleted ? theme.colors.status.success.light : theme.colors.border.light}`,
                            backgroundColor: theme.colors.surface.white,
                            fontSize: theme.typography.sizes.sm,
                            fontWeight: 500,
                            color: theme.colors.text.primary,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                            backgroundImage: 'linear-gradient(45deg, transparent 50%, rgba(0, 0, 0, 0.05) 50%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'right 12px center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <option value="Not Done">Not Done</option>
                          <option value="Done">✅ Done</option>
                        </select>
                      )}

                      {task.type === 'dropdown' && task.options && (
                        <select
                          value={task.currentValue || ''}
                          onChange={(e) => handleTaskValueChange(task.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: theme.borderRadius.md,
                            border: `2px solid ${isCompleted ? theme.colors.status.success.light : theme.colors.border.light}`,
                            backgroundColor: theme.colors.surface.white,
                            fontSize: theme.typography.sizes.sm,
                            fontWeight: 500,
                            color: theme.colors.text.primary,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                          }}
                        >
                          <option value="">Choose an option...</option>
                          {task.options.map(option => (
                            <option key={option} value={option}>
                              {task.currentValue === option ? '✅ ' : ''}{option}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Note Modal */}
      {selectedTask && (
        <TaskNoteModal
          isOpen={noteModalOpen}
          onClose={() => {
            setNoteModalOpen(false);
            setSelectedTask(null);
          }}
          taskId={selectedTask.id}
          taskName={selectedTask.name}
          date={new Date()}
          existingNote={selectedTask.noteText}
          onNoteSaved={(noteText) => {
            handleNoteSaved(selectedTask.id, noteText);
            setNoteModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
};