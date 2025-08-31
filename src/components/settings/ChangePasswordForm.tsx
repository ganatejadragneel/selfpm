import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { theme } from '../../styles/theme';

export const ChangePasswordForm: React.FC = () => {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!user) {
      setError('You must be logged in to change your password.');
      return;
    }

    setLoading(true);
    try {
      const { message } = await authService.changePassword(user.id, currentPassword, newPassword);
      setSuccess(message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: theme.spacing.md }}>
          <label htmlFor="currentPassword" style={labelStyle}>Current Password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ marginBottom: theme.spacing.md }}>
          <label htmlFor="newPassword" style={labelStyle}>New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        {error && <p style={{ color: theme.colors.status.error.dark, marginBottom: theme.spacing.md }}>{error}</p>}
        {success && <p style={{ color: theme.colors.status.success.dark, marginBottom: theme.spacing.md }}>{success}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
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
  background: theme.colors.surface.light,
  color: theme.colors.text.primary,
  fontSize: theme.typography.sizes.base,
};

const buttonStyle: React.CSSProperties = {
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  borderRadius: theme.borderRadius.md,
  border: 'none',
  background: theme.colors.primary.base,
  color: 'white',
  cursor: 'pointer',
  fontWeight: theme.typography.weights.semibold,
  transition: 'background 0.2s ease',
};