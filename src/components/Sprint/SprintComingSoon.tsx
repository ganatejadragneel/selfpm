import { useThemeColors } from '../../hooks/useThemeColors';
import { Rocket } from 'lucide-react';

/**
 * SprintComingSoon - Displayed to users who don't have sprint feature enabled
 */
export const SprintComingSoon = () => {
  const theme = useThemeColors();

  return (
    <div
      style={{
        background: theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.md,
        padding: '48px 32px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundImage: theme.colors.primary.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
        }}
      >
        <Rocket size={36} color="white" />
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          backgroundImage: theme.colors.primary.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
        }}
      >
        Sprint Focus Coming Soon
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize: '16px',
          color: theme.colors.text.secondary,
          lineHeight: 1.6,
          marginBottom: '24px',
        }}
      >
        We're building a powerful sprint tracking system to help you focus on what matters most.
        Track your core metrics, build momentum, and achieve your goals.
      </p>

      {/* Feature preview */}
      <div
        style={{
          background: theme.colors.primary.light,
          borderRadius: theme.borderRadius.md,
          padding: '16px',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.colors.primary.dark,
            marginBottom: '8px',
          }}
        >
          Coming features:
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            color: theme.colors.text.secondary,
            fontSize: '14px',
            lineHeight: 1.8,
          }}
        >
          <li>7-day sprint cycles (Monday-Sunday)</li>
          <li>5 core metrics tracking</li>
          <li>Daily progress visualization</li>
          <li>Weekly performance summaries</li>
          <li>Historical sprint data</li>
        </ul>
      </div>

      {/* Footer note */}
      <p
        style={{
          fontSize: '13px',
          color: theme.colors.text.muted,
          marginTop: '24px',
        }}
      >
        Currently in beta testing. Stay tuned!
      </p>
    </div>
  );
};
