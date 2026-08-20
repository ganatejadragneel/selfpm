// Charter-driven config for the Focus dashboard + nightly brief.
// The Charter page (Pages → System → Charter) is editable markdown; this parses
// the user's choices out of it. Both the client (focusDataStore) and the edge
// function (generate-focus-brief) read config through this shape — the parser
// logic is MIRRORED in the edge function (single-file Deno paste). Change both.

export interface CharterConfig {
  focusOreName: string;
  notesTag: string;
  weeklyAverageGoal: number;
  unit: string;
}

export const DEFAULT_CHARTER: CharterConfig = {
  focusOreName: 'Hard Focus Hours',
  notesTag: 'focus log',
  weeklyAverageGoal: 6,
  unit: 'hrs',
};

// Names are compared loosely: trailing/leading whitespace and repeated inner
// spaces are invisible in the UI (HTML collapses them), so a task saved as
// "Hard Focus Hours " must still match a charter that says "hard focus hours".
export const normalizeName = (v: string): string =>
  v.trim().replace(/\s+/g, ' ').toLowerCase();

// The seed Charter ships hint text wrapped in angle brackets. Users naturally
// type *inside* those brackets ("<hard focus hours>") rather than replacing
// them, so strip the wrapper and keep what's inside.
const unwrap = (v: string): string => {
  const m = v.trim().match(/^<\s*(.*?)\s*>$/);
  return m ? m[1] : v.trim();
};

// Still-unset means empty, or the seed's own hint text left untouched.
const SEED_HINT = /^(your\s+)?(ore\s+name|quick[-\s]note\s+tag|tag|name)$/i;
const isUnset = (v: string): boolean => !v || SEED_HINT.test(v);

// Tolerant line parser. Reads `key: value` lines anywhere in the Charter markdown
// (a leading "- "/"* " bullet and surrounding prose are ignored). Unknown keys are
// skipped, so the user can keep notes around the config lines. Any field left as a
// placeholder falls back to DEFAULT_CHARTER.
export function parseCharter(content: string | null | undefined): CharterConfig {
  const cfg: CharterConfig = { ...DEFAULT_CHARTER };
  if (!content) return cfg;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/^\s*[-*]\s+/, '').trim(); // strip a list bullet
    const m = line.match(/^([a-z_ ]+):\s*(.+)$/i);
    if (!m) continue;
    const key = m[1].trim().toLowerCase().replace(/\s+/g, '_');
    const value = unwrap(m[2]);
    if (isUnset(value)) continue;

    if (key === 'ore' || key === 'focus_ore') cfg.focusOreName = value;
    else if (key === 'notes_tag' || key === 'tag') cfg.notesTag = value;
    else if (key === 'unit') cfg.unit = value;
    else if (key === 'goal') {
      const n = parseFloat(value.replace(/[^0-9.]/g, '')); // tolerates "weekly average >= 6"
      if (Number.isFinite(n) && n > 0) cfg.weeklyAverageGoal = n;
    }
  }
  return cfg;
}
