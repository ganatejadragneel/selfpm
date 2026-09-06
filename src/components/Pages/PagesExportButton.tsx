// Pages export — CSV / JSON / Markdown, scoped to the open folder or every page.
// Mirrors the QuickNotes + Sprint export buttons (portal dropdown, flash status,
// blob download) but styled for the light Pages surface.

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Download, Check, AlertCircle, FileText, FileJson, FileType } from 'lucide-react';
import type { KbDocument, KbFolder } from './types';
import { UNFILED } from './pagesStore';
import {
  countWords,
  buildCsvExport,
  buildJsonExport,
  buildMarkdownExport,
  getDateStamp,
  slugify,
} from './pagesExport';
import type { PagesExportFormat, PagesExportScope } from './pagesExport';
import { useSurfacePalette } from '../../hooks/useSurfacePalette';


type Format = PagesExportFormat;
type Scope = PagesExportScope;

interface PagesExportButtonProps {
  documents: KbDocument[];
  folders: KbFolder[];
  activeFolderId: string | null;
  folderDocs: KbDocument[];
  folderName: string;
}

// ─── Download ────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export const PagesExportButton = memo(function PagesExportButton({
  documents,
  folders,
  activeFolderId,
  folderDocs,
  folderName,
}: PagesExportButtonProps) {
  const { ink: INK, sub: SUB, muted: MUTED, accent: ACCENT, accentSoft: ACCENT_SOFT, hair: HAIR, surface: SURFACE } = useSurfacePalette();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>('all');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - 232) });
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

  const hasFolder = activeFolderId !== null;
  const scoped = scope === 'all' || !hasFolder ? documents : folderDocs;
  const disabled = documents.length === 0;

  const flash = (result: 'success' | 'error') => {
    setStatus(result);
    setTimeout(() => {
      setStatus('idle');
      setOpen(false);
    }, 1800);
  };

  const handleExport = useCallback(
    (fmt: Format) => {
      if (scoped.length === 0) {
        flash('error');
        return;
      }
      try {
        const effectiveScope: Scope = scope === 'all' || !hasFolder ? 'all' : 'folder';
        const label =
          effectiveScope === 'all'
            ? 'all'
            : slugify(activeFolderId === UNFILED ? 'unfiled' : folderName);
        const fileName = `selfpm-pages-${label}-${scoped.length}-${getDateStamp()}.${fmt}`;

        if (fmt === 'json') {
          triggerDownload(
            buildJsonExport(scoped, folders, effectiveScope),
            fileName,
            'application/json',
          );
        } else if (fmt === 'csv') {
          triggerDownload(buildCsvExport(scoped, folders), fileName, 'text/csv');
        } else {
          triggerDownload(
            buildMarkdownExport(scoped, folders, effectiveScope),
            fileName,
            'text/markdown',
          );
        }
        flash('success');
      } catch {
        flash('error');
      }
    },
    [scoped, folders, scope, hasFolder, activeFolderId, folderName],
  );

  const scopeTab = (value: Scope): React.CSSProperties => ({
    flex: 1,
    padding: '5px 8px',
    fontSize: 11.5,
    fontWeight: scope === value ? 700 : 500,
    color: scope === value ? ACCENT : SUB,
    background: scope === value ? ACCENT_SOFT : 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  });

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    width: '100%',
    padding: '9px 12px',
    background: 'transparent',
    border: 'none',
    fontSize: 12.5,
    color: INK,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        onClick={() => {
          if (!disabled && status === 'idle') setOpen((o) => !o);
        }}
        disabled={disabled}
        title={disabled ? 'No pages to export' : `Export pages (${documents.length} total)`}
        style={{
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          border: `1px solid ${HAIR}`,
          background:
            status === 'success'
              ? 'rgba(34,197,94,0.12)'
              : status === 'error'
                ? 'rgba(239,68,68,0.12)'
                : SURFACE,
          color:
            status === 'success' ? '#16a34a' : status === 'error' ? '#dc2626' : open ? ACCENT : SUB,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'color .15s, background .15s',
        }}
      >
        {status === 'success' ? (
          <Check size={14} />
        ) : status === 'error' ? (
          <AlertCircle size={14} />
        ) : (
          <Download size={14} />
        )}
      </button>

      {open &&
        status === 'idle' &&
        dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
              width: 232,
              background: SURFACE,
              border: `1px solid ${HAIR}`,
              borderRadius: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 12px 8px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: 7,
                }}
              >
                Export
              </div>
              <div style={{ display: 'flex', gap: 4, background: '#f6f6f8', padding: 3, borderRadius: 8 }}>
                <button onClick={() => setScope('all')} style={scopeTab('all')}>
                  All ({documents.length})
                </button>
                <button
                  onClick={() => hasFolder && setScope('folder')}
                  disabled={!hasFolder}
                  title={hasFolder ? folderName : 'No folder selected'}
                  style={{
                    ...scopeTab('folder'),
                    opacity: hasFolder ? 1 : 0.45,
                    cursor: hasFolder ? 'pointer' : 'not-allowed',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  This folder ({folderDocs.length})
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: HAIR }} />

            <ExportRow
              icon={<FileType size={14} />}
              label="Markdown"
              hint="readable · best for analysis"
              style={itemStyle}
              onClick={() => handleExport('md')}
            />
            <ExportRow
              icon={<FileText size={14} />}
              label="CSV"
              hint="one row per page"
              style={itemStyle}
              onClick={() => handleExport('csv')}
            />
            <ExportRow
              icon={<FileJson size={14} />}
              label="JSON"
              hint="structured + metadata"
              style={itemStyle}
              onClick={() => handleExport('json')}
            />

            <div
              style={{
                padding: '7px 12px 9px',
                borderTop: `1px solid ${HAIR}`,
                fontSize: 11,
                color: MUTED,
              }}
            >
              {scoped.length} page{scoped.length === 1 ? '' : 's'} ·{' '}
              {scoped
                .reduce((sum, d) => sum + countWords(d.content ?? ''), 0)
                .toLocaleString()}{' '}
              words
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
});

function ExportRow({
  icon,
  label,
  hint,
  style,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  style: React.CSSProperties;
  onClick: () => void;
}) {
  const { sub: SUB, muted: MUTED } = useSurfacePalette();
  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f6f6f8')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: SUB, display: 'inline-flex' }}>{icon}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: MUTED }}>{hint}</span>
    </button>
  );
}
