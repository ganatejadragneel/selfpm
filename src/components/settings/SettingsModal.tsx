
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, PlusSquare, Eye, Mic } from 'lucide-react';
import { ChangePasswordForm } from './ChangePasswordForm';
import { AddCustomTaskForm } from './AddCustomTaskForm';
import { DailyTasksView } from './DailyTasksView';
import { SpeechToTextSettings } from './SpeechToTextSettings';
import { theme, styleUtils } from '../../styles/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveView = 'changePassword' | 'addCustomTask' | 'dailyTasks' | 'speechToText';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dailyTasks');

  if (!isOpen) return null;

  const renderActiveView = () => {
    switch (activeView) {
      case 'changePassword':
        return <ChangePasswordForm />;
      case 'addCustomTask':
        return <AddCustomTaskForm />;
      case 'dailyTasks':
        return <DailyTasksView />;
      case 'speechToText':
        return <SpeechToTextSettings />;
      default:
        return <DailyTasksView />;
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        ...styleUtils.glassCard(),
        width: '80vw',
        height: '80vh',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: theme.colors.surface.white,
          border: `2px solid ${theme.colors.border.light}`,
          borderRadius: theme.borderRadius.full,
          cursor: 'pointer',
          color: theme.colors.text.secondary,
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.status.error.light;
          e.currentTarget.style.color = theme.colors.status.error.dark;
          e.currentTarget.style.borderColor = theme.colors.status.error.medium;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.colors.surface.white;
          e.currentTarget.style.color = theme.colors.text.secondary;
          e.currentTarget.style.borderColor = theme.colors.border.light;
        }}>
          <X size={20} />
        </button>

        {/* Sidebar */}
        <div style={{
          width: '240px',
          background: 'rgba(255, 255, 255, 0.5)',
          padding: theme.spacing.lg,
          borderRight: `1px solid ${theme.colors.surface.glassBorder}`,
        }}>
          <h2 style={{
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xl,
          }}>Settings</h2>
          <nav>
            <ul>
              <li style={{ marginBottom: theme.spacing.md }}>
                <button onClick={() => setActiveView('dailyTasks')} style={getLinkStyle(activeView === 'dailyTasks')}>
                  <Eye size={18} />
                  <span>Daily Tasks</span>
                </button>
              </li>
              <li style={{ marginBottom: theme.spacing.md }}>
                <button onClick={() => setActiveView('addCustomTask')} style={getLinkStyle(activeView === 'addCustomTask')}>
                  <PlusSquare size={18} />
                  <span>Add Custom Task</span>
                </button>
              </li>
              <li style={{ marginBottom: theme.spacing.md }}>
                <button onClick={() => setActiveView('speechToText')} style={getLinkStyle(activeView === 'speechToText')}>
                  <Mic size={18} />
                  <span>Speech to Text</span>
                </button>
              </li>
              <li style={{ marginBottom: theme.spacing.md }}>
                <button onClick={() => setActiveView('changePassword')} style={getLinkStyle(activeView === 'changePassword')}>
                  <Lock size={18} />
                  <span>Change Password</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: theme.spacing.xl,
          overflowY: 'auto',
        }}>
          {renderActiveView()}
        </div>
      </div>
    </div>,
    document.body
  );
};

const getLinkStyle = (isActive: boolean): React.CSSProperties => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.md,
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  background: isActive ? theme.colors.primary.light : 'none',
  border: 'none',
  borderRadius: theme.borderRadius.md,
  cursor: 'pointer',
  fontSize: theme.typography.sizes.base,
  color: isActive ? theme.colors.primary.dark : theme.colors.text.secondary,
  fontWeight: isActive ? theme.typography.weights.semibold : theme.typography.weights.normal,
  textAlign: 'left',
  transition: 'all 0.2s ease',
});

