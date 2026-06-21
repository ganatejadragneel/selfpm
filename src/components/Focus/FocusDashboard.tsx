// Focus-ORE dashboard — SelfPM's first AI-feature surface (build step 1 scaffold).
// Minimalist, content-first. Deterministic pieces are live (week strip + target);
// the two AI boxes (Analysis, Today's Focus) render placeholder text until the
// Anthropic client + prompts are wired (steps 4–7 of dashboard-build-plan.md).

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Plus, Check, Minus, X } from 'lucide-react';
import { format } from 'date-fns';
import { useThemeColors } from '../../hooks/useThemeColors';
import { type WindowDay, type FocusMetrics } from './focusLogic';
import { useDailyGoalsStore } from './dailyGoalsStore';
import { useFocusDataStore } from './focusDataStore';
import { charter, type DailyGoal } from './sampleData';

export function FocusDashboard() {
  const t = useThemeColors();
  const c = t.colors;
  const { metrics: m, brief, oreConfigured, loading, initialized, init } = useFocusDataStore();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  const ink = c.text.primary;
  const sub = c.text.secondary;
  const muted = c.text.muted;
  const accent = c.primary.dark;
  const surface = t.currentTheme === 'dark' ? c.surface.glass : '#ffffff';
  const canvas = t.currentTheme === 'dark' ? c.background.primary : '#f6f7f9';
  const hairline = t.currentTheme === 'dark' ? c.surface.glassBorder : '#ececef';

  const card: React.CSSProperties = {
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 18,
    padding: 22,
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ background: canvas, borderRadius: 24, padding: 'clamp(16px, 3vw, 32px)', minHeight: 'calc(100vh - 140px)' }}>
      {children}
    </div>
  );

  if (!initialized || (loading && !m)) {
    return shell(<div style={{ color: muted, fontSize: 14, padding: 40, textAlign: 'center' }}>Loading your dashboard…</div>);
  }
  if (!oreConfigured) {
    return shell(
      <div style={{ color: muted, fontSize: 14, padding: 40, textAlign: 'center', lineHeight: 1.6 }}>
        No Focus ORE yet. Create a daily task named{' '}
        <strong style={{ color: ink }}>“{charter.focusOreName}”</strong> to light up this dashboard.
      </div>
    );
  }
  if (!m) return null;

  const yesterday = m.yesterday;

  return (
    <div
      style={{
        background: canvas,
        borderRadius: 24,
        padding: 'clamp(16px, 3vw, 32px)',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: ink, margin: 0, letterSpacing: '-0.02em' }}>
          {charter.focusOreName}
        </h1>
        <span style={{ fontSize: 14, color: muted }}>· last 7 days</span>
      </div>

      {/* ── Hero row: week strip + target ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <WeekStrip m={m} card={card} accent={accent} sub={sub} muted={muted} ink={ink} />
        <TargetStat m={m} card={card} accent={accent} sub={sub} muted={muted} ink={ink} />
      </div>

      {/* ── Main: focus block (left) + daily goals (right rail) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
          gap: 16,
        }}
      >
        {/* Focus block */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <RawNote day={yesterday} card={card} sub={sub} muted={muted} ink={ink} hairline={hairline} />
            <AiBox
              title="CPO Analysis"
              text={brief?.analysis ?? null}
              model={brief?.model ?? null}
              loading={loading}
              card={card}
              ink={ink}
              muted={muted}
              sub={sub}
              accent={accent}
            />
          </div>
          <AiBox
            title="Today's Focus"
            text={brief?.focus ?? null}
            model={brief?.model ?? null}
            loading={loading}
            card={card}
            ink={ink}
            muted={muted}
            sub={sub}
            accent={accent}
          />
        </div>

        {/* Daily Goals rail */}
        <GoalsRail card={card} ink={ink} sub={sub} muted={muted} accent={accent} hairline={hairline} />
      </div>
    </div>
  );
}

