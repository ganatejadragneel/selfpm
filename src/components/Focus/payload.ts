// Assembles the FocusPayload from the local sample store (build step 5 support).
// Pure — no SDK, no React. Server and CLI both call this so prompts see identical
// data. Swap the source from sampleData → Supabase here, nothing else changes.

import { format } from 'date-fns';
import { computeMetrics } from './focusLogic';
import { charter, focusDays, focusLog } from './sampleData';
import type { FocusPayload } from './prompts';

export function buildSamplePayload(now: Date = new Date()): FocusPayload {
  const m = computeMetrics(focusDays, 7, now);
  const y = m.yesterday;

  const yLog = focusLog.filter((e) => e.offset === 1).map((e) => e.text);

  return {
    focusOreName: charter.focusOreName,
    unit: charter.unit,
    goal: m.goal,
    yesterday: {
      dateLabel: y ? format(y.date, 'EEE, MMM d') : 'yesterday',
      hours: y?.hours ?? 0,
      note: y?.note,
    },
    focusLog: yLog,
    weekTotal: m.total,
    weekAverage: m.average,
    targetToday: m.targetToday,
  };
}
