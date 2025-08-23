import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, AlertCircle, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '../../styles/theme';
import { useTaskStore } from '../../store/taskStore';
import type { NotificationType } from '../../types';

interface SmartNotificationsDisplayProps {
  isOpen?: boolean;
}

export const SmartNotificationsDisplay: React.FC<SmartNotificationsDisplayProps> = ({ isOpen: externalIsOpen }) => {
  const { notifications, fetchNotifications, markNotificationRead, checkDueDates, checkStaleTasks } = useTaskStore();
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications();
    
    // Check for due dates and stale tasks periodically
    const checkInterval = setInterval(() => {
      checkDueDates();
      checkStaleTasks();
      fetchNotifications();
    }, 60000); // Check every minute

    // Initial check
    checkDueDates();
    checkStaleTasks();

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'due_soon':
        return Clock;
      case 'overdue':
        return AlertCircle;
      case 'stale':
        return AlertCircle;
      case 'dependency_completed':
        return CheckCircle2;
      case 'milestone_reached':
        return TrendingUp;
      case 'weekly_summary':
        return Calendar;
      case 'recurring_created':
        return Calendar;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'due_soon':
        return theme.colors.status.warning.dark;
      case 'overdue':
        return theme.colors.status.error.dark;
      case 'stale':
        return '#f59e0b';
      case 'dependency_completed':
        return theme.colors.status.success.dark;
      case 'milestone_reached':
        return '#8b5cf6';
      case 'weekly_summary':
        return theme.colors.primary.dark;
      case 'recurring_created':
        return '#06b6d4';
      default:
        return theme.colors.text.secondary;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const notification of unreadNotifications) {
      await markNotificationRead(notification.id);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          border: 'none',
          background: isOpen ? 'rgba(102, 126, 234, 0.1)' : theme.colors.surface.glass,
          backdropFilter: theme.effects.blur,
          borderRadius: theme.borderRadius.full,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? `0 0 0 3px rgba(102, 126, 234, 0.2)` : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = theme.colors.surface.glass;
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <Bell 
          className="w-5 h-5" 
          style={{ 
            color: unreadCount > 0 ? theme.colors.primary.dark : theme.colors.text.muted 
          }} 
        />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: theme.borderRadius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: theme.typography.weights.bold,
            color: 'white',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '380px',
          maxHeight: '500px',
          background: 'white',
          borderRadius: theme.borderRadius.xl,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${theme.colors.surface.glassBorder}`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.surface.glassBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(102, 126, 234, 0.02) 100%)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}>
              <Bell className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
              <h3 style={{
                fontSize: theme.typography.sizes.lg,
                fontWeight: theme.typography.weights.semibold,
                color: theme.colors.text.primary,
                margin: 0
              }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <div style={{
                  padding: `2px 8px`,
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: theme.borderRadius.full,
                  fontSize: theme.typography.sizes.xs,
                  fontWeight: theme.typography.weights.medium,
                  color: theme.colors.primary.dark
                }}>
                  {unreadCount} new
                </div>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  background: 'transparent',
                  border: 'none',
                  color: theme.colors.primary.dark,
                  fontSize: theme.typography.sizes.xs,
                  fontWeight: theme.typography.weights.medium,
                  cursor: 'pointer',
                  borderRadius: theme.borderRadius.sm,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '400px'
          }}>
            {notifications.length > 0 ? (
              notifications.map(notification => {
                const Icon = getNotificationIcon(notification.notificationType);
                const color = getNotificationColor(notification.notificationType);
                
                return (
                  <div
                    key={notification.id}
                    style={{
                      padding: theme.spacing.lg,
                      borderBottom: `1px solid ${theme.colors.surface.glassBorder}`,
                      background: notification.isRead ? 'transparent' : 'rgba(102, 126, 234, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: theme.spacing.lg
                    }}
                    onClick={() => handleMarkAsRead(notification.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.isRead ? 'transparent' : 'rgba(102, 126, 234, 0.02)';
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: theme.borderRadius.lg,
                      background: `${color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: theme.typography.sizes.sm,
                        fontWeight: notification.isRead ? theme.typography.weights.normal : theme.typography.weights.semibold,
                        color: theme.colors.text.primary,
                        marginBottom: '4px'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.text.secondary,
                        lineHeight: '1.4',
                        marginBottom: '4px'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: theme.typography.sizes.xs,
                        color: theme.colors.text.muted
                      }}>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Read indicator */}
                    {!notification.isRead && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: theme.borderRadius.full,
                        background: theme.colors.primary.dark,
                        flexShrink: 0,
                        alignSelf: 'center'
                      }} />
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{
                padding: theme.spacing['2xl'],
                textAlign: 'center',
                color: theme.colors.text.muted
              }}>
                <Bell className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.2 }} />
                <p style={{
                  fontSize: theme.typography.sizes.sm,
                  margin: 0
                }}>
                  No notifications yet
                </p>
                <p style={{
                  fontSize: theme.typography.sizes.xs,
                  marginTop: theme.spacing.xs,
                  color: theme.colors.text.muted
                }}>
                  We'll notify you about important updates
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: theme.spacing.lg,
              borderTop: `1px solid ${theme.colors.surface.glassBorder}`,
              background: 'rgba(0, 0, 0, 0.02)',
              textAlign: 'center'
            }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.primary.dark,
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  cursor: 'pointer',
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  borderRadius: theme.borderRadius.lg,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};