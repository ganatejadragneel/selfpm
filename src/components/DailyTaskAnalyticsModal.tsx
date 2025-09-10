import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import { theme } from '../styles/theme';
import { X, ChevronLeft, ChevronRight, Calendar, BarChart3, Grid3x3, PieChart, RefreshCw } from 'lucide-react';
import { format } from 'date-fns/format';
import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { formatLocalDateString } from '../utils/dateUtils';
import type { BaseModalProps, CustomDailyTask, DailyTaskCompletion, DailyTaskNote } from '../types';
import { getDisplayValue, getDropdownColor } from '../constants/dailyTasks';

// Graph types
type GraphType = 'bar' | 'heatmap' | 'pie';

// Time periods
type TimePeriod = '7d' | '14d' | '30d';

interface DailyTaskAnalyticsModalProps extends BaseModalProps {}

export const DailyTaskAnalyticsModal: React.FC<DailyTaskAnalyticsModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { user } = useSupabaseAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CustomDailyTask[]>([]);
  const [completions, setCompletions] = useState<DailyTaskCompletion[]>([]);
  const [notes, setNotes] = useState<DailyTaskNote[]>([]);
  const [selectedGraphType, setSelectedGraphType] = useState<GraphType>(() => {
    return (localStorage.getItem('dailyTaskAnalytics_graphType') as GraphType) || 'bar';
  });
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>(() => {
    const stored = localStorage.getItem('dailyTaskAnalytics_timePeriod');
    return (stored === '6m' || stored === '1y' || !['7d', '14d', '30d'].includes(stored || '')) ? '7d' : (stored as TimePeriod);
  });

  // Calculate date range based on selected time period
  const getDateRangeForPeriod = useCallback((period: TimePeriod, baseDate: Date = new Date()) => {
    const today = startOfDay(baseDate);
    
    switch (period) {
      case '7d':
        return {
          start: subDays(today, 6),
          end: endOfDay(today)
        };
      case '14d':
        return {
          start: subDays(today, 13),
          end: endOfDay(today)
        };
      case '30d':
        return {
          start: subDays(today, 29),
          end: endOfDay(today)
        };
      default:
        return {
          start: subDays(today, 6),
          end: endOfDay(today)
        };
    }
  }, []);

  const [currentDateRange, setCurrentDateRange] = useState(() => {
    return getDateRangeForPeriod(selectedTimePeriod);
  });

  // Generate date range array for bar chart (always show all days)
  const barChartDateRange = useCallback(() => {
    const dates = [];
    let current = new Date(currentDateRange.start);
    const end = currentDateRange.end;
    
    // Always show all days for bar chart, up to 31 days max
    let dayCount = 0;
    while (current <= end && dayCount < 31) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      dayCount++;
    }
    
    return dates;
  }, [currentDateRange])();

  // Generate date range array for display (pie chart - can use sampling)
  const generateDateRange = useCallback((start: Date, end: Date) => {
    const dates = [];
    let current = new Date(start);
    
    // For longer periods, sample dates to keep visualization manageable
    const maxPoints = 30;
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (totalDays <= maxPoints) {
      // Show all days
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Sample dates for better visualization
      const step = Math.ceil(totalDays / maxPoints);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + step);
      }
    }
    
    return dates;
  }, []);

  const dateRange = generateDateRange(currentDateRange.start, currentDateRange.end);
  
  // Generate full date range for heat map (always show all days, up to 31)
  const heatMapDateRange = useCallback(() => {
    const dates = [];
    let current = new Date(currentDateRange.start);
    const end = currentDateRange.end;
    let dayCount = 0;
    
    // Show all days up to 31 days max for heat map
    while (current <= end && dayCount < 31) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      dayCount++;
    }
    
    return dates;
  }, [currentDateRange])();

  // Navigate date range based on selected time period
  const navigatePeriod = (direction: 'prev' | 'next') => {
    setCurrentDateRange(prev => {
      const multiplier = direction === 'prev' ? -1 : 1;
      let start, end;
      
      switch (selectedTimePeriod) {
        case '7d':
          start = addDays(prev.start, 7 * multiplier);
          end = addDays(prev.end, 7 * multiplier);
          break;
        case '14d':
          start = addDays(prev.start, 14 * multiplier);
          end = addDays(prev.end, 14 * multiplier);
          break;
        case '30d':
          start = addDays(prev.start, 30 * multiplier);
          end = addDays(prev.end, 30 * multiplier);
          break;
        default:
          start = addDays(prev.start, 7 * multiplier);
          end = addDays(prev.end, 7 * multiplier);
      }
      
      return { start, end };
    });
  };

  // Handle graph type change with localStorage persistence
  const handleGraphTypeChange = (graphType: GraphType) => {
    setSelectedGraphType(graphType);
    localStorage.setItem('dailyTaskAnalytics_graphType', graphType);
  };

  // Handle time period change with localStorage persistence
  const handleTimePeriodChange = (timePeriod: TimePeriod) => {
    setSelectedTimePeriod(timePeriod);
    localStorage.setItem('dailyTaskAnalytics_timePeriod', timePeriod);
    setCurrentDateRange(getDateRangeForPeriod(timePeriod));
  };

  // Fetch custom tasks and completions
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch custom tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('new_user_id', user.id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      if (tasksData && tasksData.length > 0) {
        // Fetch completions for the date range
        const startDate = formatLocalDateString(currentDateRange.start);
        const endDate = formatLocalDateString(currentDateRange.end);
        
        const { data: completionsData, error: completionsError } = await supabase
          .from('daily_task_completions')
          .select('*')
          .eq('new_user_id', user.id)
          .in('custom_task_id', tasksData.map(t => t.id))
          .gte('completion_date', startDate)
          .lte('completion_date', endDate)
          .order('completion_date', { ascending: true });

        if (completionsError) throw completionsError;
        setCompletions(completionsData || []);

        // Fetch notes for the date range
        const { data: notesData, error: notesError } = await supabase
          .from('daily_task_notes')
          .select('*')
          .eq('new_user_id', user.id)
          .in('custom_task_id', tasksData.map(t => t.id))
          .gte('note_date', startDate)
          .lte('note_date', endDate)
          .order('note_date', { ascending: true });

        if (notesError) throw notesError;
        setNotes(notesData || []);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user, currentDateRange]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Auto-refresh data every 30 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, fetchData]);

  if (!isOpen) return null;

  return createPortal(
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
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={28} style={{ color: theme.colors.primary.dark }} />
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              background: theme.colors.primary.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Daily Task Analytics
            </h2>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={24} style={{ color: '#ef4444' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              fontSize: '16px',
              color: theme.colors.text.secondary,
            }}>
              Loading analytics...
            </div>
          )}

          {error && (
            <div style={{
              padding: '24px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '24px',
            }}>
              {error}
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: theme.colors.text.secondary,
              fontSize: '16px',
            }}>
              <Calendar size={48} style={{ 
                color: theme.colors.text.muted,
                marginBottom: '16px'
              }} />
              <p>No custom daily tasks found.</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Create some daily tasks in Settings to see analytics here.
              </p>
            </div>
          )}

          {!loading && !error && tasks.length > 0 && (
            <>
              {/* Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '20px',
              }}>
                {/* Date Navigation */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <button
                    onClick={() => navigatePeriod('prev')}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border.light}`,
                      background: theme.colors.surface.white,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div style={{
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.sizes.sm,
                    fontWeight: theme.typography.weights.semibold,
                    color: theme.colors.primary.dark,
                  }}>
                    {format(currentDateRange.start, 'dd/MM/yyyy')} - {format(currentDateRange.end, 'dd/MM/yyyy')}
                  </div>
                  
                  <button
                    onClick={() => navigatePeriod('next')}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border.light}`,
                      background: theme.colors.surface.white,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* Refresh Button */}
                  <button
                    onClick={() => fetchData()}
                    disabled={loading}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border.light}`,
                      background: loading ? theme.colors.border.light : theme.colors.surface.white,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    title="Refresh data"
                  >
                    <RefreshCw size={16} style={{
                      color: loading ? theme.colors.text.muted : theme.colors.primary.dark,
                      animation: loading ? 'spin 1s linear infinite' : 'none',
                    }} />
                  </button>
                </div>

                {/* Graph Type Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(248, 250, 252, 0.8)',
                  borderRadius: theme.borderRadius.md,
                  padding: '6px',
                  border: `1px solid ${theme.colors.border.light}`,
                  gap: '4px',
                }}>
                  {([
                    { type: 'bar' as const, icon: BarChart3, label: 'Bar Chart' },
                    { type: 'heatmap' as const, icon: Grid3x3, label: 'Heat Map' },
                    { type: 'pie' as const, icon: PieChart, label: 'Pie Chart' },
                  ] as const).map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => handleGraphTypeChange(type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: selectedGraphType === type 
                          ? theme.colors.primary.gradient 
                          : 'transparent',
                        color: selectedGraphType === type 
                          ? 'white' 
                          : theme.colors.text.secondary,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        cursor: 'pointer',
                        fontSize: theme.typography.sizes.sm,
                        fontWeight: theme.typography.weights.medium,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Time Period Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(248, 250, 252, 0.8)',
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.xs,
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}>
                  {([
                    { period: '7d' as const, label: '7 Days' },
                    { period: '14d' as const, label: '14 Days' },
                    { period: '30d' as const, label: '30 Days' },
                  ] as const).map(({ period, label }) => (
                    <button
                      key={period}
                      onClick={() => handleTimePeriodChange(period)}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        background: selectedTimePeriod === period 
                          ? theme.colors.primary.gradient 
                          : 'transparent',
                        color: selectedTimePeriod === period 
                          ? 'white' 
                          : theme.colors.text.secondary,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        cursor: 'pointer',
                        fontSize: theme.typography.sizes.sm,
                        fontWeight: theme.typography.weights.medium,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div style={{ marginBottom: '32px' }}>
                {/* Pie Chart View */}
                {selectedGraphType === 'pie' && (
                  <>
                    <div style={{
                      marginBottom: theme.spacing.xl,
                    }}>
                      <h3 style={{
                        fontSize: theme.typography.sizes.lg,
                        fontWeight: theme.typography.weights.semibold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.lg,
                        textAlign: 'center',
                      }}>
                        Task Completion Distribution
                      </h3>
                      
                      {/* Pie Charts Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: theme.spacing.lg,
                        padding: theme.spacing.md,
                      }}>
                        {tasks.map((task, taskIndex) => {
                          // Calculate completion stats for this task
                          const taskCompletions = completions.filter(c => c.custom_task_id === task.id);
                          const totalDays = dateRange.length;
                          const completedDays = dateRange.filter(date => {
                            const dateStr = formatLocalDateString(date);
                            const completion = taskCompletions.find(c => c.completion_date === dateStr);
                            if (!completion) return false;
                            
                            if (task.type === 'yes_no') {
                              return completion.value === 'Done';
                            } else {
                              return completion.value && String(completion.value).trim() !== '';
                            }
                          }).length;
                          
                          const incompleteDays = totalDays - completedDays;
                          const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
                          
                          // Colors for pie segments
                          const completedColor = [
                            theme.colors.status.success.dark,
                            theme.colors.primary.dark,
                            theme.colors.status.warning.dark,
                            theme.colors.status.info.dark,
                            '#9333ea',
                            '#dc2626',
                          ][taskIndex % 6];
                          const incompleteColor = '#e5e7eb';
                          
                          // Calculate pie chart angles
                          const completedAngle = (completedDays / totalDays) * 360;
                          
                          // SVG path for pie segments
                          const createPieSegment = (startAngle: number, endAngle: number, radius: number, color: string) => {
                            const centerX = 80;
                            const centerY = 80;
                            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                            
                            const x1 = centerX + radius * Math.cos(startAngleRad);
                            const y1 = centerY + radius * Math.sin(startAngleRad);
                            const x2 = centerX + radius * Math.cos(endAngleRad);
                            const y2 = centerY + radius * Math.sin(endAngleRad);
                            
                            const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
                            
                            return {
                              path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
                              color: color
                            };
                          };
                          
                          const completedSegment = completedDays > 0 ? createPieSegment(0, completedAngle, 60, completedColor) : null;
                          
                          return (
                            <div key={task.id} style={{
                              background: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: theme.borderRadius.lg,
                              padding: theme.spacing.lg,
                              border: `1px solid ${theme.colors.border.light}`,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              textAlign: 'center',
                            }}>
                              {/* Task Name */}
                              <h4 style={{
                                fontSize: theme.typography.sizes.base,
                                fontWeight: theme.typography.weights.semibold,
                                color: theme.colors.text.primary,
                                marginBottom: theme.spacing.md,
                                wordBreak: 'break-word',
                              }}>
                                {task.name}
                              </h4>
                              
                              {/* Pie Chart SVG */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: theme.spacing.md,
                              }}>
                                <svg width="160" height="160" viewBox="0 0 160 160">
                                  {/* Background circle */}
                                  <circle
                                    cx="80"
                                    cy="80"
                                    r="60"
                                    fill={totalDays === 0 ? '#f3f4f6' : incompleteColor}
                                    stroke="white"
                                    strokeWidth="2"
                                  />
                                  
                                  {/* Completed segment */}
                                  {completedSegment && (
                                    <path
                                      d={completedSegment.path}
                                      fill={completedSegment.color}
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                  )}
                                  
                                  {/* Center completion percentage */}
                                  <text
                                    x="80"
                                    y="75"
                                    textAnchor="middle"
                                    style={{
                                      fontSize: '20px',
                                      fontWeight: 'bold',
                                      fill: theme.colors.text.primary,
                                    }}
                                  >
                                    {Math.round(completionRate)}%
                                  </text>
                                  <text
                                    x="80"
                                    y="90"
                                    textAnchor="middle"
                                    style={{
                                      fontSize: '12px',
                                      fill: theme.colors.text.secondary,
                                    }}
                                  >
                                    Complete
                                  </text>
                                </svg>
                              </div>
                              
                              {/* Legend */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: theme.spacing.lg,
                                fontSize: theme.typography.sizes.sm,
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: theme.spacing.xs,
                                }}>
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: completedColor,
                                  }} />
                                  <span style={{ color: theme.colors.text.secondary }}>
                                    Completed ({completedDays})
                                  </span>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: theme.spacing.xs,
                                }}>
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: incompleteColor,
                                  }} />
                                  <span style={{ color: theme.colors.text.secondary }}>
                                    Missed ({incompleteDays})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Additional Info */}
                      <div style={{
                        marginTop: theme.spacing.lg,
                        padding: theme.spacing.md,
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.primary.light}30`,
                      }}>
                        <p style={{
                          fontSize: theme.typography.sizes.sm,
                          color: theme.colors.text.secondary,
                          margin: 0,
                          textAlign: 'center',
                        }}>
                          🥧 Each pie chart shows completion vs missed days for individual tasks over the selected time period
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Bar Chart View */}
                {selectedGraphType === 'bar' && (
                  <>
                    <div style={{
                      marginBottom: theme.spacing.xl,
                    }}>
                      <h3 style={{
                        fontSize: theme.typography.sizes.lg,
                        fontWeight: theme.typography.weights.semibold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.lg,
                        textAlign: 'center',
                      }}>
                        Daily Task Completion
                      </h3>
                      
                      {/* Bar Chart Container */}
                      <div style={{
                        background: 'rgba(248, 250, 252, 0.5)',
                        borderRadius: theme.borderRadius.lg,
                        padding: theme.spacing.xl,
                        border: `1px solid ${theme.colors.border.light}`,
                        overflowX: 'auto',
                      }}>
                        {/* Bar Chart */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `180px repeat(${barChartDateRange.length}, 24px)`,
                          gap: '2px',
                          alignItems: 'center',
                          minWidth: 'fit-content',
                        }}>
                          {/* Header with dates */}
                          <div style={{
                            fontSize: theme.typography.sizes.sm,
                            fontWeight: theme.typography.weights.semibold,
                            color: theme.colors.text.primary,
                            padding: theme.spacing.sm,
                          }}>
                            Tasks
                          </div>
                          {barChartDateRange.map((date) => (
                            <div key={date.toISOString()} style={{
                              fontSize: '10px',
                              color: theme.colors.text.muted,
                              textAlign: 'center',
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              height: '60px',
                              display: 'flex',
                              alignItems: 'end',
                              justifyContent: 'center',
                              padding: '2px',
                            }}>
                              {format(date, 'dd/MM')}
                            </div>
                          ))}
                          
                          {/* Task rows with individual day blocks */}
                          {tasks.map((task) => {
                            // Color assignment function for dropdown tasks based on option position
                            const getValueColor = (value: string) => {
                              if (task.type === 'yes_no') {
                                return value === 'Done' 
                                  ? theme.colors.status.success.dark 
                                  : value === 'Not Done' 
                                    ? '#ef4444' 
                                    : '#f3f4f6';
                              } else {
                                return getDropdownColor(value, task.options || []);
                              }
                            };
                            
                            return (
                              <React.Fragment key={task.id}>
                                {/* Task name */}
                                <div style={{
                                  fontSize: theme.typography.sizes.sm,
                                  color: theme.colors.text.primary,
                                  fontWeight: theme.typography.weights.medium,
                                  padding: theme.spacing.sm,
                                  background: 'rgba(255, 255, 255, 0.8)',
                                  borderRadius: theme.borderRadius.sm,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {task.name.length > 20 ? `${task.name.slice(0, 20)}...` : task.name}
                                </div>
                                
                                {/* Day blocks */}
                                {barChartDateRange.map((date) => {
                                  const dateStr = formatLocalDateString(date);
                                  const completion = completions.find(
                                    c => c.custom_task_id === task.id && c.completion_date === dateStr
                                  );
                                  const note = notes.find(
                                    n => n.custom_task_id === task.id && n.note_date === dateStr
                                  );
                                  
                                  const value = completion ? String(completion.value) : '';
                                  const blockColor = completion ? getValueColor(value) : '#f3f4f6';
                                  const opacity = completion ? 1 : 0.3;
                                  
                                  // Check if alt task was done (we need to check the task's alt_task_done status)
                                  // Since alt_task_done resets daily, we'd need to track it historically
                                  // For now, we'll use the current alt_task_done status for today only
                                  const isToday = formatLocalDateString(new Date()) === dateStr;
                                  const altTaskDone = isToday && task.alt_task && task.alt_task_done;

                                  // Create tooltip text with note if available
                                  const tooltipText = `${task.name} - ${format(date, 'dd/MM/yyyy')}\nTask: ${getDisplayValue(value, task.type)}${note ? `\nNote: ${note.note_text}` : ''}${completion || note ? '\n\nClick for details' : ''}`;
                                  
                                  return (
                                    <div
                                      key={date.toISOString()}
                                      style={{
                                        width: '22px',
                                        height: '22px',
                                        background: blockColor,
                                        borderRadius: '3px',
                                        border: '1px solid rgba(255, 255, 255, 0.6)',
                                        opacity: opacity,
                                        transition: 'all 0.2s ease',
                                        cursor: (completion || note) ? 'pointer' : 'default',
                                        position: 'relative',
                                      }}
                                      title={tooltipText}
                                      onClick={async () => {
                                        if (completion || note) {
                                          // Fetch alt_task information if it exists
                                          let altTaskInfo = '';
                                          if (task.alt_task && task.alt_task_done) {
                                            altTaskInfo = `\n\nAlternate task: ${task.alt_task}: Done`;
                                          }
                                          
                                          // Show detailed popup
                                          alert(`${task.name} - ${format(date, 'dd/MM/yyyy')}\n\nTask: ${getDisplayValue(value, task.type)}${note ? `\n\nNote: ${note.note_text}` : ''}${altTaskInfo}`);
                                        }
                                      }}
                                      onMouseEnter={(e) => {
                                        if (completion || note) {
                                          e.currentTarget.style.transform = 'scale(1.1)';
                                          e.currentTarget.style.zIndex = '10';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.zIndex = 'auto';
                                      }}
                                    >
                                      {note && (
                                        <div style={{
                                          position: 'absolute',
                                          top: '-3px',
                                          right: '-3px',
                                          width: '8px',
                                          height: '8px',
                                          backgroundColor: theme.colors.status.warning.dark,
                                          borderRadius: '50%',
                                          border: '1px solid white',
                                          fontSize: '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: 'white',
                                          fontWeight: 'bold'
                                        }}>
                                          N
                                        </div>
                                      )}
                                      {altTaskDone && (
                                        <svg
                                          style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none'
                                          }}
                                          viewBox="0 0 22 22"
                                        >
                                          {/* First diagonal line (top-left to bottom-right) */}
                                          <line
                                            x1="3"
                                            y1="3"
                                            x2="19"
                                            y2="19"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeDasharray="2,2"
                                            opacity="0.9"
                                          />
                                          {/* Second diagonal line (top-right to bottom-left) */}
                                          <line
                                            x1="19"
                                            y1="3"
                                            x2="3"
                                            y2="19"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeDasharray="2,2"
                                            opacity="0.9"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        
                        {/* Legend */}
                        <div style={{
                          marginTop: theme.spacing.lg,
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: theme.spacing.md,
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.text.secondary,
                        }}>
                          {/* Yes/No Legend */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              background: theme.colors.status.success.dark,
                              borderRadius: '2px',
                            }} />
                            <span>Done</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              background: '#ef4444',
                              borderRadius: '2px',
                            }} />
                            <span>Not Done</span>
                          </div>
                          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                          <span style={{ fontStyle: 'italic' }}>
                            Dropdown options use position-based colors (option 1 → light colors, option 30 → dark colors)
                          </span>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div style={{
                        marginTop: theme.spacing.lg,
                        padding: theme.spacing.md,
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.primary.light}30`,
                      }}>
                        <p style={{
                          fontSize: theme.typography.sizes.sm,
                          color: theme.colors.text.secondary,
                          margin: 0,
                          textAlign: 'center',
                        }}>
                          📊 Each block represents one day for one task. Hover over blocks to see details.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Heat Map View */}
                {selectedGraphType === 'heatmap' && (
                  <>
                    <div style={{
                      marginBottom: theme.spacing.xl,
                    }}>
                      <h3 style={{
                        fontSize: theme.typography.sizes.lg,
                        fontWeight: theme.typography.weights.semibold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.lg,
                        textAlign: 'center',
                      }}>
                        Daily Activity Heat Map
                      </h3>
                      
                      {/* Heat Map Container */}
                      <div style={{
                        background: 'rgba(248, 250, 252, 0.5)',
                        borderRadius: theme.borderRadius.lg,
                        padding: theme.spacing.xl,
                        border: `1px solid ${theme.colors.border.light}`,
                        overflowX: 'auto',
                      }}>
                        {/* Heat Map Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `120px repeat(${heatMapDateRange.length}, 20px)`,
                          gap: '2px',
                          alignItems: 'center',
                          minWidth: 'fit-content',
                        }}>
                          {/* Header with dates */}
                          <div></div>
                          {heatMapDateRange.map((date) => (
                            <div key={date.toISOString()} style={{
                              fontSize: '10px',
                              color: theme.colors.text.muted,
                              textAlign: 'center',
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              height: '60px',
                              display: 'flex',
                              alignItems: 'end',
                              justifyContent: 'center',
                            }}>
                              {format(date, 'dd/MM')}
                            </div>
                          ))}
                          
                          {/* Task rows */}
                          {tasks.map((task, taskIndex) => {
                            const taskColor = [
                              theme.colors.status.success.dark,
                              theme.colors.primary.dark,
                              theme.colors.status.warning.dark,
                              theme.colors.status.info.dark,
                              '#9333ea',
                              '#dc2626',
                            ][taskIndex % 6];
                            
                            return (
                              <React.Fragment key={task.id}>
                                {/* Task name */}
                                <div style={{
                                  fontSize: theme.typography.sizes.sm,
                                  color: theme.colors.text.primary,
                                  paddingRight: theme.spacing.sm,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {task.name.length > 15 ? `${task.name.slice(0, 15)}...` : task.name}
                                </div>
                                
                                {/* Date cells */}
                                {heatMapDateRange.map((date) => {
                                  const dateStr = formatLocalDateString(date);
                                  const completion = completions.find(
                                    c => c.custom_task_id === task.id && c.completion_date === dateStr
                                  );
                                  
                                  let isCompleted = false;
                                  let cellColor = '#f3f4f6';
                                  
                                  if (completion) {
                                    if (task.type === 'yes_no') {
                                      isCompleted = completion.value === 'Done';
                                    } else {
                                      isCompleted = Boolean(completion.value) && String(completion.value).trim() !== '';
                                    }
                                    cellColor = isCompleted ? taskColor : '#fecaca';
                                  }
                                  
                                  return (
                                    <div
                                      key={date.toISOString()}
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        background: cellColor,
                                        borderRadius: '2px',
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        opacity: completion ? 1 : 0.3,
                                      }}
                                      title={`${task.name} - ${format(date, 'dd/MM/yyyy')}: ${
                                        completion 
                                          ? (isCompleted ? 'Completed' : 'Incomplete')
                                          : 'No data'
                                      }`}
                                    />
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        
                        {/* Legend */}
                        <div style={{
                          marginTop: theme.spacing.lg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: theme.spacing.lg,
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.text.secondary,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              background: theme.colors.status.success.dark,
                              borderRadius: '2px',
                            }} />
                            <span>Completed</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              background: '#fecaca',
                              borderRadius: '2px',
                            }} />
                            <span>Incomplete</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              background: '#f3f4f6',
                              borderRadius: '2px',
                              opacity: 0.3,
                            }} />
                            <span>No Data</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>,
    document.body
  );
};