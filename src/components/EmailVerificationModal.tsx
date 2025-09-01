import React from 'react';
import { theme } from '../styles/theme';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  email 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{ 
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
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: theme.colors.surface.white,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.border.light}`,
          boxShadow: theme.effects.shadow.lg,
          padding: '32px',
          maxWidth: '480px',
          width: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '24px',
          gap: '12px'
        }}>
          {/* Email icon */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: theme.colors.status.success.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.status.success.dark,
            fontSize: '24px'
          }}>
            ✉️
          </div>
          <div>
            <h3 style={{ 
              margin: 0, 
              color: theme.colors.text.primary, 
              fontSize: '20px',
              fontWeight: 600
            }}>
              Check Your Email!
            </h3>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ 
            color: theme.colors.text.secondary,
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0 0 16px 0'
          }}>
            Please check your mail to verify account and start using SelfPM!
          </p>
          {email && (
            <p style={{ 
              color: theme.colors.text.muted,
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0,
              backgroundColor: theme.colors.surface.glass,
              padding: '12px',
              borderRadius: theme.borderRadius.sm,
              fontFamily: 'monospace'
            }}>
              Verification email sent to: <strong>{email}</strong>
            </p>
          )}
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: theme.colors.primary.dark,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary.medium;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary.dark;
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};