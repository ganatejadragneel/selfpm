// Generate panel — brief §B2.1. Period input + Generate, with inline validation
// and a progress state (generation takes ~60s, so the wait is explained).

import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { DEFAULT_PERIOD_DAYS, validatePeriodInput } from './reportsLogic';

const INK = '#1f2937';
const SUB = '#6b7280';
const MUTED = '#9ca3af';
const ACCENT = '#667eea';
const HAIR = '#ececef';
const DANGER = '#b91c1c';

export function GeneratePanel({
  generating,
  onGenerate,
}: {
  generating: boolean;
  onGenerate: (days: number) => void;
}) {
  const [raw, setRaw] = useState(String(DEFAULT_PERIOD_DAYS));
  const [touched, setTouched] = useState(false);
  const v = validatePeriodInput(raw);
  const showError = touched && !v.valid;

  const submit = () => {
    setTouched(true);
    if (!v.valid || generating) return;
    onGenerate(v.days);
  };

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${HAIR}`,
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={submit}
          disabled={generating}
          aria-label="Generate report"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 18px',
            border: 'none',
            borderRadius: 10,
            background: generating ? 'rgba(102,126,234,0.45)' : ACCENT,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: generating ? 'default' : 'pointer',
            flex: 'none',
          }}
        >
          {generating ? <Loader2 size={16} className="rp-spin" /> : <Zap size={16} />}
          {generating ? 'Generating…' : 'Generate Report'}
        </button>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: SUB }}>
          Report: last
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={generating}
            inputMode="numeric"
            aria-label="Period length in days"
            aria-invalid={showError}
            style={{
              width: 62,
              padding: '8px 10px',
              border: `1px solid ${showError ? DANGER : HAIR}`,
              borderRadius: 8,
              fontSize: 14,
              color: INK,
              textAlign: 'center',
              outline: 'none',
            }}
          />
          days
        </label>

        {generating && (
          <span style={{ fontSize: 12.5, color: MUTED }}>
            reading your window, prior reports and history — about a minute
          </span>
        )}
      </div>

      {showError && (
        <div role="alert" style={{ marginTop: 10, fontSize: 12.5, color: DANGER }}>
          {v.error}
        </div>
      )}
    </div>
  );
}
