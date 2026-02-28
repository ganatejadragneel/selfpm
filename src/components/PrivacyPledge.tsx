import React from 'react';
import { Shield, Lock, Eye, Trash2, Server, ArrowLeft } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import { useResponsive } from '../hooks/useResponsive';

interface PrivacyPledgeProps {
  onClose: () => void;
}

export const PrivacyPledge: React.FC<PrivacyPledgeProps> = ({ onClose }) => {
  const theme = useThemeColors();
  const { isMobile } = useResponsive();

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

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '32px',
    }}>
      {/* Back Button */}
      <button
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.9)',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '24px',
          borderRadius: '8px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div style={{
        background: theme.colors.surface.glass,
        borderRadius: '20px',
        padding: isMobile ? '24px' : '40px',
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.lg,
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          }}>
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '700',
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              Privacy Pledge
            </h1>
            <p style={{ color: theme.colors.text.secondary, margin: '4px 0 0 0', fontSize: '14px' }}>
              Our commitment to protecting your most personal data
            </p>
          </div>
        </div>

        <div style={{
          fontSize: isMobile ? '15px' : '17px',
          lineHeight: '1.7',
          color: theme.colors.text.primary,
        }}>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            fontStyle: 'italic',
            color: '#667eea',
          }}>
            Dear Seeker,
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            Kaushik here — thank you for being on SelfPM, and experimenting your way into personal success.
            I want to address something important to me and my co-creator Gana, before you continue.
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            SelfPM only works if you're honest with it. Radically, uncomfortably honest.
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            We know that. The whole point of this app is to help you understand yourself — your real patterns,
            your real inhibitors, the real reasons you do or don't do things. The CPO can only surface genuine
            insights if you give it genuine data. Sugarcoating defeats the purpose.
          </p>
          <p style={{
            margin: 0,
            fontWeight: '600',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            That means your data is sacred to us. Not in a legal-boilerplate way. In a "we built this app
            because we believe in what you're doing" way.
          </p>
        </div>
      </div>

      {/* Commitments */}
      <div style={{
        background: theme.colors.surface.glass,
        borderRadius: '20px',
        padding: isMobile ? '24px' : '40px',
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.lg,
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: theme.colors.text.primary,
          margin: '0 0 24px 0',
        }}>
          What we commit to:
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {commitments.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: theme.colors.primary.light,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.primary.medium}`,
              }}
            >
              <div style={{
                flexShrink: 0,
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  margin: '0 0 4px 0',
                }}>
                  {item.title}
                  {item.aside && (
                    <span style={{
                      fontWeight: '400',
                      fontStyle: 'italic',
                      color: theme.colors.text.muted,
                      marginLeft: '6px',
                      fontSize: '13px',
                    }}>
                      {item.aside}
                    </span>
                  )}
                </h3>
                <p style={{
                  fontSize: '14px',
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
      </div>

      {/* Transparency Section */}
      <div style={{
        background: theme.colors.surface.glass,
        borderRadius: '20px',
        padding: isMobile ? '24px' : '40px',
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.lg,
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: theme.colors.text.primary,
          margin: '0 0 16px 0',
        }}>
          What's true today that we're working to improve:
        </h2>

        <div style={{
          fontSize: '15px',
          lineHeight: '1.7',
          color: theme.colors.text.primary,
        }}>
          <p style={{ margin: '0 0 16px 0' }}>
            Your data is stored in a secure, encrypted database (Supabase, which is SOC 2 Type II certified).
            Data is encrypted at rest and in transit. However, as the app's developers, we technically have
            database access. We don't look — but "trust us" isn't good enough for what this app asks of you.
          </p>
          <p style={{
            margin: 0,
            padding: '16px',
            background: theme.colors.primary.light,
            borderRadius: '12px',
            borderLeft: '4px solid #667eea',
          }}>
            We are actively building <strong>client-side encryption</strong> so that your personal notes and
            reflections will be encrypted on your device before they ever reach our servers. When that's complete,
            we won't just be promising not to read your data — we'll be architecturally <em>unable</em> to.
          </p>
        </div>
      </div>

      {/* Why This Matters */}
      <div style={{
        background: theme.colors.surface.glass,
        borderRadius: '20px',
        padding: isMobile ? '24px' : '40px',
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.lg,
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: theme.colors.text.primary,
          margin: '0 0 16px 0',
        }}>
          Why this matters to us:
        </h2>

        <p style={{
          fontSize: '15px',
          lineHeight: '1.7',
          color: theme.colors.text.primary,
          margin: 0,
        }}>
          We built SelfPM because we use it ourselves. Kaushik has 150+ days of his own data in this app —
          the same vulnerable, honest data we're asking you to create. We have the same stake in this
          privacy as you do.
        </p>
      </div>

      {/* Signature */}
      <div style={{
        textAlign: 'center',
        padding: '24px',
        fontSize: '15px',
        fontStyle: 'italic',
      }}>
        <p style={{ margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.8)' }}>With respect for your journey,</p>
        <p style={{
          margin: 0,
          fontWeight: '700',
          fontStyle: 'normal',
          color: 'white',
          fontSize: '18px',
        }}>
          — Kaushik & Gana
        </p>
      </div>
    </div>
  );
};
