import React, { useState } from 'react';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { theme } from '../../styles/theme';
import { formStyles, getInputStyle, getButtonState, formIcons } from '../../styles/formStyles';
import { isStrongPassword } from '../../utils/validation';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const ChangePasswordForm: React.FC = () => {
  const { user, updatePassword } = useSupabaseAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Use existing validation utility (DRY principle)
  const validatePassword = (password: string) => {
    const validation = isStrongPassword(password);
    return validation.errors;
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
        <div style={formStyles.fieldContainer}>
          <label htmlFor="newPassword" style={formStyles.label}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{...getInputStyle(!!newPassword), paddingRight: '40px'}}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={formStyles.eyeButton}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p style={formStyles.passwordHint}>
            Password must contain at least 6 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password */}
        <div style={formStyles.fieldContainer}>
          <label htmlFor="confirmPassword" style={formStyles.label}>Confirm New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{...getInputStyle(!!confirmPassword), paddingRight: '40px'}}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={formStyles.eyeButton}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div style={formStyles.errorMessage}>
            <div style={formIcons.errorIcon}>!</div>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={formStyles.successMessage}>
            <CheckCircle2 size={20} color={theme.colors.status.success.dark} />
            <span>{success}</span>
          </div>
        )}
        <button 
          type="submit" 
          style={{
            ...formStyles.primaryButton,
            ...getButtonState(loading, !newPassword || !confirmPassword),
          }} 
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

// All styles now imported from shared formStyles utility (DRY principle)