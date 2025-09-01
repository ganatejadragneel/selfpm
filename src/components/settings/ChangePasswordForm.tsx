import React, { useState } from 'react';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme } from '../../styles/theme';
import { Eye, EyeOff } from 'lucide-react';

export const ChangePasswordForm: React.FC = () => {
  const { user, updatePassword } = useSupabaseAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength validation
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
    setError(null);
    setSuccess(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!user) {
      setError('You must be logged in to change your password.');
      return;
    }

    // Validate new password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '));
      return;
    }

    setLoading(true);
    
    try {
      // With Supabase Auth, we can't verify the current password directly
      // We'll proceed with the update and let Supabase handle the verification
      // If the user doesn't have proper session, Supabase will return an error
      
      await updatePassword(newPassword);
      
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      
      // Handle specific Supabase Auth errors
      if (errorMessage.includes('New password should be different from the old password')) {
        setError('New password must be different from your current password');
      } else if (errorMessage.includes('invalid_credentials') || errorMessage.includes('Invalid login')) {
        setError('Please log out and log back in before changing your password');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
      }}>Change Password</h3>
      <div style={{
        background: theme.colors.primary.light,
        color: theme.colors.primary.dark,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        fontSize: theme.typography.sizes.sm,
      }}>
        <strong>Note:</strong> You're currently signed in. Enter your new password below to update it securely.
      </div>

      <form onSubmit={handleSubmit}>

        {/* New Password */}
        <div style={{ marginBottom: theme.spacing.md }}>
          <label htmlFor="newPassword" style={labelStyle}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{...inputStyle, paddingRight: '40px'}}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={eyeButtonStyle}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p style={passwordHintStyle}>
            Password must contain at least 6 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{...inputStyle, paddingRight: '40px'}}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={eyeButtonStyle}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}
        {success && (
          <div style={successStyle}>
            {success}
          </div>
        )}
        <button 
          type="submit" 
          style={{
            ...buttonStyle,
            opacity: (loading || !newPassword || !confirmPassword) ? 0.6 : 1,
            cursor: (loading || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
          }} 
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.sm,
  color: theme.colors.text.secondary,
  fontWeight: theme.typography.weights.medium,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  border: `1px solid ${theme.colors.surface.glassBorder}`,
  background: theme.colors.surface.white,
  color: theme.colors.text.primary,
  fontSize: theme.typography.sizes.base,
};

const buttonStyle: React.CSSProperties = {
  padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
  borderRadius: theme.borderRadius.lg,
  border: `2px solid ${theme.colors.primary.light}`,
  background: theme.colors.primary.dark,
  color: 'white',
  cursor: 'pointer',
  fontWeight: theme.typography.weights.bold,
  fontSize: theme.typography.sizes.lg,
  transition: 'all 0.3s ease',
  boxShadow: theme.effects.shadow.md,
};

const eyeButtonStyle: React.CSSProperties = {
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
};

const passwordHintStyle: React.CSSProperties = {
  fontSize: theme.typography.sizes.xs,
  color: theme.colors.text.muted,
  margin: `${theme.spacing.xs} 0 0 0`,
  fontStyle: 'italic',
};

const errorStyle: React.CSSProperties = {
  background: theme.colors.status.error.light,
  color: theme.colors.status.error.dark,
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  marginBottom: theme.spacing.md,
  fontSize: theme.typography.sizes.sm,
  border: `1px solid ${theme.colors.status.error.dark}`,
};

const successStyle: React.CSSProperties = {
  background: theme.colors.status.success.light,
  color: theme.colors.status.success.dark,
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  marginBottom: theme.spacing.md,
  fontSize: theme.typography.sizes.sm,
  border: `1px solid ${theme.colors.status.success.dark}`,
};