import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Button, Input, Textarea } from '../ui';
import { SpeechToTextButton } from '../SpeechToTextButton';

const MAX_CONTENT_LENGTH = 5000;

interface QuickNoteFormProps {
  onSave: (title: string, content: string) => Promise<void>;
}

export const QuickNoteForm: React.FC<QuickNoteFormProps> = ({ onSave }) => {
  const theme = useThemeColors();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const isOverLimit = content.length > MAX_CONTENT_LENGTH;
  const canSave = title.trim().length > 0 && content.trim().length > 0 && !isOverLimit && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(title.trim(), content.trim());
      setTitle('');
      setContent('');
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

  const handleTranscription = (text: string) => {
    setContent(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <div
      style={{
        background: theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderRadius: theme.borderRadius.xl,
        border: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.md,
        padding: theme.spacing['3xl'],
      }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ marginBottom: theme.spacing.lg }}>
        <Input
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="lg"
        />
      </div>

      <div style={{ position: 'relative', marginBottom: theme.spacing.md }}>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          minRows={6}
          style={{ paddingRight: '56px' }}
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <SpeechToTextButton onTranscription={handleTranscription} size="sm" />
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: theme.typography.sizes.sm,
          color: isOverLimit ? theme.colors.status.error.dark : theme.colors.text.muted,
          fontWeight: isOverLimit ? theme.typography.weights.semibold : theme.typography.weights.normal,
        }}>
          {content.length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
        </span>

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!canSave}
          loading={saving}
          icon={<Save className="w-4 h-4" />}
        >
          Save Note
        </Button>
      </div>
    </div>
  );
};
