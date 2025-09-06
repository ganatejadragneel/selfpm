import React from 'react';
import { theme } from '../../styles/theme';
import { Mic } from 'lucide-react';

export const SpeechToTextSettings: React.FC = () => {
  // Check if Web Speech API is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const browserName = getBrowserName();

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h3 style={{
          fontSize: theme.typography.sizes.xl,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm
        }}>
          <Mic size={24} />
          Speech-to-Text Settings
        </h3>
        <p style={{
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text.secondary,
          lineHeight: '1.6'
        }}>
          Voice input for task titles, descriptions, and notes using your browser's built-in speech recognition.
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        padding: theme.spacing.xl,
        background: isSupported 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
        borderRadius: theme.borderRadius.lg,
        border: `2px solid ${isSupported ? theme.colors.status.success.light : theme.colors.status.error.light}`,
        marginBottom: theme.spacing.xl
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.borderRadius.full,
            background: isSupported ? theme.colors.status.success.light : theme.colors.status.error.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {isSupported ? '✅' : '❌'}
          </div>
          <div>
            <h4 style={{
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              marginBottom: '4px'
            }}>
              Web Speech API
            </h4>
            <p style={{
              fontSize: theme.typography.sizes.sm,
              color: isSupported ? theme.colors.status.success.dark : theme.colors.status.error.dark,
              fontWeight: theme.typography.weights.medium
            }}>
              {isSupported ? 'Available and ready to use' : 'Not supported in your browser'}
            </p>
          </div>
        </div>

        <div style={{
          padding: theme.spacing.md,
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: theme.borderRadius.md,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text.secondary
        }}>
          <strong>Your Browser:</strong> {browserName}
          <br />
          <strong>Status:</strong> {isSupported ? '🟢 Supported' : '🔴 Not Supported'}
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h4 style={{
          fontSize: theme.typography.sizes.base,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md
        }}>
          Features
        </h4>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm
        }}>
          {[
            '🎙️ Real-time transcription as you speak',
            '✏️ Automatic punctuation and capitalization',
            '🌍 Multiple language support',
            '⚡ No setup or downloads required',
            '🔒 Processed securely by your browser'
          ].map((feature, index) => (
            <li key={index} style={{
              padding: theme.spacing.md,
              background: 'rgba(248, 250, 252, 0.5)',
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.typography.sizes.sm,
              color: theme.colors.text.primary,
              borderLeft: `3px solid ${theme.colors.primary.medium}`
            }}>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Browser Compatibility */}
      <div style={{
        padding: theme.spacing.lg,
        background: 'rgba(248, 250, 252, 0.5)',
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.border.light}`
      }}>
        <h4 style={{
          fontSize: theme.typography.sizes.base,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md
        }}>
          Browser Compatibility
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: theme.spacing.sm,
          fontSize: theme.typography.sizes.sm
        }}>
          <div style={{ color: theme.colors.status.success.dark }}>✅ Chrome/Edge (Best)</div>
          <div style={{ color: theme.colors.status.success.dark }}>✅ Safari (Good)</div>
          <div style={{ color: theme.colors.status.error.dark }}>❌ Firefox (Not Supported)</div>
          <div style={{ color: theme.colors.status.warning.dark }}>⚠️ Mobile (Limited)</div>
        </div>
      </div>

      {!isSupported && (
        <div style={{
          marginTop: theme.spacing.xl,
          padding: theme.spacing.lg,
          background: theme.colors.status.warning.light,
          borderRadius: theme.borderRadius.md,
          border: `2px solid ${theme.colors.status.warning.medium}`
        }}>
          <h4 style={{
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.status.warning.dark,
            marginBottom: theme.spacing.sm
          }}>
            💡 To enable voice input:
          </h4>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: theme.colors.text.primary,
            margin: 0
          }}>
            Please use Chrome, Edge, or Safari browser for speech recognition support.
          </p>
        </div>
      )}
    </div>
  );
};

function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Edg") === -1) {
    return "Google Chrome";
  } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
    return "Safari";
  } else if (userAgent.indexOf("Firefox") > -1) {
    return "Mozilla Firefox";
  } else if (userAgent.indexOf("Edg") > -1) {
    return "Microsoft Edge";
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    return "Opera";
  } else {
    return "Unknown Browser";
  }
}