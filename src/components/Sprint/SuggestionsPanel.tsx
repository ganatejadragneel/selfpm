import React from 'react';
import { Clock } from 'lucide-react';
import type { SprintSuggestion } from '../../types/sprint';

interface SuggestionsPanelProps {
  suggestions: SprintSuggestion[];
  currentMetricNames: string[];
  onSelect: (suggestion: SprintSuggestion) => void;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  sleep: '#6366f1',
  boolean: '#22c55e',
  duration: '#f59e0b',
};

const TYPE_LABELS: Record<string, string> = {
  sleep: 'Time of Day',
  boolean: 'Boolean',
  duration: 'Duration',
};

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  suggestions,
  currentMetricNames,
  onSelect,
}) => {
  if (!suggestions.length) return null;

  const currentNamesLower = currentMetricNames.map(n => n.toLowerCase());

  return (
    <div style={{
      minWidth: 220, maxWidth: 260,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '12px', padding: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Suggestions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {suggestions.map(s => {
          const alreadyAdded = currentNamesLower.includes(s.name.toLowerCase());
          return (
            <button
              key={s.name}
              onClick={() => !alreadyAdded && onSelect(s)}
              disabled={alreadyAdded}
              style={{
                display: 'flex', flexDirection: 'column', gap: '4px',
                padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: alreadyAdded ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                cursor: alreadyAdded ? 'default' : 'pointer',
                textAlign: 'left', opacity: alreadyAdded ? 0.4 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{s.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                  background: TYPE_BADGE_COLORS[s.metric_type] + '22',
                  color: TYPE_BADGE_COLORS[s.metric_type],
                }}>
                  {TYPE_LABELS[s.metric_type]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                <Clock size={10} />
                <span style={{ fontSize: 11 }}>Used {s.usedNSprintsAgo} sprint{s.usedNSprintsAgo > 1 ? 's' : ''} ago</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
