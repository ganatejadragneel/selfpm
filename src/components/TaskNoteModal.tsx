import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import { theme } from '../styles/theme';
import { X, Save, Trash2, StickyNote } from 'lucide-react';
import { format } from 'date-fns/format';
import { formatLocalDateString } from '../utils/dateUtils';
import type { BaseModalProps } from '../types';

interface TaskNoteModalProps extends BaseModalProps {
  taskId: string;
  taskName: string;
  date: Date;
  existingNote?: string;
  onNoteSaved: (noteText: string | null) => void;
}

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskName,
  date,
  existingNote = '',
  onNoteSaved
}) => {
  const { user } = useSupabaseAuthStore();
  const [noteText, setNoteText] = useState(existingNote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNoteText(existingNote);
    setError(null);
  }, [existingNote, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = formatLocalDateString(date);
      
      if (noteText.trim()) {
        // Save or update note
        const { error: upsertError } = await supabase
          .from('daily_task_notes')
          .upsert({
            custom_task_id: taskId,
            new_user_id: user.id,
            note_date: dateStr,
            note_text: noteText.trim()
          }, {
            onConflict: 'custom_task_id,new_user_id,note_date'
          });

        if (upsertError) throw upsertError;
        onNoteSaved(noteText.trim());
      } else {
        // Delete note if empty
        await handleDelete();
        return;
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = formatLocalDateString(date);
      
      const { error: deleteError } = await supabase
        .from('daily_task_notes')
        .delete()
        .eq('custom_task_id', taskId)
        .eq('new_user_id', user.id)
        .eq('note_date', dateStr);

      if (deleteError) throw deleteError;
      
      onNoteSaved(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  const remainingChars = 200 - noteText.length;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '20px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
      }} onKeyDown={handleKeyDown}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: theme.borderRadius.lg,
              background: theme.colors.primary.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <StickyNote size={20} color="white" />
            </div>
            <div>
              <h3 style={{
                fontSize: theme.typography.sizes.lg,
                fontWeight: theme.typography.weights.bold,
                margin: 0,
                color: theme.colors.text.primary,
              }}>
                {existingNote ? 'Edit Note' : 'Add Note'}
              </h3>
              <p style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text.secondary,
                margin: 0,
              }}>
                {taskName} • {format(date, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={20} style={{ color: '#ef4444' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.semibold,
              color: theme.colors.text.primary,
              marginBottom: '8px',
            }}>
              Your note for this task
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value.slice(0, 200))}
              placeholder="Add your thoughts, reasons, or reflections about this task..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '16px',
                border: `2px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.sizes.base,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                background: 'rgba(248, 250, 252, 0.5)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.primary.light;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border.light;
              }}
              autoFocus
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
            }}>
              <div style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text.secondary,
              }}>
                Ctrl/Cmd + Enter to save
              </div>
              <div style={{
                fontSize: theme.typography.sizes.xs,
                color: remainingChars < 20 ? '#ef4444' : theme.colors.text.secondary,
                fontWeight: remainingChars < 20 ? 'bold' : 'normal',
              }}>
                {remainingChars} characters remaining
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: theme.borderRadius.md,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              fontSize: theme.typography.sizes.sm,
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            {existingNote && (
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: theme.borderRadius.md,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.medium,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: 'rgba(107, 114, 128, 0.1)',
                color: theme.colors.text.secondary,
                border: '1px solid rgba(107, 114, 128, 0.2)',
                borderRadius: theme.borderRadius.md,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.medium,
                transition: 'all 0.2s ease',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || noteText.length === 0}
              style={{
                padding: '12px 24px',
                background: loading || noteText.length === 0 
                  ? 'rgba(107, 114, 128, 0.2)' 
                  : theme.colors.primary.gradient,
                color: loading || noteText.length === 0 ? theme.colors.text.muted : 'white',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: loading || noteText.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.semibold,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: loading || noteText.length === 0 
                  ? 'none' 
                  : '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>,
    document.body
  );
};