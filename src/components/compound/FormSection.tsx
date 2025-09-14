import React from 'react';
import { theme } from '../../styles/theme';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  spacing?: 'compact' | 'normal' | 'spacious';
  divider?: boolean;
}

const spacingMap = {
  compact: theme.spacing.md,
  normal: theme.spacing.lg,
  spacious: theme.spacing.xl,
};

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  spacing = 'normal',
  divider = false,
}) => {
  const sectionSpacing = spacingMap[spacing];
  
  return (
    <div style={{
      marginBottom: sectionSpacing,
      ...(divider && {
        paddingBottom: sectionSpacing,
        borderBottom: `1px solid ${theme.colors.border.light}`,
      }),
    }}>
      {(title || description) && (
        <div style={{ marginBottom: theme.spacing.md }}>
          {title && (
            <h3 style={{
              margin: 0,
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              marginBottom: description ? theme.spacing.xs : 0,
            }}>
              {title}
            </h3>
          )}
          {description && (
            <p style={{
              margin: 0,
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.muted,
            }}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};