// Sits where a streak counter would, and deliberately isn't one.
//
// Two facts, both of which survive a missed day: how long the seeker has been at
// this, and what share of that time they showed up for. A blank day moves 72% to
// 71%; it never resets anything to zero, and there is nothing here to "break".

import { useSurfacePalette } from '../../hooks/useSurfacePalette';
import { useTenure } from './useTenure';

export function TenureBadge() {
  const { tenure, loading } = useTenure();
  const { sub, muted, accent, mono, label } = useSurfacePalette();

  // Nothing to say before the first entry — an empty badge would just be noise
  // on the one day the seeker has least to show for.
  if (loading || !tenure.firstDate) return null;

  return (
    <div
      title={`First entry ${tenure.firstDate} · active on ${tenure.activeDays} of ${tenure.totalDays} days`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flex: 'none' }}
    >
      <span style={{ ...label, color: sub, fontFamily: mono }}>
        DAY {tenure.dayNumber.toLocaleString()}
      </span>
      <span aria-hidden style={{ width: 3, height: 3, borderRadius: 999, background: muted }} />
      <span style={{ ...label, color: muted, fontFamily: mono }}>
        <span style={{ color: accent }}>{tenure.pct}%</span> OF DAYS LOGGED
      </span>
    </div>
  );
}
