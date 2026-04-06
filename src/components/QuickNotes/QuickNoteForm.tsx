import React, { useState } from 'react';
import { Send, Sparkles, X, Tag, Plus } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Button } from '../ui';
import { SpeechToTextButton } from '../SpeechToTextButton';

const MAX_CONTENT_LENGTH = 5000;

interface QuickNoteFormProps {
  onSave: (title: string, content: string, tags?: string[]) => Promise<void>;
  existingTags?: string[];
}

export const QuickNoteForm: React.FC<QuickNoteFormProps> = ({ onSave, existingTags = [] }) => {
  const theme = useThemeColors();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDark = theme.currentTheme === 'dark';

  const isOverLimit = content.length > MAX_CONTENT_LENGTH;
  const canSave = title.trim().length > 0 && content.trim().length > 0 && !isOverLimit && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    // Flush any uncommitted tag text (typed but not confirmed with Enter)
    const finalTags = tagInput.trim()
      ? [...new Set([...tags, tagInput.trim().toLowerCase()])]
      : tags;
    try {
      await onSave(title.trim(), content.trim(), finalTags);
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !tags.includes(normalized)) {
      setTags([...tags, normalized]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTranscription = (text: string) => {
    setContent(prev => prev ? `${prev} ${text}` : text);
  };

  const charPercent = Math.min((content.length / MAX_CONTENT_LENGTH) * 100, 100);

  // Filter suggestions based on input
  const filteredSuggestions = existingTags
    .filter(t => !tags.includes(t) && t.includes(tagInput.toLowerCase()))
    .slice(0, 5);

  const inputBg = isDark ? 'rgba(13, 17, 23, 0.6)' : 'rgba(255, 255, 255, 0.45)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const inputFocusBorder = isDark ? 'rgba(102, 126, 234, 0.6)' : 'rgba(102, 126, 234, 0.5)';
  const inputText = isDark ? '#e6edf3' : '#1e293b';
  const placeholderColor = isDark ? '#6e7681' : '#475569';

  return (
    <div
      className="note-form-glow"
      style={{
        background: isDark
          ? 'rgba(22, 27, 34, 0.75)'
          : 'rgba(255, 255, 255, 0.22)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '18px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'}`,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.3)',
        padding: '24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Form header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '18px',
      }}>
        <Sparkles className="w-4 h-4" style={{ color: isDark ? '#8b949e' : '#1e293b' }} />
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: isDark ? '#8b949e' : '#1e293b',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          New Note
        </span>
      </div>

      {/* Title input */}
      <div style={{ marginBottom: '12px' }}>
        <input
          placeholder="Give it a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 16px',
            fontSize: '15px',
            fontWeight: '500',
            fontFamily: 'inherit',
            color: inputText,
            background: inputBg,
            border: `1.5px solid ${inputBorder}`,
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.08)`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Tag input area */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        marginBottom: '12px',
        background: inputBg,
        border: `1.5px solid ${inputBorder}`,
        borderRadius: '12px',
        minHeight: '38px',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}>
        <Tag className="w-3.5 h-3.5" style={{ color: placeholderColor, flexShrink: 0 }} />
        {tags.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '500',
            color: isDark ? '#c9d1d9' : '#1e293b',
            background: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.4)',
            padding: '3px 8px',
            borderRadius: '8px',
          }}>
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                color: 'inherit',
                opacity: 0.6,
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          value={tagInput}
          onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
          onKeyDown={handleTagKeyDown}
          onFocus={() => setShowTagSuggestions(true)}
          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
          style={{
            flex: '1 1 60px',
            minWidth: '60px',
            padding: '4px 0',
            fontSize: '12px',
            fontFamily: 'inherit',
            color: inputText,
            background: 'transparent',
            border: 'none',
            outline: 'none',
          }}
        />

        {/* Tag suggestions dropdown */}
        {showTagSuggestions && filteredSuggestions.length > 0 && tagInput && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: isDark ? 'rgba(22, 27, 34, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            borderRadius: '10px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: `0 8px 24px rgba(0,0,0,${isDark ? '0.4' : '0.12'})`,
            zIndex: 10,
            overflow: 'hidden',
          }}>
            {filteredSuggestions.map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: inputText,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Plus className="w-3 h-3" style={{ color: placeholderColor }} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content textarea */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <textarea
          placeholder="What's on your mind? Write freely..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 56px 14px 16px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: inputText,
            background: inputBg,
            border: `1.5px solid ${inputBorder}`,
            borderRadius: '12px',
            outline: 'none',
            resize: 'vertical',
            minHeight: '120px',
            lineHeight: '1.6',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = inputFocusBorder; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.08)`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <SpeechToTextButton onTranscription={handleTranscription} size="sm" />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Character progress bar */}
          <div style={{
            width: '40px',
            height: '3px',
            borderRadius: '2px',
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${charPercent}%`,
              height: '100%',
              borderRadius: '2px',
              background: isOverLimit
                ? theme.colors.status.error.dark
                : charPercent > 80
                  ? theme.colors.status.warning.dark
                  : theme.colors.primary.dark,
              transition: 'width 0.2s ease, background 0.2s ease',
            }} />
          </div>
          <span style={{
            fontSize: '11px',
            color: isOverLimit
              ? theme.colors.status.error.dark
              : isDark ? '#6e7681' : '#334155',
            fontWeight: isOverLimit ? '600' : '400',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {content.length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            color: isDark ? '#6e7681' : '#334155',
            opacity: canSave ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
          </span>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
            loading={saving}
            icon={<Send className="w-4 h-4" />}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
