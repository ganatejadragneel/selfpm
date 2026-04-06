import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSprint } from '../../hooks/useSprint';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface SprintCompleteButtonProps {
  sprintId: string;
  onComplete?: () => void;
}

/**
 * SprintCompleteButton - Manual sprint completion button
 * For testing purposes - completes current sprint and creates next one
 * Shows confirmation dialog before completing
 */
export const SprintCompleteButton = memo(function SprintCompleteButton({
  sprintId,
  onComplete,
}: SprintCompleteButtonProps) {
  const theme = useThemeColors();
  const { completeSprint } = useSprint();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle initial click - show confirmation
  const handleClick = useCallback(() => {
    setShowConfirm(true);
    setError(null);
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setShowConfirm(false);
    setError(null);
  }, []);

  // Handle confirm - complete the sprint
  const handleConfirm = useCallback(async () => {
    setCompleting(true);
    setError(null);

    try {
      await completeSprint(sprintId);
      setShowConfirm(false);
      onComplete?.();
      navigate('/sprints');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete sprint';
      setError(message);
    } finally {
      setCompleting(false);
    }
  }, [sprintId, completeSprint, onComplete, navigate]);

  // Confirmation dialog
  if (showConfirm) {
    return (
      <div
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
        onClick={handleCancel}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.effects.shadow.xl,
            maxWidth: '400px',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px',
              borderBottom: `1px solid ${theme.colors.border.light}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.status.warning.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={22} color={theme.colors.status.warning.dark} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: theme.colors.text.primary,
                    margin: 0,
                  }}
                >
                  Complete Sprint?
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.text.muted,
                    margin: 0,
                  }}
                >
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px' }}>
            <p
              style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              This will mark the current sprint as <strong>completed</strong> and automatically
              create a new sprint for the next week. You won't be able to edit entries for this
              sprint anymore.
            </p>

            {error && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: theme.colors.status.error.light,
                  borderRadius: theme.borderRadius.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: theme.colors.status.error.dark,
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: theme.colors.background.secondary,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              onClick={handleCancel}
              disabled={completing}
              style={{
                padding: '10px 16px',
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface.white,
                border: `1px solid ${theme.colors.border.light}`,
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={completing}
              style={{
                padding: '10px 16px',
                borderRadius: theme.borderRadius.md,
                backgroundColor: completing
                  ? theme.colors.primary.medium
                  : theme.colors.primary.dark,
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: completing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {completing ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Complete Sprint
                </>
              )}
            </button>
          </div>
        </div>

        {/* CSS for spinner animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Default button
  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.light}`,
        color: theme.colors.text.primary,
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
        e.currentTarget.style.borderColor = theme.colors.border.medium;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
        e.currentTarget.style.borderColor = theme.colors.border.light;
      }}
    >
      <CheckCircle size={16} />
      Complete Sprint
    </button>
  );
});
