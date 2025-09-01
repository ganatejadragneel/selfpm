import React, { useState } from 'react';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme, styleUtils } from '../../styles/theme';
import { Lock, Eye, EyeOff, CheckCircle, User } from 'lucide-react';

interface PasswordResetFormProps {
  onBackToLogin: () => void;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onBackToLogin }) => {
  const { updatePassword, completePasswordReset, loading, error, clearError } = useSupabaseAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationErrors([]);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setValidationErrors(['Passwords do not match']);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors);
      return;
    }

    try {
      await updatePassword(newPassword);
      setResetSuccess(true);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        completePasswordReset();
      }, 3000);
    } catch (error) {
      // Error is handled by the store
      console.error('Password update failed:', error);
    }
  };

  const handleInputChange = (field: 'new' | 'confirm', value: string) => {
    if (field === 'new') {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }
    
    // Clear errors when user starts typing
    if (error) clearError();
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  if (resetSuccess) {
    return (
      <div style={{
        ...styleUtils.glassCard(),
        width: '100%',
        maxWidth: '400px',
        padding: theme.spacing['3xl'],
        margin: '0 auto',
        boxSizing: 'border-box' as const,
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: theme.colors.status.success.dark,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
        }}>
          <CheckCircle className="w-8 h-8" style={{ color: 'white' }} />
        </div>
        
        <h1 style={{
          fontSize: theme.typography.sizes['2xl'],
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.status.success.dark,
          margin: '0 0 16px 0',
        }}>
          Password Updated!
        </h1>
        
        <p style={{
          fontSize: theme.typography.sizes.base,
          color: theme.colors.text.secondary,
          margin: '0 0 24px 0',
        }}>
          Your password has been successfully updated. You can now continue to your account.
        </p>
        
        <button
          onClick={() => {
            completePasswordReset();
          }}
          style={{
            ...styleUtils.button.primary(),
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
          }}
        >
          Continue to App
        </button>
      </div>
    );
  }

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
          Set New Password
        </h1>
        
        <p style={{
          fontSize: theme.typography.sizes.base,
          color: theme.colors.text.secondary,
          margin: 0,
        }}>
          Enter your new password below
        </p>
      </div>

      {/* Error Messages */}
      {(error || validationErrors.length > 0) && (
        <div style={{
          background: theme.colors.status.error.light,
          color: theme.colors.status.error.dark,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          fontSize: theme.typography.sizes.sm,
        }}>
          {error && <div style={{ marginBottom: validationErrors.length > 0 ? theme.spacing.sm : 0 }}>{error}</div>}
          {validationErrors.map((error, index) => (
            <div key={index} style={{ marginBottom: index < validationErrors.length - 1 ? theme.spacing.xs : 0 }}>
              • {error}
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* New Password Field */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            New Password
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
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => handleInputChange('new', e.target.value)}
              placeholder="Enter new password"
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
              onClick={() => setShowNewPassword(!showNewPassword)}
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
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            Confirm New Password
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
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirm', e.target.value)}
              placeholder="Confirm new password"
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
          style={{
            width: '100%',
            padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
            ...styleUtils.button.primary(),
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
            opacity: (loading || !newPassword || !confirmPassword) ? 0.6 : 1,
            cursor: (loading || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
            marginBottom: theme.spacing.xl,
          }}
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>

        {/* Back to Login */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToLogin}
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
    </div>
  );
};