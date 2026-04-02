import React, { useEffect, useMemo, useState } from 'react';
import { FileText, BookOpen, Tag, Calendar, Filter } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useResponsive } from '../../hooks/useResponsive';
import { useQuickNotesStore } from '../../store/quickNotesStore';
import { LoadingSpinner } from '../ui';
import { QuickNoteForm } from './QuickNoteForm';
import { QuickNoteCard } from './QuickNoteCard';

const DATE_FILTERS: { key: DateFilter; label: string; icon?: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: '2days', label: 'Last 2 Days' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

function getDateThreshold(filter: DateFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '2days': return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

export const QuickNotesPage: React.FC = () => {
  const theme = useThemeColors();
  const { isMobile } = useResponsive();
  const { notes, loading, error, fetchNotes, createNote, deleteNote } = useQuickNotesStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const isDark = theme.currentTheme === 'dark';

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter notes by tag and date
  const displayNotes = useMemo(() => {
    let filtered = notes;
    if (selectedTag) {
      filtered = filtered.filter(n => n.tags?.includes(selectedTag));
    }
    const threshold = getDateThreshold(dateFilter);
    if (threshold) {
      filtered = filtered.filter(n => new Date(n.createdAt) >= threshold);
    }
    return filtered;
  }, [notes, selectedTag, dateFilter]);

  // Sidebar glass style
  const sidebarStyle: React.CSSProperties = {
    background: isDark ? 'rgba(22, 27, 34, 0.7)' : 'rgba(255, 255, 255, 0.22)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)'}`,
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
    padding: '16px',
  };

  const sidebarLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '700',
    color: isDark ? '#8b949e' : '#1e293b',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '20px 16px' : '32px 24px',
    }}>
      {/* Hero Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          backgroundImage: theme.colors.primary.gradient,
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(102, 126, 234, 0.35)',
          flexShrink: 0,
        }}>
          <FileText className="w-6 h-6" style={{ color: 'white' }} />
        </div>
        <div>
          <h2 style={{
            fontSize: isMobile ? '24px' : '28px',
            fontWeight: '700',
            color: 'white',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Quick Notes
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '2px 0 0',
            letterSpacing: '0.01em',
          }}>
            Capture reflections, insights, and observations
          </p>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: '180px 1fr 180px',
        gap: '20px',
        flexDirection: 'column',
      }}>
        {/* Left sidebar — Tags */}
        <div style={{ order: isMobile ? 1 : 0 }}>
          <div style={sidebarStyle}>
            <div style={sidebarLabelStyle}>
              <Tag className="w-3 h-3" />
              Tags
            </div>
            {allTags.length === 0 ? (
              <p style={{ fontSize: '12px', color: isDark ? '#6e7681' : '#475569', margin: 0 }}>
                No tags yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* All tags button */}
                <button
                  onClick={() => setSelectedTag(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    fontSize: '12px',
                    fontWeight: selectedTag === null ? '600' : '400',
                    fontFamily: 'inherit',
                    color: selectedTag === null
                      ? (isDark ? '#e6edf3' : '#0f172a')
                      : (isDark ? '#8b949e' : '#334155'),
                    background: selectedTag === null
                      ? (isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.3)')
                      : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>All</span>
                  <span style={{
                    fontSize: '10px',
                    opacity: 0.6,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {notes.length}
                  </span>
                </button>
                {allTags.map(tag => {
                  const count = notes.filter(n => n.tags?.includes(tag)).length;
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isActive ? null : tag)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        fontSize: '12px',
                        fontWeight: isActive ? '600' : '400',
                        fontFamily: 'inherit',
                        color: isActive
                          ? (isDark ? '#e6edf3' : 'white')
                          : (isDark ? '#8b949e' : 'rgba(255,255,255,0.7)'),
                        background: isActive
                          ? (isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255,255,255,0.2)')
                          : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{tag}</span>
                      <span style={{
                        fontSize: '10px',
                        opacity: 0.6,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center — Form + Notes */}
        <div>
          {/* Form */}
          <div style={{ marginBottom: '32px' }}>
            <QuickNoteForm
              onSave={createNote}
              existingTags={allTags}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '12px',
              background: theme.colors.status.error.light,
              color: theme.colors.status.error.dark,
              fontSize: '13px',
              border: `1px solid ${theme.colors.status.error.medium}`,
            }}>
              {error}
            </div>
          )}

          {/* Section header */}
          {!loading && displayNotes.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: isDark ? '#8b949e' : 'rgba(255,255,255,0.85)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Your Notes
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: isDark ? '#c9d1d9' : 'white',
                background: isDark ? 'rgba(102, 126, 234, 0.25)' : 'rgba(255,255,255,0.25)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                {displayNotes.length}
              </span>
              {(selectedTag || dateFilter !== 'all') && (
                <button
                  onClick={() => { setSelectedTag(null); setDateFilter('all'); }}
                  style={{
                    fontSize: '11px',
                    color: isDark ? '#58a6ff' : 'white',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Notes grid */}
          {loading ? (
            <LoadingSpinner size="lg" text="Loading notes..." />
          ) : displayNotes.length === 0 && notes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BookOpen className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: 'rgba(255,255,255,0.8)',
                margin: '0 0 4px',
              }}>
                No notes yet
              </p>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
              }}>
                Start capturing your thoughts above
              </p>
            </div>
          ) : displayNotes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: isDark ? 'rgba(22, 27, 34, 0.5)' : 'rgba(255,255,255,0.15)',
              borderRadius: '16px',
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}`,
            }}>
              <Filter className="w-6 h-6" style={{
                color: isDark ? '#6e7681' : 'rgba(255,255,255,0.6)',
                margin: '0 auto 8px',
              }} />
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? '#8b949e' : 'rgba(255,255,255,0.8)',
                margin: '0 0 4px',
              }}>
                No notes match your filters
              </p>
              <button
                onClick={() => { setSelectedTag(null); setDateFilter('all'); }}
                style={{
                  fontSize: '12px',
                  color: isDark ? '#58a6ff' : 'white',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {displayNotes.map((note, idx) => (
                <QuickNoteCard
                  key={note.id}
                  note={note}
                  onDelete={deleteNote}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar — Date Filters */}
        <div style={{ order: isMobile ? 2 : 0 }}>
          <div style={sidebarStyle}>
            <div style={sidebarLabelStyle}>
              <Calendar className="w-3 h-3" />
              When
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {DATE_FILTERS.map(f => {
                const isActive = dateFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setDateFilter(isActive ? 'all' : f.key)}
                    style={{
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '400',
                      fontFamily: 'inherit',
                      color: isActive
                        ? (isDark ? '#e6edf3' : 'white')
                        : (isDark ? '#8b949e' : 'rgba(255,255,255,0.7)'),
                      background: isActive
                        ? (isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255,255,255,0.2)')
                        : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
