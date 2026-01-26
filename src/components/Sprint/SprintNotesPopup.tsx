import { useEffect, useRef, memo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { X, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SprintNotesPopupProps {
  notes: string;
  metricName: string;
  entryDate: string;
  onClose: () => void;
}

/**
 * SprintNotesPopup - Full-screen modal for viewing notes
 * Dismissible via close button, click outside, or Escape key
 */
export const SprintNotesPopup = memo(function SprintNotesPopup({
  notes,
  metricName,
  entryDate,
  onClose,
}: SprintNotesPopupProps) {
  const theme = useThemeColors();
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format date for display
  const formattedDate = format(parseISO(entryDate), 'EEEE, MMMM d, yyyy');

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        ref={popupRef}
        style={{
          backgroundColor: theme.colors.surface.white,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.effects.shadow.xl,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border.light}`,
            backgroundColor: theme.colors.background.secondary,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color={theme.colors.primary.dark} />
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme.colors.text.primary,
                }}
              >
                {metricName}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme.colors.text.muted,
                }}
              >
                {formattedDate}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: theme.borderRadius.sm,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: theme.colors.text.muted,
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: theme.colors.text.primary,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {notes}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${theme.colors.border.light}`,
            backgroundColor: theme.colors.background.tertiary,
            textAlign: 'right',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: theme.colors.primary.dark,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