// ───────────────────────── Week strip (live, deterministic) ─────────────────────────
function WeekStrip({
  m,
  card,
  accent,
  sub,
  muted,
  ink,
}: {
  m: FocusMetrics;
  card: React.CSSProperties;
  accent: string;
  sub: string;
  muted: string;
  ink: string;
}) {
  const CHART_H = 132;
  const up = m.average >= m.goal;

  return (
    <div style={card}>
      <Header label="This week" muted={muted}>
        <span style={{ fontSize: 13, color: sub, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {up ? (
            <TrendingUp size={14} color="#10b981" />
          ) : (
            <TrendingDown size={14} color={muted} />
          )}
          {m.average}h avg/day
        </span>
      </Header>

      <div style={{ position: 'relative', height: CHART_H, marginTop: 18 }}>
        {/* goal line */}
        <GoalLine value={m.goal} max={m.max} chartH={CHART_H} muted={muted} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: CHART_H }}>
          {m.window.map((d) => (
            <Bar key={d.offset} day={d} max={m.max} chartH={CHART_H} accent={accent} muted={muted} />
          ))}
        </div>
      </div>

      {/* day labels */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {m.window.map((d) => (
          <div
            key={d.offset}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: d.isYesterday ? 700 : 500,
              color: d.isYesterday ? ink : muted,
            }}
          >
            {d.weekdayLabel}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({
  day,
  max,
  chartH,
  accent,
  muted,
}: {
  day: WindowDay;
  max: number;
  chartH: number;
  accent: string;
  muted: string;
}) {
  const h = Math.max(3, (day.hours / max) * chartH);
  const emphasized = day.isYesterday;
  const today = day.isToday;

  const fill = emphasized ? accent : today ? 'transparent' : 'rgba(102, 126, 234, 0.22)';

  return (
    <div
      style={{
        flex: 1,
        height: chartH,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        borderLeft: day.weekBoundary ? `1px dashed ${muted}55` : 'none',
        paddingLeft: day.weekBoundary ? 4 : 0,
      }}
      title={`${day.hours}h`}
    >
      {/* hours label on the emphasized bar */}
      {emphasized && (
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: accent, marginBottom: 4 }}>
          {day.hours}h
        </div>
      )}
      <div
        style={{
          height: h,
          borderRadius: 7,
          background: fill,
          border: today ? `1.5px dashed ${accent}88` : 'none',
        }}
      />
    </div>
  );
}

function GoalLine({
  value,
  max,
  chartH,
  muted,
}: {
  value: number;
  max: number;
  chartH: number;
  muted: string;
}) {
  const bottom = (value / max) * chartH;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom, pointerEvents: 'none' }}>
      <div style={{ borderTop: `1px dashed ${muted}`, opacity: 0.7 }} />
      <span
        style={{
          position: 'absolute',
          right: 0,
          top: -16,
          fontSize: 10,
          color: muted,
          fontWeight: 600,
          letterSpacing: '0.03em',
        }}
      >
        goal {value}h
      </span>
    </div>
  );
}

