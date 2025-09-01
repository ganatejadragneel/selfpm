import React, { useState, useEffect } from 'react';
import { X, Clock, Filter, Search, ChevronLeft, ChevronRight, 
         Plus, Edit, Trash2, CheckCircle, ArrowRight, 
         Paperclip, MessageSquare, TrendingUp, Calendar,
         AlertCircle, Zap, FileText } from 'lucide-react';
import { theme } from '../styles/theme';
import { useMigratedTaskStore } from '../store/migratedTaskStore';
import type { TaskActivity, ActivityType } from '../types';
import { format, formatDistanceToNow, startOfWeek, endOfWeek, addWeeks, getWeek } from 'date-fns';

interface ActivityTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
}

const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string; label: string }> = {
  created: { icon: Plus, color: theme.colors.status.success.dark, label: 'Created' },
  updated: { icon: Edit, color: theme.colors.status.info.dark, label: 'Updated' },
  status_changed: { icon: CheckCircle, color: theme.colors.status.purple.dark, label: 'Status Changed' },
  priority_changed: { icon: AlertCircle, color: theme.colors.status.warning.dark, label: 'Priority Changed' },
  due_date_changed: { icon: Calendar, color: theme.colors.status.info.dark, label: 'Due Date Changed' },
  description_updated: { icon: FileText, color: theme.colors.text.secondary, label: 'Description Updated' },
  subtask_added: { icon: Plus, color: theme.colors.status.success.light, label: 'Subtask Added' },
  subtask_completed: { icon: CheckCircle, color: theme.colors.status.success.dark, label: 'Subtask Completed' },
  subtask_deleted: { icon: Trash2, color: theme.colors.status.error.light, label: 'Subtask Deleted' },
  attachment_added: { icon: Paperclip, color: theme.colors.status.info.dark, label: 'Attachment Added' },
  attachment_deleted: { icon: Trash2, color: theme.colors.status.error.light, label: 'Attachment Deleted' },
  comment_added: { icon: MessageSquare, color: theme.colors.status.purple.dark, label: 'Comment Added' },
  progress_updated: { icon: TrendingUp, color: theme.colors.status.success.dark, label: 'Progress Updated' },
  moved_category: { icon: ArrowRight, color: theme.colors.status.info.dark, label: 'Moved Category' },
  reordered: { icon: Zap, color: theme.colors.text.secondary, label: 'Reordered' }
};

