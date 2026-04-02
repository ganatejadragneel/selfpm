import React from 'react';
import { createPortal } from 'react-dom';
import { Shield, Lock, Eye, Trash2, Server, ArrowRight } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import { useResponsive } from '../hooks/useResponsive';

interface PrivacyPledgeModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

const PRIVACY_PLEDGE_ACCEPTED_KEY = 'selfpm_privacy_pledge_accepted';

export const hasAcceptedPrivacyPledge = (): boolean => {
  return localStorage.getItem(PRIVACY_PLEDGE_ACCEPTED_KEY) === 'true';
};

export const markPrivacyPledgeAccepted = (): void => {
  localStorage.setItem(PRIVACY_PLEDGE_ACCEPTED_KEY, 'true');
};

const commitments = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'We will never sell your data',
    aside: '(who is paying to know about you???)',
    description: 'To anyone, for any reason, ever.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'No third-party tracking',
    aside: '(nobody cares)',
    description: 'Zero analytics scripts. No Google Analytics. No Facebook pixels. Nothing watches you here.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'We will never read your personal notes',
    aside: '(mostly, unless we\'re reaaaaly bored, and you\'re going through...stuff)',
    description: 'Unless you explicitly ask us to (e.g., for debugging a specific issue you report, with your permission).',
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Your data never trains AI models',
    aside: '(I honestly don\'t know how to do this...yet)',
    description: 'When CPO reports are generated, your data is sent for that single analysis and is not retained by the AI provider.',
  },
  {
    icon: <Trash2 className="w-5 h-5" />,
    title: 'Your data, your choice',
    description: 'Export all your data and delete your account at any time. Your data will be fully removed.',
  },
];

