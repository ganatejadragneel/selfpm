import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { QuickNote } from '../../types';

interface QuickNoteCardProps {
  note: QuickNote;
  onDelete: (id: string) => Promise<void>;
}

export const QuickNoteCard: React.FC<QuickNoteCardProps> = ({ note, onDelete }) => {
  const theme = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

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

  const formattedDate = format(new Date(note.createdAt), 'MMM d, yyyy h:mm a');

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${hovered ? theme.colors.primary.medium : theme.colors.surface.glassBorder}`,
        boxShadow: hovered ? theme.effects.shadow.md : theme.effects.shadow.sm,
        padding: theme.spacing.lg,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm, flex: 1, minWidth: 0 }}>
          {expanded
            ? <ChevronDown className="w-4 h-4" style={{ color: theme.colors.primary.dark, marginTop: '2px', flexShrink: 0 }} />
            : <ChevronRight className="w-4 h-4" style={{ color: theme.colors.text.muted, marginTop: '2px', flexShrink: 0 }} />
          }
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{
              fontSize: theme.typography.sizes.lg,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: expanded ? 'normal' : 'nowrap',
            }}>
              {note.title}
            </h3>
            <span style={{
              fontSize: theme.typography.sizes.xs,
              color: theme.colors.text.muted,
            }}>
              {formattedDate}
            </span>
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
              padding: theme.spacing.xs,
              color: theme.colors.status.error.dark,
              opacity: deleting ? 0.5 : 0.7,
              flexShrink: 0,
            }}
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div style={{
          marginTop: theme.spacing.md,
          paddingTop: theme.spacing.md,
          borderTop: `1px solid ${theme.colors.border.light}`,
          fontSize: theme.typography.sizes.base,
          color: theme.colors.text.secondary,
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {note.content}
        </div>
      )}
    </div>
  );
};
