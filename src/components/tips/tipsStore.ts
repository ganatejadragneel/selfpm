// Which tips this seeker has already read.
//
// Stored in localStorage rather than Postgres, deliberately. "Have I read the
// explanation of the title field" is low-stakes, per-device state: the worst
// case when it doesn't sync is that a seeker sees one quiet dot twice on a new
// device. That is not worth a table, a migration, an RLS policy and a network
// round-trip on every dashboard load.
//
// It is keyed by user id anyway, so two people on one machine don't inherit each
// other's history — and if we later want this to follow a seeker across devices
// (which really only matters once the guided walkthrough exists and we care
// whether someone has *completed* it), the shape below maps to a single jsonb
// column without touching any caller.
//
// Shape: { [tipId]: versionRead }. Storing the version rather than a boolean is
// what lets a tip re-surface when its feature materially changes.

import { create } from 'zustand';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { TIPS, type Tip, type TipId } from './tipRegistry';

type SeenMap = Partial<Record<TipId, number>>;

const storageKey = () => `spm.tips.seen.${useSupabaseAuthStore.getState().user?.id ?? 'anon'}`;

const read = (): SeenMap => {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? '{}') as SeenMap;
  } catch {
    return {}; // corrupt or unavailable storage should never break the dashboard
  }
};

const write = (map: SeenMap) => {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(map));
  } catch {
    /* private mode / quota — the tip simply stays marked unread */
  }
};

interface TipsStore {
  seen: SeenMap;
  loaded: boolean;
  load: () => void;
  isUnread: (id: TipId) => boolean;
  markRead: (id: TipId) => void;
  /** every tip this seeker has not yet read, in walkthrough order. The guided
   *  tour is this list plus a player — the data side is already done. */
  unread: () => Tip[];
}

export const useTipsStore = create<TipsStore>((set, get) => ({
  seen: {},
  loaded: false,

  load: () => set({ seen: read(), loaded: true }),

  isUnread: (id) => (get().seen[id] ?? 0) < TIPS[id].version,

  markRead: (id) => {
    const next = { ...get().seen, [id]: TIPS[id].version };
    write(next);
    set({ seen: next });
  },

  unread: () => {
    const { seen } = get();
    return Object.values(TIPS)
      .filter((t) => (seen[t.id] ?? 0) < t.version)
      .sort((a, b) => a.order - b.order);
  },
}));