// ───────────────────────── Target calculator (live, the hero number) ─────────────────────────
function TargetStat({
  m,
  card,
  accent,
  sub,
  muted,
  ink,
}: {
  m: FocusMetrics;
  card: React.CSSProperties;
  accent: string;
  sub: string;
  muted: string;
  ink: string;
}) {
  const value = m.metGoal ? 0 : m.targetToday;
  const big = m.metGoal ? '✓' : `${value}`;

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header label="Today's target" muted={muted} />

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 8 }}>
        <span
          style={{
            fontSize: 64,
            lineHeight: 0.95,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: m.metGoal ? '#10b981' : accent,
          }}
        >
          {big}
        </span>
        {!m.metGoal && <span style={{ fontSize: 20, fontWeight: 600, color: sub, marginBottom: 6 }}>hrs</span>}
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: sub, lineHeight: 1.5 }}>
        {m.metGoal ? (
          <>You're already holding the <strong style={{ color: ink }}>{m.goal}h/day</strong> average. Anything today is ahead.</>
        ) : (
          <>
            needed today to hold your <strong style={{ color: ink }}>{m.goal}h/day</strong> average
            {m.unreachable && (
              <span style={{ display: 'block', marginTop: 6, color: muted, fontStyle: 'italic' }}>
                more than fits in the day — this is the raw gap, not a realistic ask.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Yesterday's raw ORE note (verbatim) ─────────────────────────
function RawNote({
  day,
  card,
  sub,
  muted,
  ink,
  hairline,
}: {
  day?: WindowDay;
  card: React.CSSProperties;
  sub: string;
  muted: string;
  ink: string;
  hairline: string;
}) {
  return (
    <div style={card}>
      <Header label="Yesterday — your note" muted={muted}>
        {day && <span style={{ fontSize: 12, color: muted }}>{format(day.date, 'EEE, MMM d')}</span>}
      </Header>
      <div
        style={{
          marginTop: 14,
          paddingLeft: 14,
          borderLeft: `2px solid ${hairline}`,
          fontSize: 14.5,
          lineHeight: 1.65,
          color: ink,
          fontStyle: day?.note ? 'normal' : 'italic',
        }}
      >
        {day?.note ?? <span style={{ color: muted }}>No note logged for yesterday.</span>}
      </div>
      {day && (
        <div style={{ marginTop: 14, fontSize: 12, color: sub }}>
          {day.hours}h logged
        </div>
      )}
    </div>
  );
}

// ───────────────────────── AI boxes (read the nightly brief) ─────────────────────────
function AiBox({
  title,
  text,
  model,
  loading,
  card,
  ink,
  muted,
  sub,
  accent,
}: {
  title: string;
  text: string | null;
  model: string | null;
  loading: boolean;
  card: React.CSSProperties;
  ink: string;
  muted: string;
  sub: string;
  accent: string;
}) {
  const hasText = !!text;
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Header label={title} muted={muted} />
        <AiPill accent={accent} modelUsed={model ?? undefined} />
      </div>
      {loading ? (
        <Shimmer />
      ) : hasText ? (
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 14.5, lineHeight: 1.7, color: ink }}>{text}</p>
      ) : (
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13.5, lineHeight: 1.6, color: muted, fontStyle: 'italic' }}>
          Generates overnight — check back tomorrow.
        </p>
      )}
      {hasText && model && (
        <div style={{ marginTop: 12, fontSize: 11.5, color: sub, letterSpacing: '0.02em' }}>via {model}</div>
      )}
    </div>
  );
}

