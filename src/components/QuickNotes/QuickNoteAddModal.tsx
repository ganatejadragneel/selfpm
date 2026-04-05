import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Tag, Send } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useQuickNotesStore } from '../../store/quickNotesStore';
import { SpeechToTextButton } from '../SpeechToTextButton';

const MAX_CONTENT_LENGTH = 5000;

interface QuickNoteAddModalProps {
  onClose: () => void;
}

export const QuickNoteAddModal: React.FC<QuickNoteAddModalProps> = ({ onClose }) => {
  const theme = useThemeColors();
  const { notes, createNote } = useQuickNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const isDark = theme.currentTheme === 'dark';

  const existingTags = [...new Set(notes.flatMap(n => n.tags))];
  const tagSuggestions = existingTags.filter(
    t => t.includes(tagInput.toLowerCase()) && !tags.includes(t) && tagInput.length > 0
  ).slice(0, 4);

  const canSave = title.trim().length > 0 && content.trim().length > 0 &&
    content.length <= MAX_CONTENT_LENGTH && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createNote(title.trim(), content.trim(), tags);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSave) {
      e.preventDefault();
      handleSave();
    }
  };

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !tags.includes(normalized)) setTags([...tags, normalized]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(tagInput.trim()); }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags(tags.slice(0, -1));
  };

  const glassBase: React.CSSProperties = {
    background: isDark ? 'rgba(18,20,28,0.92)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.surface.glassBorder}`,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${theme.colors.surface.glassBorder}`,
    borderRadius: '10px',
    color: theme.colors.text.primary,
    fontSize: '14px',
    padding: '10px 14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'none' as const,
    transition: 'border-color 0.15s',
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        style={{
          ...glassBase,
          borderRadius: '20px',
          padding: '28px',
          width: '480px',
          maxWidth: '95vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, color: theme.colors.text.primary }}>
            <Sparkles size={18} color="#8b5cf6" />
            New Quick Note
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.colors.text.muted, cursor: 'pointer', display: 'flex', padding: '2px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.text.muted, marginBottom: '6px' }}>Title</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your note a title…"
            style={inputStyle}
          />
        </div>

        {/* Content */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.text.muted }}>Content</label>
            <SpeechToTextButton onTranscription={(text: string) => setContent(prev => prev ? prev + ' ' + text : text)} />
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
          />
          {content.length > MAX_CONTENT_LENGTH * 0.8 && (
            <div style={{ fontSize: '11px', color: content.length > MAX_CONTENT_LENGTH ? '#ef4444' : '#f59e0b', marginTop: '4px', textAlign: 'right' }}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.text.muted, marginBottom: '6px' }}>Tags</label>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            ...inputStyle, minHeight: '42px', padding: '6px 10px',
          }}>
            {tags.map(tag => (
              <span key={tag} style={{
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', borderRadius: '20px', padding: '2px 8px', fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <Tag size={10} />{tag}
                <span onClick={() => setTags(tags.filter(t => t !== tag))} style={{ cursor: 'pointer', opacity: 0.7 }}>×</span>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: theme.colors.text.primary, fontSize: '13px', minWidth: '120px', flex: 1 }}
            />
          </div>
          {tagSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              ...glassBase, borderRadius: '10px', marginTop: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}>
              {tagSuggestions.map(s => (
                <div key={s} onClick={() => addTag(s)} style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                  color: theme.colors.text.secondary,
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${theme.colors.surface.glassBorder}`,
            color: theme.colors.text.secondary, borderRadius: '10px',
            padding: '9px 18px', fontSize: '14px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{
            background: canSave ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.3)',
            border: 'none', color: 'white', borderRadius: '10px',
            padding: '9px 20px', fontSize: '14px', fontWeight: 500,
            cursor: canSave ? 'pointer' : 'not-allowed',
            boxShadow: canSave ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Send size={14} />
            {saving ? 'Saving…' : 'Save Note'}
            {canSave && <span style={{ opacity: 0.7, fontSize: '12px' }}>⌘↵</span>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
