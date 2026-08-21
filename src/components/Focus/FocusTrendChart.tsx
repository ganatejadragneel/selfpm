// Focus-ORE trend chart — hand-built inline SVG.
//
// Deliberately not a charting library: Recharts/Chart.js defaults are instantly
// recognisable and carry their own chrome, and the whole dashboard is a single
// accent hue on a neutral canvas. This is ~200 lines, adds nothing to the bundle,
// and every mark obeys the house spec:
//   line 2px round-cap · area wash ~10% · gridlines solid hairline (never dashed)
//   markers r>=4 with a 2px surface ring · goal line dashed because it is a real
//   threshold, which is the one thing dashes are allowed to mean.
// One series, so there is no legend — the card title names what is plotted.
// The tooltip enhances but never gates: the table view carries every value.

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Table2, LineChart } from 'lucide-react';
import { format } from 'date-fns';
import { buildTrend, type TrendRange } from './focusLogic';
import { type FocusDay } from './sampleData';

const RANGES: { id: TrendRange; label: string }[] = [
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
];

interface Props {
  days: FocusDay[];
  goal: number;
  unit: string;
  oreName: string;
  card: React.CSSProperties;
  ink: string;
  sub: string;
  muted: string;
  accent: string;
  hairline: string;
  surface: string;
}

export function FocusTrendChart({
  days, goal, unit, oreName, card, ink, sub, muted, accent, hairline, surface,
}: Props) {
  const [range, setRange] = useState<TrendRange>('1m');
  const [asTable, setAsTable] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [width, setWidth] = useState(720);
  const wrapRef = useRef<HTMLDivElement>(null);

  const points = useMemo(() => buildTrend(days, range), [days, range]);

  // measure so the SVG uses real pixels (crisp hairlines, no viewBox scaling blur)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 26, left: 34 };
  const plotW = Math.max(80, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;

  // y scale — round the top to a clean number so ticks land on whole hours
  const rawMax = Math.max(goal, ...points.map((p) => p.value), 1);
  const yMax = Math.ceil(rawMax / 2) * 2;
  const x = useCallback(
    (i: number) => PAD.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW),
    [points.length, plotW, PAD.left],
  );
  const y = useCallback((v: number) => PAD.top + plotH - (v / yMax) * plotH, [plotH, yMax, PAD.top]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L${x(points.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`
    : '';

  const ticks = useMemo(() => {
    const step = yMax <= 4 ? 1 : yMax <= 10 ? 2 : 4;
    const out: number[] = [];
    for (let v = 0; v <= yMax; v += step) out.push(v);
    return out;
  }, [yMax]);

  // crosshair snaps to the nearest point — readers aim at a date, not a 2px line
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (points.length < 2) return setHoverIdx(points.length ? 0 : null);
    const i = Math.round(((px - PAD.left) / plotW) * (points.length - 1));
    setHoverIdx(Math.min(points.length - 1, Math.max(0, i)));
  };

  const hovered = hoverIdx != null ? points[hoverIdx] : null;
  const last = points[points.length - 1];

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '4px 11px',
    fontSize: 12,
    fontWeight: active ? 650 : 500,
    fontFamily: 'inherit',
    color: active ? ink : muted,
    background: active ? surface : 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
    transition: 'color .15s, background .15s',
  });

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted }}>
            Trend
          </div>
          <div style={{ fontSize: 13, color: sub, marginTop: 3 }}>
            {oreName} · {unit}/day{points[0]?.aggregated ? ' · weekly average' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2, background: hairline, padding: 3, borderRadius: 8 }}>
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => { setRange(r.id); setHoverIdx(null); }} style={tabBtn(range === r.id)}>
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAsTable((v) => !v)}
            title={asTable ? 'Show chart' : 'Show values as a table'}
            aria-label={asTable ? 'Show chart' : 'Show values as a table'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${hairline}`,
              background: 'transparent', color: muted, cursor: 'pointer',
            }}
          >
            {asTable ? <LineChart size={15} /> : <Table2 size={15} />}
          </button>
        </div>
      </div>

      {asTable ? (
        <div style={{ marginTop: 14, maxHeight: H, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <caption style={{ captionSide: 'top', textAlign: 'left', fontSize: 12, color: muted, paddingBottom: 8 }}>
              {oreName} — {unit} per day
            </caption>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date.toISOString()} style={{ borderBottom: `1px solid ${hairline}` }}>
                  <td style={{ padding: '6px 0', color: sub }}>{p.label}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {p.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} style={{ position: 'relative', marginTop: 14 }}>
          <svg
            width={width}
            height={H}
            onMouseMove={onMove}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ display: 'block', overflow: 'visible' }}
            role="img"
            aria-label={`${oreName} trend, ${unit} per day. Use the table view for exact values.`}
          >
            {/* gridlines — solid hairlines, one step off the surface */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke={hairline} strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end"
                      style={{ fontSize: 10, fill: muted, fontVariantNumeric: 'tabular-nums' }}>
                  {t}
                </text>
              </g>
            ))}

            {/* goal threshold — dashed, because it genuinely is a threshold */}
            <line x1={PAD.left} x2={PAD.left + plotW} y1={y(goal)} y2={y(goal)}
                  stroke={muted} strokeWidth={1} strokeDasharray="4 4" opacity={0.85} />
            <text x={PAD.left + plotW} y={y(goal) - 6} textAnchor="end"
                  style={{ fontSize: 10, fill: muted }}>
              goal {goal}
            </text>

            {/* area wash + line */}
            {/* The area fades to nothing at the axis, so height reads as light
                rather than as a flat wash of colour. */}
            <defs>
              <linearGradient id="focus-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.38} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#focus-area)" />
            <path d={linePath} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* endpoint marker with a surface ring, direct-labelled */}
            {last && (
              <>
                <circle cx={x(points.length - 1)} cy={y(last.value)} r={4.5}
                        fill={accent} stroke={surface} strokeWidth={2} />
                <text x={x(points.length - 1)} y={y(last.value) - 12} textAnchor="end"
                      style={{ fontSize: 11, fontWeight: 650, fill: ink }}>
                  {last.value}
                </text>
              </>
            )}

            {/* crosshair */}
            {hovered && hoverIdx != null && (
              <>
                <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD.top} y2={PAD.top + plotH}
                      stroke={muted} strokeWidth={1} opacity={0.5} />
                <circle cx={x(hoverIdx)} cy={y(hovered.value)} r={4.5}
                        fill={accent} stroke={surface} strokeWidth={2} />
              </>
            )}

            {/* x labels — first, middle, last only; a label per day is a smear */}
            {points.length > 0 && [0, Math.floor((points.length - 1) / 2), points.length - 1]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((i) => (
                <text key={i} x={x(i)} y={H - 6}
                      textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                      style={{ fontSize: 10, fill: muted }}>
                  {format(points[i].date, 'MMM d')}
                </text>
              ))}
          </svg>

          {hovered && hoverIdx != null && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(Math.max(x(hoverIdx) - 60, 0), Math.max(0, width - 124)),
                top: 0,
                width: 124,
                pointerEvents: 'none',
                background: surface,
                border: `1px solid ${hairline}`,
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                padding: '8px 10px',
              }}
            >
              {/* value leads, label follows — the reader has the date, wants the number */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ width: 10, height: 2, background: accent, borderRadius: 1, display: 'inline-block' }} />
                <span style={{ fontSize: 17, fontWeight: 700, color: ink }}>{hovered.value}</span>
                <span style={{ fontSize: 11, color: muted }}>{unit}</span>
              </div>
              <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{hovered.label}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
