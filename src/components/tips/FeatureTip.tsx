// The tip affordance — a quiet marker beside a feature that opens its explanation.
//
// NON-INVASIVE IS A HARD RULE, not a style preference. Nothing here ever opens by
// itself, nothing blocks the page, nothing has to be dismissed before the app can
// be used. The only thing that ever asks for attention is the marker on a tip the
// seeker has not read yet — and the moment it is read it collapses to a hairline
// "?" and never asks again. A seeker who ignores every tip should never be nagged.
//
// The marker is anchored beside the feature rather than floating over it, so the
// explanation appears where the thing being explained actually is.
//
// This same component is what a future guided walkthrough will drive: the tour
// player opens tips in registry order, so the tour and the on-demand tip are the
// same surface and can never drift apart into two explanations of one feature.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Sparkles } from 'lucide-react';
import { TIPS, type TipId } from './tipRegistry';
import { useTipsStore } from './tipsStore';
import { TipPanel } from './TipPanel';

interface Props {
  id: TipId;
  /** which edge of the marker the panel hangs from. Use 'right' near the page edge. */
  align?: 'left' | 'right';
}

/**
 * The tip derives its OWN palette from the theme rather than taking colours from
 * whichever screen it sits on. Every host in this app has a different local colour
 * vocabulary (the tracker uses theme.colors.*, Quick Notes hand-rolls isDark
 * ternaries, Pages uses module constants) and a tip that inherited each of those
 * would look like a different component on every screen. It is one widget with one
 * appearance, so it owns its appearance — and mounting it anywhere is one line.
 */
export function FeatureTip({ id, align = 'left' }: Props) {
  const tip = TIPS[id];
  const t = useThemeColors();
  const palette = useMemo(() => {
    const c = t.colors;
    const dark = t.currentTheme === 'dark';
    return {
      sub: c.text.secondary,
      muted: c.text.muted,
      accent: c.primary.dark,
      hairline: dark ? c.surface.glassBorder : '#ececef',
      surface: dark ? c.surface.glass : '#ffffff',
      gradient: c.primary.gradient,
    };
  }, [t]);
  const { muted, accent, hairline, gradient } = palette;
  const { loaded, load, isUnread, markRead } = useTipsStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = loaded && isUnread(id);

  const toggle = () => {
    if (!open) markRead(id); // reading it is the act; no "got it" button to click
    setOpen((v) => !v);
  };

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {/* Loud exactly once. An unread tip is a filled gradient chip with a spark;
          the moment it is read it becomes a hairline "?" and never asks again.
          That is the whole non-invasive bargain — noticeable when it has something
          to say, invisible for the rest of the product's life. */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
        aria-label={`What is ${tip.title}?`}
        aria-expanded={open}
        title={`What is ${tip.title}?`}
        style={{
          position: 'relative',
          height: 24,
          width: unread ? 'auto' : 24,
          padding: unread ? '0 9px 0 7px' : 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderRadius: 999,
          border: unread ? 'none' : `1px solid ${open ? `${accent}66` : hairline}`,
          background: unread ? gradient : open ? `${accent}12` : 'transparent',
          color: unread ? '#fff' : open ? accent : muted,
          fontFamily: 'inherit',
          fontSize: unread ? 11 : 12,
          fontWeight: 700,
          letterSpacing: unread ? '0.02em' : 0,
          lineHeight: 1,
          cursor: 'pointer',
          justifyContent: 'center',
          boxShadow: unread ? '0 2px 10px rgba(102,126,234,0.45)' : 'none',
          transition: 'color .15s, border-color .15s, background .15s',
        }}
      >
        {unread ? (
          <>
            <Sparkles size={12} />
            New
          </>
        ) : (
          '?'
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${tip.title} — how it works`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            [align]: 0,
            width: 'min(360px, calc(100vw - 40px))',
            border: `1px solid ${hairline}`,
            borderRadius: 16,
            boxShadow: '0 18px 48px rgba(0,0,0,0.16)',
            zIndex: 60,
          }}
        >
          <TipPanel
            tip={tip}
            onClose={() => setOpen(false)}
            theme={palette}
          />
        </div>
      )}
    </span>
  );
}
