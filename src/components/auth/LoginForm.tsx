import React, { useState } from 'react';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme, styleUtils } from '../../styles/theme';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import type { LoginCredentials } from '../../types/auth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { signIn, resetPassword, loading, error, clearError } = useSupabaseAuthStore();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!credentials.email.trim() || !credentials.password) {
      return;
    }

    try {
      await signIn(credentials.email, credentials.password);
      // Login successful, user will be redirected by the auth guard
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      return;
    }

    setResetLoading(true);
    
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (error) {
      // Error is handled by the store
      console.error('Password reset failed:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSuccess(false);
    clearError();
  };

  return (
    <div style={{
      ...styleUtils.glassCard(),
      width: '100%',
      maxWidth: '400px',
      padding: theme.spacing['3xl'],
      margin: '0 auto',
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: theme.spacing['3xl'] }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: theme.colors.primary.gradient,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: theme.effects.shadow.md,
        }}>
          <User className="w-8 h-8" style={{ color: 'white' }} />
        </div>
        
        <h1 style={{
          fontSize: theme.typography.sizes['4xl'],
          fontWeight: theme.typography.weights.bold,
          ...styleUtils.gradientText(),
          margin: '0 0 8px 0',
        }}>
          {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
        </h1>
        
        <p style={{
          fontSize: theme.typography.sizes.base,
          color: theme.colors.text.secondary,
          margin: 0,
        }}>
          {showForgotPassword 
            ? 'Enter your email address to receive a password reset link' 
            : 'Sign in to continue to SelfPM'
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: theme.colors.status.error.light,
          color: theme.colors.status.error.dark,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          fontSize: theme.typography.sizes.sm,
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Success Message for Password Reset */}
      {resetSuccess && (
        <div style={{
          background: theme.colors.status.success.light,
          color: theme.colors.status.success.dark,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          fontSize: theme.typography.sizes.sm,
          textAlign: 'center',
        }}>
          Password reset email sent! Check your inbox and follow the instructions to reset your password.
        </div>
      )}

      {/* Conditional Form */}
      {!showForgotPassword ? (
        // LOGIN FORM
        <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            Email or Username
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              className="w-5 h-5"
              style={{
                position: 'absolute',
                left: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.text.muted,
                zIndex: 1,
              }}
            />
            <input
              type="text"
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email or username"
              required
              style={{
                ...styleUtils.input(),
                paddingLeft: '48px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary.dark;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.light;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: theme.spacing['2xl'] }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              className="w-5 h-5"
              style={{
                position: 'absolute',
                left: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.text.muted,
                zIndex: 1,
              }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                ...styleUtils.input(),
                paddingLeft: '48px',
                paddingRight: '48px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary.dark;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.light;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.text.muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !credentials.email.trim() || !credentials.password}
          style={{
            width: '100%',
            padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
            ...styleUtils.button.primary(),
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
            opacity: (loading || !credentials.email.trim() || !credentials.password) ? 0.6 : 1,
            cursor: (loading || !credentials.email.trim() || !credentials.password) ? 'not-allowed' : 'pointer',
            marginBottom: theme.spacing.xl,
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Forgot Password Link */}
        <div style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.primary.dark,
              cursor: 'pointer',
              fontWeight: theme.typography.weights.medium,
              textDecoration: 'underline',
              fontSize: theme.typography.sizes.sm,
            }}
          >
            Forgot your password?
          </button>
        </div>

        {/* Switch to Register */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.secondary,
            margin: 0,
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.primary.dark,
                cursor: 'pointer',
                fontWeight: theme.typography.weights.semibold,
                textDecoration: 'underline',
                fontSize: theme.typography.sizes.sm,
              }}
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>
      ) : (
        // FORGOT PASSWORD FORM
        <form onSubmit={handleForgotPassword}>
          {/* Email Field */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                className="w-5 h-5"
                style={{
                  position: 'absolute',
                  left: theme.spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.colors.text.muted,
                  zIndex: 1,
                }}
              />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                style={{
                  ...styleUtils.input(),
                  paddingLeft: '48px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary.dark;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.light;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <p style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.text.muted,
              margin: `${theme.spacing.xs} 0 0 0`,
              fontStyle: 'italic',
            }}>
              Note: Password reset requires your email address, not username
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={resetLoading || !resetEmail.trim()}
            style={{
              width: '100%',
              padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
              ...styleUtils.button.primary(),
              fontSize: theme.typography.sizes.base,
              fontWeight: theme.typography.weights.semibold,
              opacity: (resetLoading || !resetEmail.trim()) ? 0.6 : 1,
              cursor: (resetLoading || !resetEmail.trim()) ? 'not-allowed' : 'pointer',
              marginBottom: theme.spacing.xl,
            }}
          >
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to Login */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.primary.dark,
                cursor: 'pointer',
                fontWeight: theme.typography.weights.medium,
                textDecoration: 'underline',
                fontSize: theme.typography.sizes.sm,
              }}
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};