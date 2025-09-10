/**
 * BaseModal Component - Reusable modal container following DRY principle
 * Eliminates duplication across all modal components
 */

import React from 'react';
import { ModalOverlay } from './ModalOverlay';
import { ModalHeader } from './ModalHeader';
import { useStyles } from '../../hooks/useStyles';
import { spacing } from '../../styles/designTokens';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  headerActions,
  className,
  contentClassName,
}) => {
  const styles = useStyles();

  // Size configuration
  const sizeMap = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1200px',
    full: '95vw',
  };

  const modalContainerStyles: React.CSSProperties = {
    ...styles.getModalContainerStyles(),
    width: '100%',
    maxWidth: sizeMap[size],
  };

  const contentStyles: React.CSSProperties = {
    padding: spacing['2xl'],
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyles: React.CSSProperties = {
    padding: `${spacing.lg} ${spacing['2xl']}`,
    borderTop: `1px solid ${styles.isDark ? styles.colors.surface.glassBorder : styles.colors.background.secondary}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.md,
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      <div className={className} style={modalContainerStyles}>
        <ModalHeader
          title={title}
          onClose={onClose}
          showCloseButton={showCloseButton}
        >
          {headerActions}
        </ModalHeader>

        <div className={contentClassName} style={contentStyles}>
          {children}
        </div>

        {footer && (
          <div style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

/**
 * Modal Footer helper component for consistent footer styling
 */
export const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      gap: spacing.md,
      justifyContent: 'flex-end',
    }}>
      {children}
    </div>
  );
};

/**
 * Modal Body helper component for consistent body styling
 */
export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={className} style={{ width: '100%' }}>
      {children}
    </div>
  );
};