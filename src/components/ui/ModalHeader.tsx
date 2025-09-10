/**
 * ModalHeader Component - Reusable modal header with title and close button
 * Following SOLID principles: Single responsibility for modal header
 */

import React from 'react';
import { X } from 'lucide-react';
import { useStyles } from '../../hooks/useStyles';
import { typography, spacing, colors } from '../../styles/designTokens';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
  className,
  children,
}) => {
  const styles = useStyles();

  const headerStyles: React.CSSProperties = {
    padding: `${spacing.xl} ${spacing['2xl']}`,
    borderBottom: `1px solid ${styles.isDark ? colors.dark.surface.glassBorder : colors.neutral.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: styles.isDark ? colors.dark.text.primary : colors.light.text.primary,
    margin: 0,
  };

  const closeButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: spacing.sm,
    borderRadius: spacing.md,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
    color: styles.isDark ? colors.dark.text.secondary : colors.light.text.secondary,
  };

  return (
    <div className={className} style={headerStyles}>
      <h2 style={titleStyles}>{title}</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {children}
        
        {showCloseButton && (
          <button
            onClick={onClose}
            style={closeButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = styles.isDark 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};