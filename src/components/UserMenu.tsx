import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { theme } from '../styles/theme';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { SettingsModal } from './settings/SettingsModal';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    setIsOpen(false);
  };

  const DropdownPortal = () => {
    if (!isOpen || !buttonRect) return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            background: 'transparent',
          }}
          onClick={() => setIsOpen(false)}
        />

        {/* Dropdown Menu */}
        <div
          style={{
            position: 'fixed',
            top: buttonRect.bottom + 8,
            left: buttonRect.right - 240, // Align to right edge of button
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: theme.borderRadius.md,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            minWidth: '240px',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'fadeInScale 0.15s ease-out',
          }}
        >
          {/* User Info */}
          <div style={{
            padding: theme.spacing.lg,
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: theme.colors.primary.gradient,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User className="w-6 h-6" style={{ color: 'white' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: theme.typography.sizes.base,
                  fontWeight: theme.typography.weights.semibold,
                  color: theme.colors.text.primary,
                  margin: '0 0 4px 0',
                  wordBreak: 'break-word',
                }}>
                  {user.username}
                </p>
                <p style={{
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.text.secondary,
                  margin: 0,
                  wordBreak: 'break-word',
                }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: theme.spacing.sm }}>
            {/* Settings */}
            <button
              onClick={openSettings}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: 'none',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text.primary,
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
               onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <Settings className="w-4 h-4" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Settings</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: 'none',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.status.error.dark,
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.status.error.light;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogOut className="w-4 h-4" style={{ flexShrink: 0 }} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Keyframe animation */}
        <style>
          {`
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}
        </style>
      </>,
      document.body
    );
  };

  return (
    <>
      {/* User Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          fontSize: theme.typography.sizes.base,
          fontWeight: theme.typography.weights.semibold,
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.2s ease',
          position: 'relative',
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          background: 'rgba(255, 255, 255, 0.25)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <User className="w-4 h-4" style={{ color: 'white' }} />
        </div>
        <span style={{ 
          color: 'white', 
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.username}
        </span>
        <ChevronDown 
          className="w-4 h-4" 
          style={{ 
            color: 'white',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }} 
        />
      </button>

      {/* Portal-rendered dropdown */}
      <DropdownPortal />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};