function Shimmer() {
  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
      {[100, 96, 88, 60].map((w, i) => (
        <div
          key={i}
          style={{
            height: 11,
            width: `${w}%`,
            borderRadius: 6,
            background: 'linear-gradient(90deg, #e9ebef 25%, #f3f4f6 50%, #e9ebef 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.3s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function AiPill({ accent, modelUsed }: { accent: string; modelUsed?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: accent,
        background: 'rgba(102, 126, 234, 0.1)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        padding: '3px 8px',
        borderRadius: 999,
        textTransform: 'uppercase',
      }}
      title={modelUsed}
    >
      <Sparkles size={11} /> AI
    </span>
  );
}

// ───────────────────────── Daily goals rail (live, dailyGoalsStore) ─────────────────────────
function GoalsRail({
  card,
  ink,
  sub,
  muted,
  accent,
  hairline,
}: {
  card: React.CSSProperties;
  ink: string;
  sub: string;
  muted: string;
  accent: string;
  hairline: string;
}) {
  const { goals, addGoal, cycleStatus, renameGoal, deleteGoal, init, initialized } = useDailyGoalsStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  const done = goals.filter((g) => g.status === 'done').length;
  const attempted = goals.length;
  const carry = goals.filter((g) => g.carriedOver).length;

  const submit = () => {
    if (draft.trim()) addGoal(draft);
    setDraft('');
    setAdding(false);
  };

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
      <style>{`.goal-row .goal-del{opacity:0;transition:opacity .15s}.goal-row:hover .goal-del{opacity:1}`}</style>
      <Header label="Today's plan" muted={muted}>
        <span style={{ fontSize: 13, fontWeight: 700, color: ink }}>
          {done}/{attempted}
        </span>
      </Header>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
        {goals.map((g, i) => (
          <GoalRow
            key={g.id}
            goal={g}
            ink={ink}
            muted={muted}
            last={i === goals.length - 1}
            hairline={hairline}
            onCycle={() => cycleStatus(g.id)}
            onRename={(label) => renameGoal(g.id, label)}
            onDelete={() => deleteGoal(g.id)}
          />
        ))}
      </div>

      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') {
              setDraft('');
              setAdding(false);
            }
          }}
          placeholder="New goal"
          style={{
            marginTop: 12,
            padding: '8px 10px',
            border: `1px solid ${accent}`,
            borderRadius: 8,
            fontSize: 13.5,
            outline: 'none',
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            marginTop: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Plus size={15} /> Add
        </button>
      )}

      {carry > 0 && (
        <div style={{ marginTop: 14, fontSize: 12, color: sub }}>
          {carry} carried over {'│'.repeat(carry)}
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goal,
  ink,
  muted,
  last,
  hairline,
  onCycle,
  onRename,
  onDelete,
}: {
  goal: DailyGoal;
  ink: string;
  muted: string;
  last: boolean;
  hairline: string;
  onCycle: () => void;
  onRename: (label: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.label);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== goal.label) onRename(v);
    else setDraft(goal.label);
    setEditing(false);
  };

  return (
    <div
      className="goal-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 0',
        borderBottom: last ? 'none' : `1px solid ${hairline}`,
      }}
    >
      <StatusDot status={goal.status} onClick={onCycle} />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(goal.label);
              setEditing(false);
            }
          }}
          style={{
            flex: 1,
            fontSize: 13.5,
            padding: '2px 5px',
            border: `1px solid ${muted}`,
            borderRadius: 5,
            outline: 'none',
          }}
        />
      ) : (
        <span
          onClick={() => {
            setDraft(goal.label);
            setEditing(true);
          }}
          title="click to rename"
          style={{
            fontSize: 13.5,
            color: goal.status === 'not_done' ? muted : ink,
            flex: 1,
            cursor: 'text',
            textDecoration: goal.status === 'done' ? 'line-through' : 'none',
            textDecorationColor: muted,
          }}
        >
          {goal.label}
        </span>
      )}
      {goal.carriedOver && !editing && (
        <span style={{ fontSize: 11, color: muted }} title="carried over">
          │
        </span>
      )}
      <button
        className="goal-del"
        onClick={onDelete}
        title="delete"
        style={{ border: 'none', background: 'none', cursor: 'pointer', color: muted, padding: 2, display: 'inline-flex' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function StatusDot({ status, onClick }: { status: DailyGoal['status']; onClick: () => void }) {
  const base: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
  };
  if (status === 'done') {
    return (
      <button onClick={onClick} title="done — click to cycle" style={{ ...base, background: '#10b981' }}>
        <Check size={12} color="#fff" strokeWidth={3} />
      </button>
    );
  }
  if (status === 'in_progress') {
    return (
      <button onClick={onClick} title="in progress — click to cycle" style={{ ...base, background: '#f59e0b' }}>
        <Minus size={12} color="#fff" strokeWidth={3} />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title="not done — click to cycle"
      style={{ ...base, background: 'transparent', border: '2px solid #d1d5db' }}
    />
  );
}

// ───────────────────────── shared bits ─────────────────────────
function Header({ label, muted, children }: { label: string; muted: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 11.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: muted,
        }}
      >
        {label}
      </h3>
      {children}
    </div>
  );
}

export default FocusDashboard;
