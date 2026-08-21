// Column 1 — folders. User folders (rename / delete) + reserved system folders
// (locked) + an "Unfiled" row when a deleted folder's pages fell back here.

import { useState } from 'react';
import { Folder, FolderInput, ScrollText, Settings, Lock, Plus, X } from 'lucide-react';
import type { KbFolder } from './types';
import { FeatureTip } from '../tips/FeatureTip';
import { UNFILED } from './pagesStore';
import { useSurfacePalette } from '../../hooks/useSurfacePalette';


function folderIcon(f: KbFolder, size = 15) {
  if (f.role === 'cpo_reports') return <ScrollText size={size} />;
  if (f.role === 'system') return <Settings size={size} />;
  return <Folder size={size} />;
}

export function FolderList({
  folders,
  activeFolderId,
  showUnfiled,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  folders: KbFolder[];
  activeFolderId: string | null;
  showUnfiled: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const { muted: MUTED, accent: ACCENT, hair: HAIR } = useSurfacePalette();
  const labelStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: MUTED,
  };
  const addBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '8px 10px',
    margin: '2px 0',
    border: 'none',
    background: 'none',
    color: ACCENT,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 8,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${ACCENT}`,
    borderRadius: 8,
    fontSize: 13.5,
    outline: 'none',
    margin: '2px 0',
  };
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const userFolders = folders.filter((f) => !f.is_system);
  const systemFolders = folders.filter((f) => f.is_system);

  const submit = () => {
    if (name.trim()) onCreate(name);
    setName('');
    setAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`.folder-row .folder-del{opacity:0;transition:opacity .15s}.folder-row:hover .folder-del{opacity:1}`}</style>

      <div style={{ padding: '16px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ ...labelStyle, margin: 0 }}>Folders</h3>
        <FeatureTip id="pages" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {userFolders.map((f) => (
          <Row
            key={f.id}
            f={f}
            active={f.id === activeFolderId}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}

        {showUnfiled && (
          <UnfiledRow active={activeFolderId === UNFILED} onSelect={() => onSelect(UNFILED)} />
        )}

        {adding ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') {
                setName('');
                setAdding(false);
              }
            }}
            placeholder="Folder name"
            style={inputStyle}
          />
        ) : (
          <button onClick={() => setAdding(true)} style={addBtnStyle}>
            <Plus size={14} /> New folder
          </button>
        )}

        {systemFolders.length > 0 && (
          <div style={{ borderTop: `1px solid ${HAIR}`, margin: '10px 6px', paddingTop: 8 }}>
            <div style={{ ...labelStyle, fontSize: 10, padding: '0 6px 6px' }}>Reserved</div>
            {systemFolders.map((f) => (
              <Row key={f.id} f={f} active={f.id === activeFolderId} onSelect={onSelect} system />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  f,
  active,
  onSelect,
  onRename,
  onDelete,
  system,
}: {
  f: KbFolder;
  active: boolean;
  onSelect: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  system?: boolean;
}) {
  const { ink: INK, sub: SUB, muted: MUTED, accent: ACCENT, accentSoft: ACCENT_SOFT } = useSurfacePalette();
  const actionBtn: React.CSSProperties = {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: MUTED,
    padding: 2,
    display: 'inline-flex',
    flex: 'none',
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(f.name);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== f.name) onRename?.(f.id, v);
    else setDraft(f.name);
    setEditing(false);
  };

  return (
    <div
      className="folder-row"
      onClick={() => !editing && onSelect(f.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        margin: '1px 0',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: active ? 700 : 500,
        color: active ? ACCENT : INK,
        background: active ? ACCENT_SOFT : 'transparent',
      }}
    >
      <span style={{ color: active ? ACCENT : system ? MUTED : SUB, display: 'inline-flex' }}>
        {folderIcon(f)}
      </span>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(f.name);
              setEditing(false);
            }
          }}
          style={{ flex: 1, fontSize: 13.5, padding: '2px 5px', border: `1px solid ${ACCENT}`, borderRadius: 5, outline: 'none' }}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            if (system) return;
            e.stopPropagation();
            setDraft(f.name);
            setEditing(true);
          }}
          title={system ? 'reserved folder' : 'double-click to rename'}
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {f.name}
        </span>
      )}

      {system ? (
        <Lock size={12} color={MUTED} />
      ) : (
        !editing && (
          <button
            className="folder-del"
            title="delete folder"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${f.name}"? Its pages move to Unfiled.`)) onDelete?.(f.id);
            }}
            style={actionBtn}
          >
            <X size={13} />
          </button>
        )
      )}
    </div>
  );
}

function UnfiledRow({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  const { sub: SUB, muted: MUTED, accent: ACCENT, accentSoft: ACCENT_SOFT } = useSurfacePalette();
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        margin: '1px 0',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: active ? 700 : 500,
        color: active ? ACCENT : SUB,
        background: active ? ACCENT_SOFT : 'transparent',
        fontStyle: 'italic',
      }}
    >
      <FolderInput size={15} color={MUTED} />
      <span style={{ flex: 1 }}>Unfiled</span>
    </div>
  );
}




