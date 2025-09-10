import React, { useEffect } from 'react';
import { useCommonStyles } from '../../styles/commonStyles';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  const styles = useCommonStyles();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { width: '400px' };
      case 'lg':
        return { width: '800px' };
      case 'xl':
        return { width: '1200px' };
      default:
        return { width: '600px' };
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleOverlayClick}>
      <div
        style={{
          ...styles.modalContent,
          ...getSizeStyle(),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={styles.modalHeader}>
            <h2 style={{ margin: 0, ...styles.textPrimary }}>{title}</h2>
            <button
              style={styles.closeButton}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={styles.modalBody}>{children}</div>
        {footer && <div style={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  const styles = useCommonStyles();

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <p style={styles.textPrimary}>{message}</p>
    </Modal>
  );
};