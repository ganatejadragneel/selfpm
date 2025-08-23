import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { theme } from '../../styles/theme';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.primary.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>

      {/* Background decoration */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        background: `
          radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 40%)
        `,
      }} />
    </div>
  );
};