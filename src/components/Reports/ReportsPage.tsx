// CPO Reports tab — brief §B2. Generate panel over the reports grid.
// Opening a report navigates to Pages, which is where reports are read.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useReportsStore } from './reportsStore';

const INK = '#1f2937';
const SUB = '#6b7280';
const HAIR = '#ececef';
const ACCENT = '#667eea';
const DANGER = '#b91c1c';

import { GeneratePanel } from './GeneratePanel';
import { ReportsGrid } from './ReportsGrid';

export function ReportsPage() {
  const navigate = useNavigate();
  const { rows, loading, generating, error, warnings, lastGenerated, initialized, init, generate, updateNotes, dismissError } =
    useReportsStore();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  const handleGenerate = async (days: number) => {
    const outcome = await generate(days);
    // Brief §B3: on success the report opens in Pages.
    if (outcome) navigate(`/pages?doc=${outcome.documentId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        .rp-spin { animation: rp-spin 1s linear infinite; }
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        .rp-row:hover { background: rgba(102,126,234,0.05); }
      `}</style>

      <GeneratePanel generating={generating} onGenerate={handleGenerate} />

      {error && (
        <div
          role="alert"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: DANGER, fontSize: 13.5 }}
        >
          <AlertCircle size={16} style={{ flex: 'none', marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <strong>Generation failed.</strong> {error}
            <div style={{ color: SUB, marginTop: 4 }}>Nothing was saved — it's safe to try again.</div>
          </div>
          <button onClick={dismissError} aria-label="Dismiss error" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: DANGER, flex: 'none' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {lastGenerated && !error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(102,126,234,0.06)', border: `1px solid rgba(102,126,234,0.25)`, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, color: INK }}>
          <CheckCircle2 size={16} color={ACCENT} style={{ flex: 'none', marginTop: 1 }} />
          <div>
            <strong>{lastGenerated.title}</strong> saved to Pages
            {lastGenerated.commitmentCount > 0 && ` · ${lastGenerated.commitmentCount} commitment${lastGenerated.commitmentCount > 1 ? 's' : ''} recorded for the next report to grade`}
            {warnings.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: SUB }}>
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 16, boxShadow: '0 8px 28px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 6px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: INK }}>Your reports</h3>
          {rows.length > 0 && <span style={{ fontSize: 12.5, color: SUB }}>{rows.length}</span>}
        </div>
        <ReportsGrid rows={rows} loading={loading && !initialized} onOpen={(id) => navigate(`/pages?doc=${id}`)} onNotesChange={updateNotes} />
      </div>
    </div>
  );
}

export default ReportsPage;
