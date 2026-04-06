import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Filter, Plus, SlidersHorizontal, X } from 'lucide-react';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useResponsive } from '../../hooks/useResponsive';
import { useQuickNotesStore } from '../../store/quickNotesStore';
import { LoadingSpinner } from '../ui';
import { QuickNoteAddModal } from './QuickNoteAddModal';
import { QuickNoteEditModal } from './QuickNoteEditModal';

type RangePreset = 'today' | '2days' | 'week' | 'month' | 'all' | 'custom';

const ACCENT_BORDER_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function getPresetThreshold(preset: RangePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case 'today': { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    case '2days': return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    case 'week':  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

export const QuickNotesPage: React.FC = () => {
  const theme = useThemeColors();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { notes, loading, error, fetchNotes, deleteNote, fetchedFrom } = useQuickNotesStore();

  // Filter state
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customActive, setCustomActive] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<import('../../types').QuickNote | null>(null);
  const [editingNote, setEditingNote] = useState<import('../../types').QuickNote | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const isDark = theme.currentTheme === 'dark';

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Re-fetch when the user picks 'all' or a custom range that extends beyond the fetched window
  const ensureRangeFetched = (from: Date | null, to?: Date) => {
    if (from === null) {
      // All time — only re-fetch if we don't already have all-time data
      if (fetchedFrom !== null) fetchNotes(null);
      return;
    }
    if (fetchedFrom !== null && from < fetchedFrom) {
      fetchNotes(from, to);
    }
  };

  // Unique days that have notes (for quick jump)
  const noteDays = useMemo(() => {
    const dayMap = new Map<string, number>();
    notes.forEach(n => {
      const day = format(new Date(n.createdAt), 'yyyy-MM-dd');
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    });
    return Array.from(dayMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);
  }, [notes]);

  // All unique tags across fetched notes
  const allTags = useMemo(() => [...new Set(notes.flatMap(n => n.tags))].sort(), [notes]);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // Filtered notes
  const displayNotes = useMemo(() => {
    let filtered: typeof notes;

    if (selectedDay) {
      filtered = notes.filter(n => format(new Date(n.createdAt), 'yyyy-MM-dd') === selectedDay);
    } else if (customActive && customFrom && customTo) {
      const from = startOfDay(new Date(customFrom));
      const to = new Date(new Date(customTo).setHours(23, 59, 59, 999));
      filtered = notes.filter(n => { const d = new Date(n.createdAt); return d >= from && d <= to; });
    } else {
      const threshold = getPresetThreshold(preset);
      filtered = threshold ? notes.filter(n => new Date(n.createdAt) >= threshold) : notes;
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(n => selectedTags.every(t => n.tags.includes(t)));
    }

    return filtered;
  }, [notes, selectedDay, preset, customFrom, customTo, customActive, selectedTags]);

  // Subtitle label
  const subtitleLabel = useMemo(() => {
    if (selectedDay) return getDayLabel(selectedDay + 'T00:00:00');
    if (customActive && customFrom && customTo) {
      return `${format(new Date(customFrom), 'MMM d')} – ${format(new Date(customTo), 'MMM d')}`;
    }
    const labels: Record<RangePreset, string> = {
      today: 'Today', '2days': 'Last 2 Days', week: 'This Week',
      month: 'This Month', all: 'All Time', custom: 'Custom Range',
    };
    return labels[preset];
  }, [selectedDay, preset, customFrom, customTo, customActive]);

  // Stronger text that isn't washed out in either theme
  const textPrimary   = isDark ? '#e2e8f0' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#334155';
  const textMuted     = isDark ? '#64748b' : '#64748b';

  const glass: React.CSSProperties = {
    background: isDark ? 'rgba(18,20,28,0.85)' : 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  };

  const sidebarItemBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', border: 'none', background: 'transparent',
    textAlign: 'left', width: '100%', fontFamily: 'inherit',
    color: textSecondary, transition: 'background 0.15s, color 0.15s',
  };

  const activeItem: React.CSSProperties = {
    background: 'rgba(99,102,241,0.15)',
    color: isDark ? '#a5b4fc' : '#4f46e5',
    fontWeight: 600,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: textMuted,
    padding: '12px 8px 5px', display: 'block',
  };

  const SidebarContent = (
    <>
      {/* Quick Jump */}
      <span style={sectionLabel}>Quick Jump</span>
      {noteDays.length === 0 && (
        <span style={{ fontSize: '12px', color: textMuted, padding: '4px 8px', display: 'block' }}>No notes yet</span>
      )}
      {noteDays.map(([day, count]) => {
        const isActive = selectedDay === day && !customActive;
        return (
          <button key={day}
            style={{ ...sidebarItemBase, ...(isActive ? activeItem : {}) }}
            onClick={() => { setSelectedDay(day); setCustomActive(false); setMobileFilterOpen(false); }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = textPrimary; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textSecondary; } }}
          >
            <span>{getDayLabel(day + 'T00:00:00')}</span>
            <span style={{ background: isActive ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.12)', color: isDark ? '#a5b4fc' : '#4f46e5', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 600 }}>{count}</span>
          </button>
        );
      })}

      {/* Date Range Presets */}
      <span style={{ ...sectionLabel, marginTop: '4px' }}>Date Range</span>
      {(['today', '2days', 'week', 'month', 'all'] as RangePreset[]).map(p => {
        const labels: Record<string, string> = { today: 'Today', '2days': 'Last 2 Days', week: 'This Week', month: 'This Month', all: 'All Time' };
        const isActive = preset === p && !selectedDay && !customActive;
        return (
          <button key={p} style={{ ...sidebarItemBase, ...(isActive ? activeItem : {}) }}
            onClick={() => {
              setPreset(p); setSelectedDay(null); setCustomActive(false); setMobileFilterOpen(false);
              if (p === 'all') ensureRangeFetched(null);
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = textPrimary; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textSecondary; } }}
          >
            {labels[p]}
          </button>
        );
      })}

      {/* Tags */}
      {allTags.length > 0 && (<>
        <span style={{ ...sectionLabel, marginTop: '4px' }}>Filter by Tag</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '2px 4px' }}>
          {allTags.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                color: active ? (isDark ? '#a5b4fc' : '#4f46e5') : textSecondary,
                borderRadius: '20px', padding: '3px 10px', fontSize: '12px',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                {tag}
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <button onClick={() => setSelectedTags([])} style={{
            background: 'none', border: 'none', color: '#818cf8', fontSize: '11px',
            cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px', textDecoration: 'underline',
          }}>
            Clear tags
          </button>
        )}
      </>)}

      {/* Custom Range — redesigned */}
      <span style={{ ...sectionLabel, marginTop: '4px' }}>Custom Range</span>
      <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: customActive
          ? `1px solid ${isDark ? 'rgba(99,102,241,0.5)' : 'rgba(79,70,229,0.35)'}`
          : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        transition: 'border-color 0.2s',
      }}>
        {/* Gradient header strip */}
        <div style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <Calendar size={13} color="rgba(255,255,255,0.85)" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {customActive && customFrom && customTo
              ? `${format(new Date(customFrom), 'MMM d')} → ${format(new Date(customTo), 'MMM d')}`
              : 'Pick a range'}
          </span>
        </div>

        {/* Inputs */}
        <div style={{
          background: isDark ? 'rgba(18,20,28,0.9)' : 'rgba(248,249,252,0.95)',
          padding: '12px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {([['From', customFrom, setCustomFrom], ['To', customTo, setCustomTo]] as const).map(([label, val, setter]) => (
            <div key={label}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? '#a5b4fc' : '#4f46e5', display: 'block', marginBottom: '5px' }}>{label}</span>
              <input type="date" value={val}
                onChange={e => { setter(e.target.value); setCustomActive(false); }}
                style={{
                  width: '100%',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'white',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: '8px', color: textPrimary,
                  fontSize: '13px', padding: '7px 10px', outline: 'none',
                  fontFamily: 'inherit',
                  colorScheme: isDark ? 'dark' : 'light',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <button
            onClick={() => {
              if (customFrom && customTo) {
                setCustomActive(true); setSelectedDay(null); setMobileFilterOpen(false);
                ensureRangeFetched(new Date(customFrom), new Date(new Date(customTo).setHours(23, 59, 59, 999)));
              }
            }}
            disabled={!customFrom || !customTo}
            style={{
              background: (customFrom && customTo)
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              border: 'none', color: (customFrom && customTo) ? 'white' : textMuted,
              borderRadius: '8px', padding: '8px 12px',
              fontSize: '13px', fontWeight: 600,
              cursor: (customFrom && customTo) ? 'pointer' : 'not-allowed',
              width: '100%',
              transition: 'all 0.15s',
              boxShadow: (customFrom && customTo) ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            Apply Range
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
    {/* 2.5vw left offset to clear the fixed DailyTaskTracker strip */}
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)', overflow: 'hidden', paddingLeft: '2.5vw' }}>

      {/* ── Mobile filter drawer overlay ── */}
      {isMobile && mobileFilterOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 800 }} onClick={() => setMobileFilterOpen(false)} />
      )}
      {isMobile && (
        <div style={{
          ...glass,
          position: 'fixed',
          top: 0, bottom: 0,
          left: mobileFilterOpen ? '2.5vw' : '-260px',
          width: '240px',
          zIndex: 801,
          padding: '20px 14px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          overflowY: 'auto',
          transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
          borderRadius: '0 16px 16px 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.text.primary }}>Filter Notes</span>
            <button onClick={() => setMobileFilterOpen(false)} style={{ background: 'none', border: 'none', color: theme.colors.text.muted, cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          {SidebarContent}
        </div>
      )}

      {/* ── Left Sidebar (desktop only) ── */}
      {!isMobile && (
        <div style={{
          ...glass,
          width: '220px',
          flexShrink: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderBottom: 'none',
          borderRadius: 0,
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}>
          {SidebarContent}
        </div>
      )}

      {/* ── Main Content ── */}
      <div style={{ flex: 1, padding: isMobile ? '16px 14px' : '28px 32px', overflowY: 'auto', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mobile filter toggle */}
            {isMobile && (
              <button
                onClick={() => setMobileFilterOpen(true)}
                style={{ ...glass, borderRadius: '10px', padding: '8px 12px', color: textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <SlidersHorizontal size={15} /> Filter
              </button>
            )}
            <div>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: textPrimary, margin: 0 }}>
                Quick Notes
              </h1>
              <p style={{ fontSize: '13px', color: textSecondary, margin: '3px 0 0' }}>
                {subtitleLabel} · {displayNotes.length} {displayNotes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none',
                borderRadius: '10px', padding: '8px 14px', fontSize: '13px',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <Plus size={14} /> Add Quick Note
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                ...glass,
                borderRadius: '10px', padding: '8px 14px', fontSize: '13px',
                color: theme.colors.text.secondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'color 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = theme.colors.text.primary; }}
              onMouseLeave={e => { e.currentTarget.style.color = theme.colors.text.secondary; }}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.1)', color: '#f87171',
            fontSize: '13px', border: '1px solid rgba(239,68,68,0.2)',
          }}>{error}</div>
        )}

        {loading ? (
          <LoadingSpinner size="lg" text="Loading notes..." />
        ) : displayNotes.length === 0 && notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <BookOpen size={40} style={{ color: theme.colors.text.muted, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '16px', fontWeight: 500, color: theme.colors.text.secondary, margin: '0 0 4px' }}>No notes yet</p>
            <p style={{ fontSize: '13px', color: theme.colors.text.muted, margin: 0 }}>Use the button in the bottom-right to add one</p>
          </div>
        ) : displayNotes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px', borderRadius: '16px',
            border: `1px dashed ${theme.colors.surface.glassBorder}`,
          }}>
            <Filter size={28} style={{ color: theme.colors.text.muted, margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: theme.colors.text.secondary, margin: '0 0 8px' }}>No notes match this filter</p>
            <button
              onClick={() => { setSelectedDay(null); setPreset('all'); setCustomActive(false); }}
              style={{ fontSize: '12px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
            gridAutoRows: isMobile ? '220px' : '260px',
            gap: isMobile ? '12px' : '18px',
          }}>
            {displayNotes.map((note, idx) => {
              const createdAt = new Date(note.createdAt);
              const editable = isToday(createdAt) || isYesterday(createdAt);
              return (
                <NoteSquareCard
                  key={note.id}
                  note={note}
                  onDelete={deleteNote}
                  onOpen={() => setSelectedNote(note)}
                  onEdit={editable ? () => setEditingNote(note) : undefined}
                  accentColor={ACCENT_BORDER_COLORS[idx % ACCENT_BORDER_COLORS.length]}
                  isDark={isDark}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* ── Add Note Modal ── */}
    {showAddModal && <QuickNoteAddModal onClose={() => setShowAddModal(false)} />}

    {/* ── Edit Note Modal ── */}
    {editingNote && (
      <QuickNoteEditModal
        note={editingNote}
        onClose={() => {
          // Sync the updated note into selectedNote if it's open
          const updated = useQuickNotesStore.getState().notes.find(n => n.id === editingNote.id);
          if (selectedNote?.id === editingNote.id && updated) setSelectedNote(updated);
          setEditingNote(null);
        }}
      />
    )}

    {/* ── Note Detail Modal ── */}
    {selectedNote && createPortal(
      <NoteDetailModal
        note={selectedNote}
        isDark={isDark}
        onClose={() => setSelectedNote(null)}
        onDelete={async (id) => { await deleteNote(id); setSelectedNote(null); }}
        accentColor={ACCENT_BORDER_COLORS[displayNotes.findIndex(n => n.id === selectedNote.id) % ACCENT_BORDER_COLORS.length]}
      />,
      document.body
    )}
    </>
  );
};

// ── Note Detail Modal ─────────────────────────────────────────────────────────
interface NoteDetailModalProps {
  note: import('../../types').QuickNote;
  isDark: boolean;
  accentColor: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, isDark, accentColor, onClose, onDelete }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return;
    setDeleting(true);
    await onDelete(note.id);
  };

  const textPrimary   = isDark ? '#e2e8f0' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#334155';

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        background: isDark ? 'rgba(15,17,26,0.98)' : 'white',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderTop: `4px solid ${accentColor}`,
        borderRadius: '20px',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, margin: 0, lineHeight: 1.3 }}>
            {note.title}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: isDark ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: '2px', flexShrink: 0, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Meta row */}
        <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: isDark ? '#64748b' : '#94a3b8' }}>
            <Calendar size={12} />
            {format(new Date(note.createdAt), 'EEEE, d MMM yyyy · h:mm a')}
          </div>
          {note.tags && note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {note.tags.map(tag => (
                <span key={tag} style={{ background: 'rgba(99,102,241,0.12)', color: isDark ? '#a5b4fc' : '#4f46e5', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: '8px 24px 24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          <p style={{
            fontSize: '15px', lineHeight: 1.8,
            color: textSecondary,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {note.content}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', borderRadius: '10px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 500, cursor: deleting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Square Note Card ──────────────────────────────────────────────────────────
interface NoteSquareCardProps {
  note: import('../../types').QuickNote;
  onDelete: (id: string) => Promise<void>;
  onOpen: () => void;
  onEdit?: () => void;
  accentColor: string;
  isDark: boolean;
}

const NoteSquareCard: React.FC<NoteSquareCardProps> = ({ note, onDelete, onOpen, onEdit, accentColor, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    setDeleting(true);
    try { await onDelete(note.id); } finally { setDeleting(false); }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const createdAt = new Date(note.createdAt);
  const dateLabel = format(createdAt, 'EEE, d MMM · h:mm a');

  // Derive a soft tinted background from the accent colour
  const cardBg = isDark
    ? `linear-gradient(145deg, rgba(18,20,30,0.9) 0%, rgba(25,28,42,0.85) 100%)`
    : `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,246,255,0.9) 100%)`;

  const glowColor = accentColor + (isDark ? '22' : '18');

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hovered
          ? accentColor + '55'
          : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')}`,
        borderRadius: '20px',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, border-color 0.2s',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,${isDark ? '0.5' : '0.18'}), 0 0 0 1px ${glowColor}, 0 4px 16px ${accentColor}30`
          : `0 2px 12px rgba(0,0,0,${isDark ? '0.3' : '0.08'})`,
        position: 'relative',
      }}
    >
      {/* Accent gradient top strip */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
        flexShrink: 0,
      }} />

      {/* Card body */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Action buttons — visible on hover */}
        <div style={{
          position: 'absolute', top: '14px', right: '12px',
          display: 'flex', gap: '6px',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 0.15s, transform 0.15s',
          pointerEvents: hovered ? 'all' : 'none',
        }}>
          {onEdit && (
            <button
              onClick={handleEdit}
              style={{
                background: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.35)',
                color: '#818cf8', borderRadius: '8px', padding: '4px 10px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                backdropFilter: 'blur(8px)',
              }}
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', borderRadius: '8px', padding: '4px 10px',
              fontSize: '11px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              backdropFilter: 'blur(8px)',
            }}
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>

        {/* Title */}
        <div style={{
          fontSize: '15px', fontWeight: 700,
          color: isDark ? '#f1f5f9' : '#0f172a',
          marginBottom: '10px', lineHeight: 1.3,
          paddingRight: hovered ? '110px' : '0',
          transition: 'padding 0.15s',
          letterSpacing: '-0.01em',
        }}>
          {note.title}
        </div>

        {/* Content with fade */}
        <div style={{
          fontSize: '13px', color: isDark ? '#94a3b8' : '#475569',
          lineHeight: 1.65, flex: 1, overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
        }}>
          {note.content}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '12px', paddingTop: '10px',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          flexShrink: 0,
        }}>
          {/* Tags row */}
          {note.tags && note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {note.tags.map(tag => (
                <span key={tag} style={{
                  background: accentColor + '1a',
                  border: `1px solid ${accentColor}40`,
                  color: accentColor,
                  borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>{tag}</span>
              ))}
            </div>
          )}
          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: isDark ? '#475569' : '#94a3b8' }}>
            <Calendar size={10} style={{ flexShrink: 0 }} />
            {dateLabel}
          </div>
        </div>
      </div>
    </div>
  );
};
