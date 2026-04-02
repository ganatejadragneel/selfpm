import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { QuickNote } from '../../types';

// Rotating accent colors for visual variety
const ACCENT_COLORS = [
  { bar: '#667eea', tag: 'rgba(102, 126, 234, 0.15)' },
  { bar: '#764ba2', tag: 'rgba(118, 75, 162, 0.15)' },
  { bar: '#f093fb', tag: 'rgba(240, 147, 251, 0.15)' },
  { bar: '#4facfe', tag: 'rgba(79, 172, 254, 0.15)' },
  { bar: '#43e97b', tag: 'rgba(67, 233, 123, 0.15)' },
  { bar: '#fa709a', tag: 'rgba(250, 112, 154, 0.15)' },
];

interface QuickNoteCardProps {
  note: QuickNote;
  onDelete: (id: string) => Promise<void>;
  index?: number;
}

export const QuickNoteCard: React.FC<QuickNoteCardProps> = ({ note, onDelete, index = 0 }) => {
  const theme = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const isDark = theme.currentTheme === 'dark';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    setDeleting(true);
    try {
      await onDelete(note.id);
    } finally {
      setDeleting(false);
    }
  };

  const createdDate = new Date(note.createdAt);
  const relativeTime = formatDistanceToNow(createdDate, { addSuffix: true });
  const fullDate = format(createdDate, 'MMM d, yyyy h:mm a');

  // Show first ~120 chars as preview when collapsed
  const contentPreview = note.content.length > 120
    ? note.content.slice(0, 120).trimEnd() + '...'
    : note.content;

  return (
    <div
      className="note-card-enter"
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isDark
          ? (hovered ? 'rgba(30, 35, 44, 0.8)' : 'rgba(24, 29, 37, 0.7)')
          : (hovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.22)'),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: `1px solid ${hovered
          ? accent.bar + '40'
          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)'}`,
        boxShadow: hovered
          ? `0 8px 28px rgba(0,0,0,${isDark ? '0.4' : '0.1'}), 0 0 0 1px ${accent.bar}15`
          : `0 2px 12px rgba(0,0,0,${isDark ? '0.3' : '0.05'})`,
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* Accent bar */}
      <div style={{
        width: hovered ? '5px' : '4px',
        flexShrink: 0,
        background: accent.bar,
        transition: 'width 0.2s ease',
      }} />

      <div style={{ flex: 1, padding: '16px' }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{
              marginTop: '3px',
              flexShrink: 0,
              color: expanded ? accent.bar : (isDark ? '#8b949e' : '#475569'),
              transition: 'color 0.2s ease',
            }}>
              {expanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />
              }
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: isDark ? '#e6edf3' : '#0f172a',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: expanded ? 'normal' : 'nowrap',
                letterSpacing: '-0.01em',
              }}>
                {note.title}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
              }}>
                <Clock className="w-3 h-3" style={{ color: isDark ? '#6e7681' : '#334155' }} />
                <span
                  style={{
                    fontSize: '11px',
                    color: isDark ? '#6e7681' : '#334155',
                  }}
                  title={fullDate}
                >
                  {relativeTime}
                </span>
              </div>
            </div>
          </div>

          {hovered && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                background: 'none',
                border: 'none',
                cursor: deleting ? 'not-allowed' : 'pointer',
                padding: '4px',
                color: theme.colors.status.error.dark,
                opacity: deleting ? 0.5 : 0.6,
                flexShrink: 0,
                borderRadius: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = theme.colors.status.error.light; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'none'; }}
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '8px',
          }}>
            {note.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '10px',
                fontWeight: '500',
                color: accent.bar,
                background: accent.tag,
                padding: '2px 8px',
                borderRadius: '10px',
                letterSpacing: '0.02em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content preview (collapsed) */}
        {!expanded && (
          <p style={{
            marginTop: '8px',
            fontSize: '13px',
            color: isDark ? '#8b949e' : '#1e293b',
            lineHeight: '1.5',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {contentPreview}
          </p>
        )}

        {/* Full content (expanded) */}
        {expanded && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            fontSize: '14px',
            color: isDark ? '#c9d1d9' : '#1e293b',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {note.content}
          </div>
        )}
      </div>
    </div>
  );
};
