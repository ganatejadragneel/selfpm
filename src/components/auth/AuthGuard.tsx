import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { AuthPage } from './AuthPage';
import { theme } from '../../styles/theme';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.colors.primary.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto',
          }}></div>
          <p style={{
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.semibold,
            margin: 0,
          }}>
            Loading SelfPM...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show protected content if authenticated
  return <>{children}</>;
};