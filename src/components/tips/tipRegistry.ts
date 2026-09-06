// Feature tips — the registry.
//
// Every tip in SelfPM lives here as DATA, never as prose scattered inside the
// component it describes. That single choice is what makes the rest possible:
//
//   • one place to write and edit every explanation, in one voice
//   • a component only declares WHICH tip it anchors, never what it says
//   • a guided walkthrough is then just this registry played in `order` —
//     there is nothing left to build but the player
//
// THE CONTENT CONTRACT (what / how / why)
// Every tip answers the same three questions in the same order. This is not
// decoration: a walkthrough made of free-form tooltips reads as a pile of
// disconnected hints, while one made of what→how→why reads as a single
// explanation of the product. `why` is the SelfPM-specific half — these features
// carry an intent that is never self-evident from the UI, and a seeker who knows
// the intent uses the feature differently.
//
// Keep `what` to one sentence, `how` to at most four short steps, and `why` to
// one or two. A tip that needs more than that is a sign the feature needs work.

export type TipId = 'daily-ores' | 'quick-notes' | 'charter' | 'seeker-title' | 'pages';

export interface Tip {
  id: TipId;
  /** the feature's name in the seeker's language, not the codebase's. */
  title: string;
  /** one sentence: what this thing is. */
  what: string;
  /** the mechanics — at most four short steps. */
  how: string[];
  /** why it exists. The part the UI can't show. */
  why: string;
  /** sequence for the future guided walkthrough. Sparse on purpose (10, 20, 30…)
   *  so a new tip can slot between two others without renumbering. */
  order: number;
  /** Bump when the feature changes materially. A seeker who has already read
   *  v1 sees the "unread" marker again on v2, so the system never quietly
   *  teaches stale behaviour. Never bump for a typo fix. */
  version: number;
}

export const TIPS: Record<TipId, Tip> = {
  'daily-ores': {
    id: 'daily-ores',
    title: 'Daily Ores',
    what: 'The handful of things you log every day. Everything else in SelfPM is built out of these entries and nothing else.',
    how: [
      'Add an Ore in Settings — yes/no, a dropdown, or a multi-select.',
      'Log each one on the tracker daily. Drag them to reorder.',
      'Add a note to any day to record what actually happened, not just the value.',
    ],
    why: 'An Ore is not a task to complete — it is a lens to look through. That is the difference between this and a habit tracker: nothing here is asking you to keep a streak. One day of data is close to meaningless, and two hundred is the most honest picture of yourself you are ever likely to hold.',
    order: 10,
    version: 1,
  },

  'quick-notes': {
    id: 'quick-notes',
    title: 'Quick Notes',
    what: 'Fast capture for something you want out of your head and do not want to file.',
    how: [
      'Write the note. A title is optional — do not stall on one.',
      'Tag it. Tags autocomplete from ones you have already used.',
      'Export everything as CSV or JSON whenever you want the raw record.',
    ],
    why: 'These are written to be forgotten, not re-read. You capture the thing while it is live and let the tags do the retrieving later — the daily brief reads notes carrying the tag on your Charter\'s notes_tag line, so a note you never open again still ends up in your analysis.',
    order: 20,
    version: 1,
  },

  charter: {
    id: 'charter',
    title: 'Charter',
    what: 'One page that tells SelfPM which of your Ores matters most, and what good looks like on it.',
    how: [
      'Open Pages → System → Charter.',
      'Set the ore: line to the name of the daily task you want to lead with.',
      'Set unit:, goal: and notes_tag: underneath it.',
      'Capitalisation and extra spaces do not have to match — the name is matched loosely.',
    ],
    why: 'Your dashboard and your nightly brief both read their configuration from this page and nowhere else. Until you set it, they fall back to a default that is probably not yours. This is the one place you say what you are actually tracking.',
    order: 30,
    version: 1,
  },

  'seeker-title': {
    id: 'seeker-title',
    title: 'Seeker Title',
    what: 'A line you write for yourself, sitting above everything else on your dashboard. It stays exactly as you left it until you change it.',
    how: [
      'Write up to twelve words. It saves on its own when you click away.',
      'Press Save to keep a line in your library.',
      'Open the library to switch between lines you have kept — nothing is ever overwritten.',
    ],
    why: 'You read your own data more honestly from a calm, neutral state than from a hopeful or a defeated one. This line is here to set that state before you look. It is not a motivational quote and it is not a goal — it is the conditions for clear observation.',
    order: 40,
    version: 1,
  },

  pages: {
    id: 'pages',
    title: 'Pages',
    what: 'Your knowledge base — folders and markdown documents, plus two reserved pages SelfPM reads on its own.',
    how: [
      'Make folders and pages for anything you want to keep.',
      'Write in markdown and toggle Preview to read it back. It autosaves.',
      'System holds Charter and History. CPO Reports holds generated reports, which are read-only.',
      'Export one folder or every page as Markdown, CSV or JSON.',
    ],
    why: 'History is the page that earns its keep. It is the long-range context a CPO report reads, so a single week is never analysed in isolation. You write it by hand on purpose — what your own history says should be your account of it, not one assembled behind your back.',
    order: 50,
    version: 1,
  },
};

export const tipsInTourOrder = (): Tip[] =>
  Object.values(TIPS).sort((a, b) => a.order - b.order);
