import React, { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useResponsive } from '../../hooks/useResponsive';
import { useQuickNotesStore } from '../../store/quickNotesStore';
import { LoadingSpinner } from '../ui';
import { QuickNoteForm } from './QuickNoteForm';
import { QuickNoteCard } from './QuickNoteCard';

export const QuickNotesPage: React.FC = () => {
  const theme = useThemeColors();
  const { isMobile } = useResponsive();
  const { notes, loading, error, fetchNotes, createNote, deleteNote } = useQuickNotesStore();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: isMobile ? '16px 12px' : '24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing['2xl'],
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundImage: theme.colors.primary.gradient,
          borderRadius: theme.borderRadius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        }}>
          <FileText className="w-5 h-5" style={{ color: 'white' }} />
        </div>
        <div>
          <h2 style={{
            fontSize: theme.typography.sizes['3xl'],
            fontWeight: theme.typography.weights.bold,
            color: 'white',
            margin: 0,
          }}>
            Quick Notes
          </h2>
          <p style={{
            fontSize: theme.typography.sizes.sm,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}>
            Capture reflections, insights, and observations
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <QuickNoteForm onSave={createNote} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderRadius: theme.borderRadius.md,
          background: theme.colors.status.error.light,
          color: theme.colors.status.error.dark,
          fontSize: theme.typography.sizes.sm,
        }}>
          {error}
        </div>
      )}

      {/* Notes List */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading notes..." />
      ) : notes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['4xl'],
          color: theme.colors.text.muted,
          fontSize: theme.typography.sizes.lg,
        }}>
          No notes yet. Write your first one above!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: theme.spacing.lg,
        }}>
          {notes.map(note => (
            <QuickNoteCard key={note.id} note={note} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </div>
  );
};
