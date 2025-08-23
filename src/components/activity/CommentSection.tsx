import React, { useState } from 'react';
import { Send, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { theme } from '../../styles/theme';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import type { TaskComment } from '../../types';

interface CommentSectionProps {
  taskId: string;
  comments: TaskComment[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId, comments }) => {
  const { addComment, editComment, deleteComment } = useTaskStore();
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment(taskId, newComment.trim());
      setNewComment('');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (editContent.trim()) {
      await editComment(commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId === commentId) {
      await deleteComment(commentId);
      setDeletingCommentId(null);
    } else {
      setDeletingCommentId(commentId);
      setTimeout(() => setDeletingCommentId(null), 3000);
    }
  };

  const startEdit = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  return (
    <div>
      {/* Add Comment Form */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: theme.borderRadius.full,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'white',
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.bold
        }}>
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>

        <div style={{ flex: 1 }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              width: '100%',
              minHeight: '80px',
              border: `2px solid ${theme.colors.surface.glassBorder}`,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              fontSize: theme.typography.sizes.sm,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: theme.effects.blur,
              color: theme.colors.text.primary,
              outline: 'none',
              resize: 'vertical',
              lineHeight: '1.5',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary.dark;
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.surface.glassBorder;
              e.currentTarget.style.boxShadow = 'none';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleAddComment();
              }
            }}
          />
          
          {newComment.trim() && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: theme.spacing.sm
            }}>
              <button
                onClick={handleAddComment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: theme.typography.sizes.sm,
                  fontWeight: theme.typography.weights.semibold,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Send className="w-4 h-4" />
                Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg
      }}>
        {comments?.map(comment => (
          <div
            key={comment.id}
            style={{
              display: 'flex',
              gap: theme.spacing.md
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: theme.borderRadius.full,
              background: 'rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: theme.colors.primary.dark,
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.bold,
              border: `2px solid rgba(102, 126, 234, 0.2)`
            }}>
              {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: theme.effects.blur,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.surface.glassBorder}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: theme.spacing.sm
                }}>
                  <div>
                    <span style={{
                      fontSize: theme.typography.sizes.sm,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.text.primary
                    }}>
                      {comment.user?.username || 'Unknown User'}
                    </span>
                    <span style={{
                      fontSize: theme.typography.sizes.xs,
                      color: theme.colors.text.muted,
                      marginLeft: theme.spacing.sm
                    }}>
                      {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      {comment.isEdited && ' (edited)'}
                    </span>
                  </div>

                  {comment.userId === user?.id && (
                    <div style={{
                      display: 'flex',
                      gap: theme.spacing.xs
                    }}>
                      <button
                        onClick={() => startEdit(comment)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.colors.text.muted,
                          transition: 'all 0.2s ease'
                        }}
                        title="Edit comment"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                          e.currentTarget.style.color = theme.colors.primary.dark;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = theme.colors.text.muted;
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: 'none',
                          background: deletingCommentId === comment.id 
                            ? theme.colors.status.error.dark 
                            : 'transparent',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: deletingCommentId === comment.id 
                            ? 'white' 
                            : theme.colors.text.muted,
                          transition: 'all 0.2s ease'
                        }}
                        title={deletingCommentId === comment.id ? 'Click again to confirm' : 'Delete comment'}
                        onMouseEnter={(e) => {
                          if (deletingCommentId !== comment.id) {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = theme.colors.status.error.dark;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deletingCommentId !== comment.id) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = theme.colors.text.muted;
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        border: `2px solid ${theme.colors.primary.dark}`,
                        borderRadius: theme.borderRadius.sm,
                        padding: theme.spacing.sm,
                        fontSize: theme.typography.sizes.sm,
                        background: 'white',
                        color: theme.colors.text.primary,
                        outline: 'none',
                        resize: 'vertical',
                        lineHeight: '1.5',
                        boxSizing: 'border-box'
                      }}
                      autoFocus
                    />
                    <div style={{
                      display: 'flex',
                      gap: theme.spacing.sm,
                      marginTop: theme.spacing.sm
                    }}>
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                          background: theme.colors.primary.dark,
                          color: 'white',
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.sizes.xs,
                          fontWeight: theme.typography.weights.semibold
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                          background: 'transparent',
                          color: theme.colors.text.secondary,
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.sizes.xs,
                          fontWeight: theme.typography.weights.medium
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    fontSize: theme.typography.sizes.sm,
                    color: theme.colors.text.primary,
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {comment.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!comments || comments.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.text.muted,
            fontSize: theme.typography.sizes.sm,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.md
          }}>
            <MessageSquare className="w-8 h-8" style={{ opacity: 0.3 }} />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};