export const ActivityTrackerModal: React.FC<ActivityTrackerModalProps> = ({ isOpen, onClose, currentWeek }) => {
  const { tasks, fetchActivities } = useMigratedTaskStore();
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<TaskActivity[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityType>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const currentDate = new Date();
  const viewingWeek = currentWeek + weekOffset;
  // Use the same calculation as App.tsx for consistency
  const weekStartDate = addWeeks(currentDate, viewingWeek - getWeek(currentDate));
  const weekStart = startOfWeek(weekStartDate);
  const weekEnd = endOfWeek(weekStart);

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, viewingWeek]);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedTypes, searchQuery]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const fetchedActivities = await fetchActivities(weekStart, weekEnd);
      // Sort by newest first
      const sorted = fetchedActivities.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setActivities(sorted);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by selected activity types
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(activity => selectedTypes.has(activity.activityType));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => {
        const task = tasks.find(t => t.id === activity.taskId);
        const taskTitle = task?.title.toLowerCase() || '';
        const activityLabel = activityConfig[activity.activityType].label.toLowerCase();
        const newValue = activity.newValue?.toLowerCase() || '';
        const oldValue = activity.oldValue?.toLowerCase() || '';
        
        return taskTitle.includes(query) || 
               activityLabel.includes(query) ||
               newValue.includes(query) ||
               oldValue.includes(query);
      });
    }

    setFilteredActivities(filtered);
  };

  const toggleActivityType = (type: ActivityType) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSearchQuery('');
  };

  const formatActivityDescription = (activity: TaskActivity): string => {
    const task = tasks.find(t => t.id === activity.taskId);
    const taskTitle = task?.title || 'Unknown Task';

    switch (activity.activityType as string) {
      case 'created':
        return `Task "${taskTitle}" was created in ${activity.metadata?.category || 'unknown'} board`;
      case 'status_changed':
        return `Status changed from ${activity.oldValue} to ${activity.newValue} for "${taskTitle}"`;
      case 'priority_changed':
        return `Priority changed from ${activity.oldValue} to ${activity.newValue} for "${taskTitle}"`;
      case 'due_date_changed':
        return `Due date changed for "${taskTitle}"`;
      case 'description_updated':
        return `Description updated for "${taskTitle}"`;
      case 'subtask_added':
        return `Subtask "${activity.newValue}" added to "${taskTitle}"`;
      case 'subtask_completed':
        return `Subtask "${activity.newValue}" completed in "${taskTitle}"`;
      case 'subtask_deleted':
        return `Subtask deleted from "${taskTitle}"`;
      case 'attachment_added':
        return `Attachment "${activity.newValue}" added to "${taskTitle}"`;
      case 'attachment_deleted':
        return `Attachment removed from "${taskTitle}"`;
      case 'comment_added':
        return `Comment added to "${taskTitle}"`;
      case 'progress_updated':
        return `Progress updated to ${activity.newValue} for "${taskTitle}"`;
      case 'moved_category':
        return `"${taskTitle}" moved from ${activity.oldValue} to ${activity.newValue}`;
      case 'reordered':
        return `"${taskTitle}" reordered in ${activity.metadata?.category || 'board'}`;
      default:
        return `Activity on "${taskTitle}"`;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px 32px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                marginBottom: '8px'
              }}>
                Activity Tracker
              </h2>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                margin: 0
              }}>
                Track all activities and changes in your tasks
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Week Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              style={{
                padding: '8px',
                border: 'none',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#667eea',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 16px',
              background: 'rgba(102, 126, 234, 0.05)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: theme.colors.text.primary
            }}>
              Week {viewingWeek} ({format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')})
            </div>
            
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              style={{
                padding: '8px',
                border: 'none',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#667eea',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{
          padding: '20px 32px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{
              flex: 1,
              position: 'relative',
              minWidth: 0
            }}>
              <Search className="w-4 h-4" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.text.secondary
              }} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px 10px 40px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                flexShrink: 0,
                padding: '10px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                background: showFilters ? 'rgba(102, 126, 234, 0.1)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.text.primary,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <Filter className="w-4 h-4" />
              Filters {selectedTypes.size > 0 && `(${selectedTypes.size})`}
            </button>
            
            {selectedTypes.size > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  flexShrink: 0,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: theme.colors.status.error.dark,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '16px',
              background: 'rgba(102, 126, 234, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              {(Object.keys(activityConfig) as ActivityType[]).map(type => {
                const config = activityConfig[type];
                if (!config) return null;
                const Icon = config.icon;
                const isSelected = selectedTypes.has(type);
                
                return (
                  <button
                    key={type}
                    onClick={() => toggleActivityType(type)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid' : '1px solid #e5e7eb',
                      borderColor: isSelected ? config.color : '#e5e7eb',
                      background: isSelected ? `${config.color}15` : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: isSelected ? config.color : theme.colors.text.secondary,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = config.color;
                        e.currentTarget.style.background = `${config.color}08`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Activities List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(102, 126, 234, 0.3)',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: theme.colors.text.secondary
            }}>
              <Clock className="w-12 h-12 mx-auto mb-4" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                No activities found
              </p>
              <p style={{ fontSize: '14px' }}>
                {selectedTypes.size > 0 || searchQuery 
                  ? 'Try adjusting your filters or search query'
                  : 'Activities will appear here when you make changes to tasks'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredActivities.map(activity => {
                const config = activityConfig[activity.activityType] || {
                  icon: Edit,
                  color: theme.colors.text.secondary,
                  label: 'Unknown Activity'
                };
                const Icon = config.icon;
                
                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: `${config.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.colors.text.primary,
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        {formatActivityDescription(activity)}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        color: theme.colors.text.secondary
                      }}>
                        <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                        <span>•</span>
                        <span>{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};