export const PrivacyPledgeModal: React.FC<PrivacyPledgeModalProps> = ({ isOpen, onAccept }) => {
  const theme = useThemeColors();
  const { isMobile } = useResponsive();

  if (!isOpen) return null;

  const handleAccept = () => {
    markPrivacyPledgeAccepted();
    onAccept();
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative',
        background: theme.currentTheme === 'dark' ? theme.colors.background.primary : 'white',
        borderRadius: '24px',
        padding: isMobile ? '24px' : '40px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        border: `1px solid ${theme.colors.surface.glassBorder}`,
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          }}>
            <Shield className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '22px' : '28px',
          fontWeight: '700',
          textAlign: 'center',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 4px 0',
        }}>
          Privacy Pledge
        </h2>

        <p style={{
          textAlign: 'center',
          color: theme.colors.text.secondary,
          fontSize: '14px',
          margin: '0 0 28px 0',
        }}>
          Our commitment to protecting your most personal data
        </p>

        {/* Full Pledge Intro */}
        <div style={{
          fontSize: '15px',
          lineHeight: '1.7',
          color: theme.colors.text.primary,
          marginBottom: '28px',
        }}>
          <p style={{
            margin: '0 0 14px 0',
            fontSize: '18px',
            fontWeight: '600',
            fontStyle: 'italic',
            color: '#667eea',
          }}>
            Dear Seeker,
          </p>
          <p style={{ margin: '0 0 14px 0' }}>
            Kaushik here — thank you for being on SelfPM, and experimenting your way into personal success.
            I want to address something important to me and my co-creator Gana, before you continue.
          </p>
          <p style={{ margin: '0 0 14px 0' }}>
            SelfPM only works if you're honest with it. Radically, uncomfortably honest.
          </p>
          <p style={{ margin: '0 0 14px 0' }}>
            We know that. The whole point of this app is to help you understand yourself — your real patterns,
            your real inhibitors, the real reasons you do or don't do things. The CPO can only surface genuine
            insights if you give it genuine data. Sugarcoating defeats the purpose.
          </p>
          <p style={{
            margin: 0,
            fontWeight: '600',
            color: '#667eea',
          }}>
            That means your data is sacred to us. Not in a legal-boilerplate way. In a "we built this app
            because we believe in what you're doing" way.
          </p>
        </div>

        {/* Commitments */}
        <h3 style={{
          fontSize: '17px',
          fontWeight: '700',
          color: theme.colors.text.primary,
          margin: '0 0 16px 0',
        }}>
          What we commit to:
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {commitments.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '14px',
                background: theme.colors.primary.light,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.primary.medium}`,
              }}
            >
              <div style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}>
                {item.icon}
              </div>
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  margin: '0 0 2px 0',
                }}>
                  {item.title}
                  {item.aside && (
                    <span style={{
                      fontWeight: '400',
                      fontStyle: 'italic',
                      color: theme.colors.text.muted,
                      marginLeft: '6px',
                      fontSize: '12px',
                    }}>
                      {item.aside}
                    </span>
                  )}
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  margin: 0,
                  lineHeight: '1.5',
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Transparency Section */}
        <h3 style={{
          fontSize: '17px',
          fontWeight: '700',
          color: theme.colors.text.primary,
          margin: '0 0 12px 0',
        }}>
          What's true today that we're working to improve:
        </h3>

        <div style={{
          fontSize: '14px',
          lineHeight: '1.7',
          color: theme.colors.text.primary,
          marginBottom: '28px',
        }}>
          <p style={{ margin: '0 0 14px 0' }}>
            Your data is stored in a secure, encrypted database (Supabase, which is SOC 2 Type II certified).
            Data is encrypted at rest and in transit. However, as the app's developers, we technically have
            database access. We don't look — but "trust us" isn't good enough for what this app asks of you.
          </p>
          <p style={{
            margin: 0,
            padding: '14px',
            background: theme.colors.primary.light,
            borderRadius: '12px',
            borderLeft: '4px solid #667eea',
          }}>
            We are actively building <strong>client-side encryption</strong> so that your personal notes and
            reflections will be encrypted on your device before they ever reach our servers. When that's complete,
            we won't just be promising not to read your data — we'll be architecturally <em>unable</em> to.
          </p>
        </div>

        {/* Why This Matters */}
        <h3 style={{
          fontSize: '17px',
          fontWeight: '700',
          color: theme.colors.text.primary,
          margin: '0 0 12px 0',
        }}>
          Why this matters to us:
        </h3>

        <p style={{
          fontSize: '14px',
          lineHeight: '1.7',
          color: theme.colors.text.primary,
          margin: '0 0 24px 0',
        }}>
          We built SelfPM because we use it ourselves. Kaushik has 150+ days of his own data in this app —
          the same vulnerable, honest data we're asking you to create. We have the same stake in this
          privacy as you do.
        </p>

        {/* Signature */}
        <div style={{
          textAlign: 'center',
          padding: '16px 0 24px 0',
          borderTop: `1px solid ${theme.colors.primary.medium}`,
        }}>
          <p style={{
            margin: '0 0 6px 0',
            color: theme.colors.text.secondary,
            fontSize: '14px',
            fontStyle: 'italic',
          }}>
            With respect for your journey,
          </p>
          <p style={{
            margin: 0,
            fontWeight: '700',
            fontSize: '17px',
            color: '#667eea',
          }}>
            — Kaushik & Gana
          </p>
        </div>

        {/* Privacy Pledge Tab Callout */}
        <div style={{
          padding: '12px 16px',
          background: theme.currentTheme === 'dark'
            ? 'rgba(102, 126, 234, 0.15)'
            : 'rgba(102, 126, 234, 0.08)',
          borderRadius: '12px',
          border: `1px solid ${theme.colors.primary.medium}`,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Shield className="w-5 h-5" style={{ color: '#667eea', flexShrink: 0 }} />
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: theme.colors.text.secondary,
            lineHeight: '1.5',
          }}>
            You can read this pledge anytime via the <strong style={{ color: '#667eea' }}>Privacy Pledge</strong> button
            in the header. We'll post updates there as we strengthen your privacy protections.
          </p>
        </div>

        {/* Accept Button */}
        <button
          onClick={handleAccept}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
        >
          I've Read the Privacy Pledge
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body
  );
};
