import React from 'react';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

interface ActionButtonGroupProps {
  buttons: ActionButton[];
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right' | 'stretch';
  spacing?: 'compact' | 'normal' | 'spacious';
}

const spacingMap = {
  compact: theme.spacing.xs,
  normal: theme.spacing.md,
  spacious: theme.spacing.lg,
};

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  buttons,
  layout = 'horizontal',
  align = 'right',
  spacing = 'normal',
}) => {
  const gap = spacingMap[spacing];
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap,
    ...(layout === 'vertical' && { flexDirection: 'column' }),
    ...(layout === 'horizontal' && align === 'left' && { justifyContent: 'flex-start' }),
    ...(layout === 'horizontal' && align === 'center' && { justifyContent: 'center' }),
    ...(layout === 'horizontal' && align === 'right' && { justifyContent: 'flex-end' }),
    ...(align === 'stretch' && { 
      '& > *': { flex: 1 } 
    }),
  };

  return (
    <div style={containerStyle}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant || 'secondary'}
          onClick={button.onClick}
          disabled={button.disabled}
          loading={button.loading}
          icon={button.icon}
          style={align === 'stretch' ? { flex: 1 } : undefined}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
};