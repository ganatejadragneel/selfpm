import React from 'react';
import { 
  Tag, Calendar, FileText, CheckSquare, 
  Paperclip, MessageSquare, TrendingUp, Folder, 
  ArrowRight, Edit3, Plus 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { theme } from '../../styles/theme';
import type { TaskActivity, ActivityType } from '../../types';

// Helper function to parse date string without timezone conversion
const parseLocalDate = (dateString: string): Date => {
  // Split the date string (YYYY-MM-DD) and create date with local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

interface ActivityTimelineProps {
  activities: TaskActivity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'created':
        return Plus;
      case 'status_changed':
        return CheckSquare;
      case 'priority_changed':
        return Tag;
      case 'due_date_changed':
        return Calendar;
      case 'description_updated':
        return FileText;
      case 'subtask_added':
      case 'subtask_completed':
      case 'subtask_deleted':
        return CheckSquare;
      case 'attachment_added':
      case 'attachment_deleted':
        return Paperclip;
      case 'comment_added':
        return MessageSquare;
      case 'progress_updated':
        return TrendingUp;
      case 'moved_category':
        return Folder;
      case 'reordered':
        return ArrowRight;
      case 'updated':
      default:
        return Edit3;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'created':
        return '#10b981';
      case 'status_changed':
        return '#3b82f6';
      case 'priority_changed':
        return '#f59e0b';
      case 'attachment_added':
      case 'attachment_deleted':
        return '#8b5cf6';
      case 'comment_added':
        return '#ec4899';
      case 'progress_updated':
        return '#06b6d4';
      case 'subtask_completed':
        return '#10b981';
      case 'subtask_deleted':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getActivityMessage = (activity: TaskActivity) => {
    const { activityType, oldValue, newValue, metadata } = activity;
    
    switch (activityType) {
      case 'created':
        return `created this task`;
      case 'status_changed':
        return (
          <span>
            changed status from <strong>{oldValue}</strong> to <strong>{newValue}</strong>
          </span>
        );
      case 'priority_changed':
        return (
          <span>
            changed priority from <strong>{oldValue}</strong> to <strong>{newValue}</strong>
          </span>
        );
      case 'due_date_changed':
        return (
          <span>
            changed due date {oldValue && `from ${format(parseLocalDate(oldValue), 'MMM d')}`} to{' '}
            <strong>{newValue && format(parseLocalDate(newValue), 'MMM d, yyyy')}</strong>
          </span>
        );
      case 'description_updated':
        return 'updated the description';
      case 'subtask_added':
        return `added subtask "${newValue}"`;
      case 'subtask_completed':
        return `completed subtask "${newValue}"`;
      case 'subtask_deleted':
        return `deleted subtask "${oldValue}"`;
      case 'attachment_added':
        return `added attachment "${newValue}"`;
      case 'attachment_deleted':
        return `removed attachment "${oldValue}"`;
      case 'comment_added':
        return 'added a comment';
      case 'progress_updated':
        return (
          <span>
            updated progress from <strong>{oldValue}</strong> to <strong>{newValue}</strong>
            {metadata?.progress_total && ` of ${metadata.progress_total}`}
          </span>
        );
      case 'moved_category':
        return (
          <span>
            moved from <strong>{oldValue}</strong> to <strong>{newValue}</strong>
          </span>
        );
      case 'reordered':
        return 'reordered the task';
      case 'updated':
      default:
        return 'updated the task';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: theme.spacing['2xl'],
        color: theme.colors.text.muted,
        fontSize: theme.typography.sizes.sm
      }}>
        No activity yet
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs
    }}>
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity.activityType);
        const color = getActivityColor(activity.activityType);
        const isLast = index === activities.length - 1;

        return (
          <div
            key={activity.id}
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              position: 'relative'
            }}
          >
            {/* Timeline line */}
            {!isLast && (
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '32px',
                bottom: '-8px',
                width: '2px',
                background: 'rgba(0, 0, 0, 0.1)'
              }} />
            )}

            {/* Icon */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.borderRadius.full,
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `2px solid ${color}30`,
              zIndex: 1,
              position: 'relative'
            }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              paddingBottom: theme.spacing.md
            }}>
              <div style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
                lineHeight: '1.5'
              }}>
                <span style={{
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.primary.dark
                }}>
                  {activity.user?.username || 'System'}
                </span>{' '}
                {getActivityMessage(activity)}
              </div>
              
              <div style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text.muted
              }}>
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};