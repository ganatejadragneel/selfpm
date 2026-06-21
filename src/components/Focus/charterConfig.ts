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

// A value is "unset" when it's still the seed placeholder (e.g. "<ORE name>").
const isPlaceholder = (v: string) => !v || /^<.*>$/.test(v.trim());

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
    const value = m[2].trim();
    if (isPlaceholder(value)) continue;

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
