// The tip panel — pure presentation, no anchoring and no open/close state.
//
// Split out of FeatureTip on purpose. The guided walkthrough (feature 16.1) needs
// to render a tip on its own, driven by the tour rather than by a marker click,
// and the only way the tour and the on-demand tip can be guaranteed never to
// drift into two different-looking explanations is for both to render this exact
// component. FeatureTip wraps it in a popover; the tour player will wrap it in
// whatever it needs. Neither owns the appearance.

import { X, Sparkles } from 'lucide-react';
import { type Tip } from './tipRegistry';

export interface TipPanelTheme {
  sub: string;
  muted: string;
  accent: string;
  hairline: string;
  surface: string;
  gradient: string;
}

export function TipPanel({
  tip,
  theme,
  onClose,
  footer,
}: {
  tip: Tip;
  theme: TipPanelTheme;
  onClose?: () => void;
  /** the tour player slots its Back / Next controls here. */
  footer?: React.ReactNode;
}) {
  const { sub, muted, accent, hairline, surface, gradient } = theme;

  return (
    <div style={{ background: surface, borderRadius: 16, overflow: 'hidden' }}>
      {/* the header carries the brand gradient — a tip is the one element on the
          dashboard briefly asking to be looked at, so it is the one element
          allowed to be vivid */}
      <div style={{ background: gradient, padding: '14px 16px 15px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              <Sparkles size={11} />
              How it works
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 5, letterSpacing: '-0.015em' }}>
              {tip.title}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex', border: 'none', background: 'transparent',
                color: 'rgba(255,255,255,0.75)', cursor: 'pointer', padding: 2, marginTop: -2,
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 13.5, color: sub, lineHeight: 1.55, margin: 0 }}>{tip.what}</p>

        <ol style={{ margin: '13px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
          {tip.how.map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: `${accent}15`,
                  color: accent,
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: sub, lineHeight: 1.5 }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* the why is visually separated because it is a different kind of claim:
          not mechanics, but the intent the interface cannot show on its own */}
      <div style={{ padding: '12px 16px 14px', background: `${accent}0A`, borderTop: `1px solid ${hairline}` }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            color: muted,
            marginBottom: 5,
          }}
        >
          Why it's here
        </div>
        <p style={{ fontSize: 12.5, color: sub, lineHeight: 1.55, margin: 0 }}>{tip.why}</p>
      </div>

      {footer}
    </div>
  );
}
