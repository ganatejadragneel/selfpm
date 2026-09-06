// The Seeker Title — the first thing on the dashboard.
//
// A short line the seeker writes for themselves and sees every time they open the
// app. It is not a status, a metric, or a nag: the point is to settle them before
// they look at their own numbers, so the observation is less biased. That drives
// every choice here — large quiet type, no border until you touch it, no counter
// until it could matter, and nothing that reads as a form field.
//
// Saving is deliberately two-speed. Typing and walking away persists the line
// (blur → persist), because "set it and leave it for weeks" is the main way this
// gets used. Keeping it forever is a separate, explicit act: Save adds it to the
// library, which is the feature underneath the feature — a personal collection of
// lines that worked, that they can return to.

import { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Library, Check, X } from 'lucide-react';
import { useSeekerTitleStore, countWords, MAX_WORDS } from './seekerTitleStore';
import { FeatureTip } from '../tips/FeatureTip';

interface Props {
  ink: string;
  sub: string;
  muted: string;
  accent: string;
  hairline: string;
  surface: string;
}

export function SeekerTitle({ ink, sub, muted, accent, hairline, surface }: Props) {
  const { body, library, activeId, initialized, dirty, init, setBody, persist, commit, select, remove } =
    useSeekerTitleStore();
  const [focused, setFocused] = useState(false);
  const [openLibrary, setOpenLibrary] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  useEffect(() => {
    if (!openLibrary) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpenLibrary(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openLibrary]);

  const words = countWords(body);
  const over = words > MAX_WORDS;
  const canSave = !over && body.trim().length > 0 && dirty();

  const onSave = async () => {
    await commit();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const iconBtn = (active = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: active ? accent : muted,
    background: 'transparent',
    border: `1px solid ${active ? `${accent}55` : hairline}`,
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color .15s, border-color .15s',
  });

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 14,
          border: `1px solid ${focused ? `${accent}44` : 'transparent'}`,
          background: focused ? surface : 'transparent',
          transition: 'background .18s, border-color .18s',
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            persist();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
          }}
          placeholder="Write a line to steady yourself before you look…"
          aria-label={`Seeker Title, up to ${MAX_WORDS} words`}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 'clamp(17px, 2.1vw, 23px)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
            color: body ? ink : muted,
          }}
        />

        {/* the counter appears only once it could plausibly matter */}
        {(focused || over) && (
          <span
            style={{
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              color: over ? '#ef4444' : muted,
              fontWeight: over ? 700 : 500,
              flexShrink: 0,
            }}
          >
            {words}/{MAX_WORDS}
          </span>
        )}

        {canSave && (
          <button onMouseDown={(e) => e.preventDefault()} onClick={onSave} style={iconBtn(true)}>
            <BookmarkPlus size={14} />
            Save
          </button>
        )}
        {justSaved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
            <Check size={14} /> saved
          </span>
        )}

        {library.length > 0 && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenLibrary((v) => !v)}
            style={iconBtn(openLibrary)}
            title="Your saved lines"
          >
            <Library size={14} />
            {library.length}
          </button>
        )}

        <FeatureTip id="seeker-title" align="right" />
      </div>

      {over && (
        <div style={{ fontSize: 12, color: '#ef4444', padding: '2px 16px 0' }}>
          {words - MAX_WORDS} word{words - MAX_WORDS === 1 ? '' : 's'} over — this one is meant to be short enough to hold in your head.
        </div>
      )}

      {openLibrary && (
        <div
          ref={popRef}
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 6,
            width: 'min(420px, 90vw)',
            maxHeight: 300,
            overflowY: 'auto',
            background: surface,
            border: `1px solid ${hairline}`,
            borderRadius: 12,
            boxShadow: '0 14px 40px rgba(0,0,0,0.14)',
            zIndex: 40,
            padding: 6,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 650, letterSpacing: '0.07em', textTransform: 'uppercase', color: muted, padding: '8px 10px 6px' }}>
            Your lines
          </div>
          {library.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                background: m.id === activeId ? `${accent}10` : 'transparent',
              }}
              onClick={() => { select(m.id); setOpenLibrary(false); }}
            >
              <span style={{ flex: 1, fontSize: 14, color: m.id === activeId ? ink : sub, lineHeight: 1.4 }}>
                {m.body}
              </span>
              {m.id === activeId && <Check size={14} color={accent} />}
              <button
                onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                title="Remove from your library"
                aria-label="Remove from your library"
                style={{ display: 'flex', border: 'none', background: 'transparent', color: muted, cursor: 'pointer', padding: 2 }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
