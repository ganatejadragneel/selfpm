// Reports grid — brief §B2.2. Name / Date Generated / Period / Notes.
// Row click opens the report in Pages; the Notes cell edits inline.

import { useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { formatDate, type ReportGridRow } from './reportsLogic';

const INK = '#1f2937';
const SUB = '#6b7280';
const MUTED = '#9ca3af';
const ACCENT = '#667eea';
const HAIR = '#ececef';

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: MUTED,
  padding: '10px 14px',
  borderBottom: `1px solid ${HAIR}`,
  whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: '12px 14px', borderBottom: `1px solid ${HAIR}`, fontSize: 13.5, color: INK, verticalAlign: 'middle' };

export function ReportsGrid({
  rows,
  loading,
  onOpen,
  onNotesChange,
}: {
  rows: ReportGridRow[];
  loading: boolean;
  onOpen: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  if (loading) {
    return <div style={{ padding: '28px 16px', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading your reports…</div>;
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
        <FileText size={22} style={{ opacity: 0.5 }} />
        <div style={{ marginTop: 10, color: SUB, fontWeight: 600 }}>No reports yet.</div>
        <div>Generate your first one above — it reads your window, your history page, and your prior reports.</div>
      </div>
    );
  }

  const commit = (id: string) => {
    onNotesChange(id, draft.trim());
    setEditing(null);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Date Generated</th>
            <th style={th}>Period</th>
            <th style={{ ...th, width: '34%' }}>Notes</th>
            <th style={{ ...th, width: 34 }} aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="rp-row"
              onClick={() => editing !== r.id && onOpen(r.id)}
              style={{ cursor: 'pointer' }}
            >
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={13} color={ACCENT} style={{ flex: 'none' }} />
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  {r.commitmentCount > 0 && (
                    <span
                      title={`${r.commitmentCount} commitment${r.commitmentCount > 1 ? 's' : ''} the next report will grade`}
                      style={{ flex: 'none', fontSize: 11, fontWeight: 700, color: ACCENT, background: 'rgba(102,126,234,0.10)', borderRadius: 999, padding: '2px 8px' }}
                    >
                      {r.commitmentCount}c
                    </span>
                  )}
                  {r.imported && (
                    <span title="Imported from your archive — predates the commitment contract" style={{ flex: 'none', fontSize: 11, color: MUTED, border: `1px solid ${HAIR}`, borderRadius: 999, padding: '2px 8px' }}>
                      imported
                    </span>
                  )}
                </div>
              </td>
              <td style={{ ...td, color: SUB, whiteSpace: 'nowrap' }}>{formatDate(r.generated)}</td>
              <td style={{ ...td, color: SUB, whiteSpace: 'nowrap' }}>{formatDate(r.period)}</td>
              <td style={td} onClick={(e) => e.stopPropagation()}>
                {editing === r.id ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commit(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit(r.id);
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    aria-label={`Note for ${r.name}`}
                    style={{ width: '100%', padding: '6px 8px', border: `1px solid ${ACCENT}`, borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditing(r.id);
                      setDraft(r.notes);
                    }}
                    style={{ color: r.notes ? SUB : MUTED, fontStyle: r.notes ? 'normal' : 'italic', cursor: 'text' }}
                  >
                    {r.notes || 'Add a note…'}
                  </span>
                )}
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                <ChevronRight size={15} color={MUTED} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
