import React, { useState } from 'react';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { isValidEmail, isStrongPassword } from '../../utils/validation';
import { theme, styleUtils } from '../../styles/theme';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import type { RegisterCredentials } from '../../types/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { signUp, loading, error, clearError, checkUsernameExists, checkEmailExists } = useSupabaseAuthStore();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Debounced username checking
  const checkUsername = async (username: string) => {
    if (username.length < 2) {
      setUsernameAvailable(null);
      return;
    }
    
    setUsernameChecking(true);
    try {
      const exists = await checkUsernameExists(username);
      setUsernameAvailable(!exists);
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Debounced email checking
  const checkEmail = async (email: string) => {
    if (!isValidEmail(email)) {
      setEmailAvailable(null);
      return;
    }
    
    setEmailChecking(true);
    try {
      const exists = await checkEmailExists(email);
      setEmailAvailable(!exists);
    } catch (error) {
      console.error('Email check failed:', error);
      setEmailAvailable(null);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Basic validation
    if (!credentials.username.trim() || !credentials.email.trim() || 
        !credentials.password || !credentials.confirmPassword) {
      return;
    }

    if (!isValidEmail(credentials.email)) {
      return;
    }

    const passwordCheck = isStrongPassword(credentials.password);
    if (!passwordCheck.isValid) {
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      return;
    }

    try {
      await signUp(credentials.email, credentials.password, credentials.username);
      setRegistrationSuccess(true);
      
      // Clear form
      setCredentials({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      // Auto switch to login after 3 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
    } catch (error) {
      // Error is handled by the store
      console.error('Registration failed:', error);
    }
  };

  const handleInputChange = (field: keyof RegisterCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
    if (registrationSuccess) setRegistrationSuccess(false);
    
    // Real-time availability checking with debounce
    if (field === 'username') {
      setUsernameAvailable(null);
      // Debounce the username check
      setTimeout(() => checkUsername(value), 500);
    } else if (field === 'email') {
      setEmailAvailable(null);
      // Debounce the email check
      setTimeout(() => checkEmail(value), 500);
    }
  };

  // Validation checks
  const isEmailValid = isValidEmail(credentials.email);
  const passwordStrength = isStrongPassword(credentials.password);
  const passwordsMatch = credentials.password === credentials.confirmPassword;

  if (registrationSuccess) {
    return (
      <div style={{
        ...styleUtils.glassCard(),
        width: '100%',
        maxWidth: '400px',
        padding: theme.spacing['3xl'],
        margin: '0 auto',
        textAlign: 'center',
        boxSizing: 'border-box' as const,
        overflow: 'hidden',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: theme.colors.status.success.gradient,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
        }}>
          <CheckCircle className="w-8 h-8" style={{ color: 'white' }} />
        </div>

        <h2 style={{
          fontSize: theme.typography.sizes['3xl'],
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.status.success.dark,
          margin: '0 0 8px 0',
        }}>
          Registration Successful!
        </h2>

        <p style={{
          fontSize: theme.typography.sizes.base,
          color: theme.colors.text.secondary,
          margin: '0 0 24px 0',
        }}>
          Your account has been created successfully. You can now sign in with your credentials.
        </p>

        <button
          onClick={onSwitchToLogin}
          style={{
            ...styleUtils.button.primary(),
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
          }}
        >
          Continue to Sign In
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
          <UserPlus className="w-8 h-8" style={{ color: 'white' }} />
        </div>
        
        <h1 style={{
          fontSize: theme.typography.sizes['4xl'],
          fontWeight: theme.typography.weights.bold,
          ...styleUtils.gradientText(),
          margin: '0 0 8px 0',
        }}>
          Create Account
        </h1>
        
        <p style={{
          fontSize: theme.typography.sizes.base,
          color: theme.colors.text.secondary,
          margin: 0,
        }}>
          Sign up to get started with SelfPM
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

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Username Field */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <User
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
              value={credentials.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Choose a username"
              required
              style={{
                ...styleUtils.input(),
                paddingLeft: '48px',
                paddingRight: '48px',
                borderColor: usernameAvailable === true ? theme.colors.status.success.dark : 
                           usernameAvailable === false ? theme.colors.status.error.dark :
                           credentials.username.length >= 2 ? theme.colors.border.light : theme.colors.border.light,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary.dark;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = credentials.username.length >= 2 ? theme.colors.status.success.dark : theme.colors.border.light;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Username availability indicator */}
            <div style={{
              position: 'absolute',
              right: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}>
              {usernameChecking && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${theme.colors.primary.light}`,
                  borderTop: `2px solid ${theme.colors.primary.dark}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              )}
              {usernameAvailable === true && (
                <span style={{ color: theme.colors.status.success.dark, fontSize: '16px' }}>✓</span>
              )}
              {usernameAvailable === false && (
                <span style={{ color: theme.colors.status.error.dark, fontSize: '16px' }}>✗</span>
              )}
            </div>
          </div>
          {credentials.username.length > 0 && credentials.username.length < 2 && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.error.dark, margin: '4px 0 0 0' }}>
              Username must be at least 2 characters long
            </p>
          )}
          {usernameAvailable === false && credentials.username.length >= 2 && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.error.dark, margin: '4px 0 0 0' }}>
              Username is already taken
            </p>
          )}
          {usernameAvailable === true && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.success.dark, margin: '4px 0 0 0' }}>
              Username is available
            </p>
          )}
        </div>

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
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                ...styleUtils.input(),
                paddingLeft: '48px',
                paddingRight: '48px',
                borderColor: emailAvailable === true ? theme.colors.status.success.dark : 
                           emailAvailable === false ? theme.colors.status.error.dark :
                           isEmailValid && credentials.email ? theme.colors.status.success.dark : theme.colors.border.light,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary.dark;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isEmailValid && credentials.email ? theme.colors.status.success.dark : theme.colors.border.light;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Email availability indicator */}
            <div style={{
              position: 'absolute',
              right: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}>
              {emailChecking && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${theme.colors.primary.light}`,
                  borderTop: `2px solid ${theme.colors.primary.dark}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              )}
              {emailAvailable === true && (
                <span style={{ color: theme.colors.status.success.dark, fontSize: '16px' }}>✓</span>
              )}
              {emailAvailable === false && (
                <span style={{ color: theme.colors.status.error.dark, fontSize: '16px' }}>✗</span>
              )}
            </div>
          </div>
          {credentials.email && !isEmailValid && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.error.dark, margin: '4px 0 0 0' }}>
              Please enter a valid email address
            </p>
          )}
          {emailAvailable === false && isEmailValid && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.error.dark, margin: '4px 0 0 0' }}>
              Email is already registered
            </p>
          )}
          {emailAvailable === true && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.success.dark, margin: '4px 0 0 0' }}>
              Email is available
            </p>
          )}
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: theme.spacing.xl }}>
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
              placeholder="Create a strong password"
              required
              style={{
                ...styleUtils.input(),
                paddingLeft: '48px',
                paddingRight: '48px',
                borderColor: passwordStrength.isValid && credentials.password ? theme.colors.status.success.dark : theme.colors.border.light,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary.dark;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = passwordStrength.isValid && credentials.password ? theme.colors.status.success.dark : theme.colors.border.light;
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
          {credentials.password && !passwordStrength.isValid && (
            <div style={{ marginTop: '4px' }}>
              {passwordStrength.errors.map((error, index) => (
                <p key={index} style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.error.dark, margin: '2px 0' }}>
                  • {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div style={{ marginBottom: theme.spacing['2xl'] }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.sizes.sm,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}>
            Confirm Password
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
              value={credentials.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Re-enter your password"
              required
              style={{
                ...styleUtils.input(),
                paddingLeft: '48px',
                paddingRight: '48px',
                borderColor: passwordsMatch && credentials.confirmPassword ? theme.colors.status.success.dark : theme.colors.border.light,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary.dark;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.light}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = passwordsMatch && credentials.confirmPassword ? theme.colors.status.success.dark : theme.colors.border.light;
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
          {credentials.confirmPassword && !passwordsMatch && (
            <p style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.status.error.dark, margin: '4px 0 0 0' }}>
              Passwords do not match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !credentials.username.trim() || !isEmailValid || !passwordStrength.isValid || !passwordsMatch || usernameAvailable === false || emailAvailable === false || usernameChecking || emailChecking}
          style={{
            width: '100%',
            padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
            ...styleUtils.button.primary(),
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
            opacity: (loading || !credentials.username.trim() || !isEmailValid || !passwordStrength.isValid || !passwordsMatch || usernameAvailable === false || emailAvailable === false || usernameChecking || emailChecking) ? 0.6 : 1,
            cursor: (loading || !credentials.username.trim() || !isEmailValid || !passwordStrength.isValid || !passwordsMatch || usernameAvailable === false || emailAvailable === false || usernameChecking || emailChecking) ? 'not-allowed' : 'pointer',
            marginBottom: theme.spacing.xl,
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Switch to Login */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.secondary,
            margin: 0,
          }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
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
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};