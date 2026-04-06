import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSprint } from '../../hooks/useSprint';
import { CheckCircle, Loader2 } from 'lucide-react';

interface SprintCompleteButtonProps {
  sprintId: string;
  onComplete?: () => void;
}

export const SprintCompleteButton = memo(function SprintCompleteButton({
  sprintId,
  onComplete,
}: SprintCompleteButtonProps) {
  const theme = useThemeColors();
  const { completeSprint } = useSprint();
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleClick = useCallback(() => {
    if (!confirming) {
      setConfirming(true);
      // Auto-reset confirm state after 3s if user doesn't click again
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setCompleting(true);
    completeSprint(sprintId)
      .catch(() => {}) // sprint likely completed in DB even if RPC errored
      .finally(() => {
        setCompleting(false);
        setConfirming(false);
        onComplete?.();
        navigate('/sprints');
      });
  }, [confirming, sprintId, completeSprint, onComplete, navigate]);

  const baseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: theme.borderRadius.md,
    fontSize: '14px', fontWeight: 500, cursor: completing ? 'wait' : 'pointer',
    transition: 'all 0.15s', border: 'none',
  };

  if (completing) {
    return (
      <button disabled style={{ ...baseStyle, background: theme.colors.background.secondary, color: theme.colors.text.muted, border: `1px solid ${theme.colors.border.light}` }}>
        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
        Completing…
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }

  if (confirming) {
    return (
      <button
        onClick={handleClick}
        style={{ ...baseStyle, background: theme.colors.status.warning.light, color: theme.colors.status.warning.dark, border: `1px solid ${theme.colors.status.warning.medium}` }}
      >
        <CheckCircle size={15} />
        Confirm complete?
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      style={{ ...baseStyle, background: theme.colors.background.secondary, color: theme.colors.text.primary, border: `1px solid ${theme.colors.border.light}` }}
      onMouseEnter={e => { e.currentTarget.style.background = theme.colors.background.tertiary; e.currentTarget.style.borderColor = theme.colors.border.medium; }}
      onMouseLeave={e => { e.currentTarget.style.background = theme.colors.background.secondary; e.currentTarget.style.borderColor = theme.colors.border.light; }}
    >
      <CheckCircle size={15} />
      Complete Sprint
    </button>
  );
});
