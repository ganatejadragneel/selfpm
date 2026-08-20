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
      className="note-card-enter flex overflow-hidden cursor-pointer"
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
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Accent bar */}
      <div style={{
        width: hovered ? '5px' : '4px',
        flexShrink: 0,
        background: accent.bar,
        transition: 'width 0.2s ease',
      }} />

      <div className="flex-1 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div
              className="mt-[3px] shrink-0"
              style={{
                color: expanded ? accent.bar : (isDark ? '#8b949e' : '#475569'),
                transition: 'color 0.2s ease',
              }}
            >
              {expanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[15px] font-semibold m-0 overflow-hidden text-ellipsis tracking-[-0.01em]"
                style={{
                  color: isDark ? '#e6edf3' : '#0f172a',
                  whiteSpace: expanded ? 'normal' : 'nowrap',
                }}
              >
                {note.title}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" style={{ color: isDark ? '#6e7681' : '#334155' }} />
                <span
                  className="text-[11px]"
                  style={{ color: isDark ? '#6e7681' : '#334155' }}
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
              className="p-1 shrink-0 rounded-[6px] transition-all duration-[150ms]"
              style={{
                background: 'none',
                border: 'none',
                cursor: deleting ? 'not-allowed' : 'pointer',
                color: theme.colors.status.error.dark,
                opacity: deleting ? 0.5 : 0.6,
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
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-medium py-0.5 px-2 rounded-[10px] tracking-[0.02em]"
                style={{ color: accent.bar, background: accent.tag }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content preview (collapsed) */}
        {!expanded && (
          <p
            className="mt-2 text-[13px] leading-[1.5] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
            style={{ color: isDark ? '#8b949e' : '#1e293b' }}
          >
            {contentPreview}
          </p>
        )}

        {/* Full content (expanded) */}
        {expanded && (
          <div
            className="mt-3 pt-3 text-[14px] leading-[1.7] whitespace-pre-wrap break-words"
            style={{
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              color: isDark ? '#c9d1d9' : '#1e293b',
            }}
          >
            {note.content}
          </div>
        )}
      </div>
    </div>
  );
};
