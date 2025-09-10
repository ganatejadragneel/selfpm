import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, BarChart3, Upload, Activity } from 'lucide-react';
import { format, addWeeks, getWeek } from 'date-fns';
import { useResponsive } from '../../hooks/useResponsive';
import { useCommonStyles } from '../../styles/commonStyles';
import { Button } from '../common/Button';
import { UserMenu } from '../UserMenu';

interface WeekNavigationHeaderProps {
  currentWeek: number;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onShowQuickAdd: () => void;
  onShowAnalytics: () => void;
  onShowBulkUpload: () => void;
  onShowActivityTracker: () => void;
  onShowDailyTaskAnalytics: () => void;
}

export const WeekNavigationHeader: React.FC<WeekNavigationHeaderProps> = ({
  currentWeek,
  onWeekChange,
  onShowQuickAdd,
  onShowAnalytics,
  onShowBulkUpload,
  onShowActivityTracker,
  onShowDailyTaskAnalytics,
}) => {
  const { isMobile } = useResponsive();
  const styles = useCommonStyles();

  const currentDate = new Date();
  const weekStart = addWeeks(currentDate, currentWeek - getWeek(currentDate));

  return (
    <div style={{
      background: styles.glassCard.background,
      backdropFilter: styles.glassCard.backdropFilter,
      borderBottom: styles.glassCard.border,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px 16px',
        position: 'relative' as const
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap' as const,
          gap: '12px'
        }}>
          {/* Logo and Brand */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '24px',
            minWidth: '0',
            flex: '1 1 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: isMobile ? '32px' : '40px',
                height: isMobile ? '32px' : '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: isMobile ? '14px' : '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}>
                S
              </div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                SelfPM
              </h1>
            </div>

            {/* Week Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '8px',
              flex: isMobile ? '1 1 100%' : '0 0 auto',
              order: isMobile ? 1 : 0,
              justifyContent: isMobile ? 'center' : 'flex-start',
              paddingRight: isMobile ? '20px' : '0'
            }}>
              <button
                onClick={() => onWeekChange('prev')}
                style={{
                  padding: isMobile ? '5px' : '10px',
                  border: 'none',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: '#667eea',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ChevronLeft className={isMobile ? "w-3 h-3" : "w-5 h-5"} />
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '6px 10px' : '12px 20px',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                minWidth: isMobile ? '120px' : '200px',
                justifyContent: 'center'
              }}>
                <Calendar className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#667eea' }} />
                <span style={{
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: isMobile ? '11px' : '14px',
                  textAlign: 'center' as const
                }}>
                  Week {currentWeek} • {format(weekStart, 'MMM d')}
                </span>
              </div>

              <button
                onClick={() => onWeekChange('next')}
                style={{
                  padding: isMobile ? '5px' : '10px',
                  border: 'none',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: '#667eea',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ChevronRight className={isMobile ? "w-3 h-3" : "w-5 h-5"} />
              </button>
            </div>
          </div>

          {/* Action Buttons and User Menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            order: isMobile ? 0 : 1
          }}>
            {!isMobile && (
              <>
                <Button
                  size="sm"
                  onClick={onShowQuickAdd}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onShowAnalytics}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onShowBulkUpload}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Upload className="w-4 h-4" />
                  Bulk
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onShowActivityTracker}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Activity className="w-4 h-4" />
                  Activity
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onShowDailyTaskAnalytics}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Daily Analytics
                </Button>
              </>
            )}

            {isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <button
                  onClick={onShowQuickAdd}
                  style={{
                    padding: '8px',
                    border: 'none',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#667eea',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={onShowAnalytics}
                  style={{
                    padding: '8px',
                    border: 'none',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#667eea',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  );
};