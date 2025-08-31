
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, PlusSquare, Eye } from 'lucide-react';
import { ChangePasswordForm } from './ChangePasswordForm';
import { AddCustomTaskForm } from './AddCustomTaskForm';
import { DailyTasksView } from './DailyTasksView';
import { theme, styleUtils } from '../../styles/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveView = 'changePassword' | 'addCustomTask' | 'dailyTasks';

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
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: theme.colors.text.secondary,
        }}>
          <X size={24} />
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
  fontWeight: isActive ? theme.typography.weights.semibold : theme.typography.weights.regular,
  textAlign: 'left',
  transition: 'all 0.2s ease',
});
