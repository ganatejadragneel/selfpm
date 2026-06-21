// Column 2 — the pages inside the selected folder (manual/display order) +
// New page. Hover a row for reorder (within folder) and delete.

import { Plus, FileText, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { KbDocument } from './types';

const HAIR = '#ececef';
const INK = '#1f2937';
const SUB = '#6b7280';
const MUTED = '#9ca3af';
const ACCENT = '#667eea';

function snippet(content: string): string {
  const firstReal = content
    .split('\n')
    .map((l) => l.replace(/^#+\s*/, '').replace(/[*_`>-]/g, '').trim())
    .find((l) => l.length > 0);
  return firstReal ?? 'No additional text';
}

function relDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function DocumentList({
  folderName,
  documents,
  activeDocId,
  onSelect,
  onCreate,
  onDelete,
  onReorder,
}: {
  folderName: string;
  documents: KbDocument[]; // already in display order
  activeDocId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`.doc-row .doc-actions{opacity:0;transition:opacity .15s}.doc-row:hover .doc-actions{opacity:1}`}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 14px 10px',
          gap: 8,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 700,
            color: INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {folderName}
        </h3>
        <button onClick={onCreate} title="New page" style={newBtnStyle}>
          <Plus size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {documents.length === 0 ? (
          <div style={{ padding: '24px 16px', color: MUTED, fontSize: 13, textAlign: 'center' }}>
            No pages yet. <br />
            <span style={{ color: ACCENT, cursor: 'pointer' }} onClick={onCreate}>
              Create the first one.
            </span>
          </div>
        ) : (
          documents.map((d, i) => {
            const active = d.id === activeDocId;
            const reserved = !!d.role; // charter / history — not deletable
            return (
              <div
                key={d.id}
                className="doc-row"
                onClick={() => onSelect(d.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderBottom: `1px solid ${HAIR}`,
                  borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                  background: active ? 'rgba(102,126,234,0.06)' : 'transparent',
                  padding: '11px 12px 11px 14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: INK,
                      marginBottom: 3,
                    }}
                  >
                    {d.source === 'cbo' && <FileText size={12} color={ACCENT} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.title || 'Untitled'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, color: MUTED }}>
                    <span style={{ flex: 'none' }}>{relDate(d.created_at)}</span>
                    <span
                      style={{
                        color: SUB,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {snippet(d.content)}
                    </span>
                  </div>
                </div>

                <div className="doc-actions" style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 'none' }}>
                  <button
                    title="move up"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder(d.id, 'up');
                    }}
                    style={{ ...iconBtn, opacity: i === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    title="move down"
                    disabled={i === documents.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder(d.id, 'down');
                    }}
                    style={{ ...iconBtn, opacity: i === documents.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  {!reserved && (
                    <button
                      title="delete page"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${d.title || 'Untitled'}"?`)) onDelete(d.id);
                      }}
                      style={iconBtn}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const newBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: 8,
  background: 'rgba(102,126,234,0.10)',
  color: ACCENT,
  cursor: 'pointer',
  flex: 'none',
};

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: MUTED,
  cursor: 'pointer',
};
