import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Download, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { QuickNote } from '../../types';

interface QuickNotesExportButtonProps {
  notes: QuickNote[];
}

interface ExportedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  charCount: number;
  wordCount: number;
  tagCount: number;
}

// ─── Export data builders ────────────────────────────────────────────────────

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function buildExportedNote(note: QuickNote): ExportedNote {
  const content = note.content ?? '';
  const tags = note.tags ?? [];
  return {
    id: note.id,
    title: note.title,
    content,
    tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    charCount: content.length,
    wordCount: countWords(content),
    tagCount: tags.length,
  };
}

function buildJsonExport(notes: QuickNote[]): string {
  const payload = {
    export_version: '1.0',
    exported_at: new Date().toISOString(),
    count: notes.length,
    notes: notes.map(buildExportedNote),
  };
  return JSON.stringify(payload, null, 2);
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsvExport(notes: QuickNote[]): string {
  const header = 'id,title,content,tags,createdAt,updatedAt,charCount,wordCount,tagCount';
  const rows = notes.map(n => {
    const e = buildExportedNote(n);
    return [
      csvEscape(e.id),
      csvEscape(e.title),
      csvEscape(e.content),
      csvEscape(e.tags.join(';')),
      e.createdAt,
      e.updatedAt,
      e.charCount,
      e.wordCount,
      e.tagCount,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const QuickNotesExportButton = memo(function QuickNotesExportButton({
  notes,
}: QuickNotesExportButtonProps) {
  const theme = useThemeColors();
  const isDark = theme.currentTheme === 'dark';
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideWrapper && !insideDropdown) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const flash = (result: 'success' | 'error') => {
    setStatus(result);
    setTimeout(() => { setStatus('idle'); setOpen(false); }, 2000);
  };

  const handleExport = useCallback((fmt: 'csv' | 'json') => {
    if (notes.length === 0) { flash('error'); return; }
    try {
      const stamp = getDateStamp();
      const fileName = `quick-notes-${notes.length}-${stamp}.${fmt}`;
      if (fmt === 'json') {
        triggerDownload(buildJsonExport(notes), fileName, 'application/json');
      } else {
        triggerDownload(buildCsvExport(notes), fileName, 'text/csv');
      }
      flash('success');
    } catch {
      flash('error');
    }
  }, [notes]);

  const disabled = notes.length === 0;

  const textSecondary = isDark ? '#94a3b8' : '#334155';
  const textPrimary = isDark ? '#e2e8f0' : '#0f172a';

  const glass: React.CSSProperties = {
    background: isDark ? 'rgba(18,20,28,0.85)' : 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  };

  const baseStyle: React.CSSProperties = {
    ...glass,
    borderRadius: '10px', padding: '8px 14px', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '6px',
    color: textSecondary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    transition: 'color 0.15s',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: dropdownPos?.top ?? 0,
    right: dropdownPos?.right ?? 0,
    zIndex: 9999,
    ...glass,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.effects.shadow.md,
    minWidth: 200, overflow: 'hidden',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
    padding: '10px 14px', background: 'none', border: 'none',
    color: textPrimary, fontSize: 13, cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit',
  };

  const successBg = isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)';
  const successFg = isDark ? '#4ade80' : '#16a34a';
  const errorBg = isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)';
  const errorFg = isDark ? '#f87171' : '#dc2626';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={() => { if (!disabled && status === 'idle') setOpen(o => !o); }}
        disabled={disabled}
        style={{
          ...baseStyle,
          background: status === 'success' ? successBg
            : status === 'error' ? errorBg
            : baseStyle.background,
          color: status === 'success' ? successFg
            : status === 'error' ? errorFg
            : baseStyle.color,
        }}
        onMouseEnter={e => { if (!disabled && status === 'idle') e.currentTarget.style.color = textPrimary; }}
        onMouseLeave={e => { if (!disabled && status === 'idle') e.currentTarget.style.color = textSecondary; }}
        title={disabled ? 'No notes to export' : `Export ${notes.length} note${notes.length !== 1 ? 's' : ''}`}
      >
        {status === 'success' ? <><Check size={14} />Exported</>
          : status === 'error' ? <><AlertCircle size={14} />{notes.length === 0 ? 'No notes' : 'Failed'}</>
          : <><Download size={14} />Export<ChevronDown size={12} /></>}
      </button>

      {open && status === 'idle' && dropdownPos && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
          <button
            style={itemStyle}
            onClick={() => handleExport('csv')}
            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Download size={14} /> CSV — {notes.length} note{notes.length !== 1 ? 's' : ''}
          </button>
          <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          <button
            style={itemStyle}
            onClick={() => handleExport('json')}
            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Download size={14} /> JSON — {notes.length} note{notes.length !== 1 ? 's' : ''}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
});
