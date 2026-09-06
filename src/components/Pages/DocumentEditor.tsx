// Column 3 — the editor. Markdown in a styled textarea (Write) + a rendered
// read view (Preview). Minimal list toolbar, Enter-continues-list, autosave
// indicator, one fixed document typeface. Markdown decision per the spec.

import { useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { List, ListOrdered, Check, Loader2, Lock } from 'lucide-react';
import type { KbDocument } from './types';
import { FeatureTip } from '../tips/FeatureTip';
import { useSurfacePalette } from '../../hooks/useSurfacePalette';

const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

type Mode = 'write' | 'preview';

export function DocumentEditor({
  doc,
  saving,
  onChange,
}: {
  doc: KbDocument | null;
  saving: boolean;
  onChange: (patch: Partial<Pick<KbDocument, 'title' | 'content'>>) => void;
}) {
  const { ink: INK, sub: SUB, muted: MUTED, accent: ACCENT, accentSoft: ACCENT_SOFT, hair: HAIR, surface: SURFACE } = useSurfacePalette();
  const iconBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: SUB,
    cursor: 'pointer',
  };
  const [mode, setMode] = useState<Mode>('write');
  const taRef = useRef<HTMLTextAreaElement>(null);

  if (!doc) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: MUTED,
          fontSize: 14,
        }}
      >
        Select a page, or create a new one.
      </div>
    );
  }

  const reserved = doc.source === 'cbo' || !!doc.role;

  const insertAtLineStart = (marker: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, value } = ta;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const next = value.slice(0, lineStart) + marker + value.slice(lineStart);
    onChange({ content: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = selectionStart + marker.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    const ta = e.currentTarget;
    const { selectionStart, value } = ta;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const line = value.slice(lineStart, selectionStart);
    const m = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (!m) return;
    e.preventDefault();
    const [, indent, bullet, rest] = m;
    if (rest.trim() === '') {
      // empty list item → end the list
      const next = value.slice(0, lineStart) + value.slice(selectionStart);
      onChange({ content: next });
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(lineStart, lineStart);
      });
      return;
    }
    const nextMarker = /\d+\./.test(bullet) ? `${parseInt(bullet) + 1}. ` : `${bullet} `;
    const insert = `\n${indent}${nextMarker}`;
    const next = value.slice(0, selectionStart) + insert + value.slice(selectionStart);
    onChange({ content: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = selectionStart + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title */}
      <input
        value={doc.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Untitled"
        readOnly={reserved && doc.source === 'cbo'}
        style={{
          border: 'none',
          outline: 'none',
          fontSize: 24,
          fontWeight: 700,
          color: INK,
          padding: '18px 22px 8px',
          fontFamily: SERIF,
          letterSpacing: '-0.01em',
        }}
      />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 22px 10px',
          borderBottom: `1px solid ${HAIR}`,
        }}
      >
        <div style={{ display: 'flex', gap: 2, background: ACCENT_SOFT, borderRadius: 8, padding: 3 }}>
          {(['write', 'preview'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                color: mode === m ? INK : MUTED,
                background: mode === m ? SURFACE : 'transparent',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === 'write' && (
          <>
            <span style={{ width: 1, height: 18, background: HAIR }} />
            <button title="Bullet list" onClick={() => insertAtLineStart('- ')} style={iconBtn}>
              <List size={16} />
            </button>
            <button title="Numbered list" onClick={() => insertAtLineStart('1. ')} style={iconBtn}>
              <ListOrdered size={16} />
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {doc.role === 'charter' && <FeatureTip id="charter" align="right" />}
        {reserved && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: MUTED }}>
            <Lock size={12} /> {doc.role ? `reserved · ${doc.role}` : 'generated report'}
          </span>
        )}
        <SaveIndicator saving={saving} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mode === 'write' ? (
          <textarea
            ref={taRef}
            value={doc.content}
            onChange={(e) => onChange({ content: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Start writing…"
            spellCheck
            style={{
              width: '100%',
              minHeight: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '18px 22px',
              fontSize: 15.5,
              lineHeight: 1.7,
              color: INK,
              fontFamily: SERIF,
              background: 'transparent',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div className="pages-md" style={{ padding: '18px 22px', fontFamily: SERIF, color: INK }}>
            <style>{`
              .pages-md h1 { font-size: 26px; font-weight: 700; margin: 4px 0 12px; letter-spacing:-0.01em; }
              .pages-md h2 { font-size: 19px; font-weight: 700; margin: 22px 0 8px; }
              .pages-md h3 { font-size: 16px; font-weight: 700; margin: 18px 0 6px; }
              .pages-md p  { font-size: 15.5px; line-height: 1.75; margin: 0 0 12px; }
              .pages-md ul, .pages-md ol { padding-left: 24px; margin: 0 0 12px; }
              .pages-md li { font-size: 15.5px; line-height: 1.7; margin: 3px 0; }
              .pages-md strong { font-weight: 700; }
              .pages-md em { font-style: italic; }
              .pages-md a { color: ${ACCENT}; text-decoration: underline; }
              .pages-md code { font-family: ui-monospace, monospace; font-size: 13px; background:${ACCENT_SOFT}; padding:1px 5px; border-radius:4px; }
              .pages-md blockquote { border-left: 3px solid ${HAIR}; margin: 0 0 12px; padding-left: 14px; color: ${SUB}; }
              .pages-md hr { border: none; border-top: 1px solid ${HAIR}; margin: 18px 0; }
              .pages-md table { border-collapse: collapse; margin: 0 0 12px; }
              .pages-md th, .pages-md td { border: 1px solid ${HAIR}; padding: 6px 10px; font-size: 14px; }
            `}</style>
            {doc.content.trim() ? (
              <Markdown remarkPlugins={[remarkGfm]}>{doc.content}</Markdown>
            ) : (
              <span style={{ color: MUTED, fontFamily: 'system-ui' }}>Nothing to preview yet.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ saving }: { saving: boolean }) {
  const { muted: MUTED, accent: ACCENT } = useSurfacePalette();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: saving ? ACCENT : MUTED,
      }}
    >
      {saving ? (
        <>
          <Loader2 size={13} style={{ animation: 'spin 0.9s linear infinite' }} /> Saving…
        </>
      ) : (
        <>
          <Check size={13} /> Saved
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

