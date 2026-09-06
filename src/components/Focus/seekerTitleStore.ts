// Seeker Title store — Supabase-backed (seeker_title_state + seeker_titles).
//
// The line the seeker sets for themselves, shown every time they open the app. Its
// job is to put them in a neutral, calm state before they look at their own data.
//
// Two pieces of state, deliberately separate:
//   • `body`    — what is on screen right now. Persists whether or not it was ever
//                 saved, because "type it and leave it there for weeks" is a
//                 first-class way to use this.
//   • `library` — the lines they chose to keep. Committing copies the current line
//                 in; selecting copies one back out. Editing never rewrites a saved
//                 entry, so the library only ever grows.

import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';

const userId = () => useSupabaseAuthStore.getState().user?.id ?? null;

export const MAX_WORDS = 12;

export const countWords = (v: string): number => {
  const t = v.trim();
  return t ? t.split(/\s+/).length : 0;
};

export interface SavedTitle {
  id: string;
  body: string;
  createdAt: string;
  lastUsedAt: string | null;
}

type Row = { id: string; body: string; created_at: string; last_used_at: string | null };
const toMessage = (r: Row): SavedTitle => ({
  id: r.id,
  body: r.body,
  createdAt: r.created_at,
  lastUsedAt: r.last_used_at,
});

interface SeekerTitleStore {
  body: string;
  activeId: string | null;
  library: SavedTitle[];
  initialized: boolean;
  saving: boolean;
  /** true when the on-screen line differs from the library entry it came from. */
  dirty: () => boolean;
  init: () => Promise<void>;
  setBody: (v: string) => void;
  /** persist the on-screen line without adding it to the library. */
  persist: () => Promise<void>;
  /** copy the on-screen line into the library. */
  commit: () => Promise<void>;
  select: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSeekerTitleStore = create<SeekerTitleStore>((set, get) => ({
  body: '',
  activeId: null,
  library: [],
  initialized: false,
  saving: false,

  dirty: () => {
    const { body, activeId, library } = get();
    const active = library.find((m) => m.id === activeId);
    return active ? active.body !== body.trim() : body.trim().length > 0;
  },

  init: async () => {
    const uid = userId();
    if (!uid) return set({ initialized: true });

    const [{ data: state }, { data: rows }] = await Promise.all([
      supabase
        .from('seeker_title_state')
        .select('body, active_id')
        .eq('new_user_id', uid)
        .maybeSingle(),
      supabase
        .from('seeker_titles')
        .select('id, body, created_at, last_used_at')
        .eq('new_user_id', uid)
        .order('last_used_at', { ascending: false, nullsFirst: false }),
    ]);

    set({
      body: state?.body ?? '',
      activeId: state?.active_id ?? null,
      library: (rows ?? []).map((r) => toMessage(r as Row)),
      initialized: true,
    });
  },

  setBody: (v) => set({ body: v }),

  persist: async () => {
    const uid = userId();
    if (!uid) return;
    const { body, activeId } = get();
    if (countWords(body) > MAX_WORDS) return; // the DB would reject it anyway
    set({ saving: true });
    await supabase
      .from('seeker_title_state')
      .upsert({ new_user_id: uid, body: body.trim(), active_id: activeId }, { onConflict: 'new_user_id' });
    set({ saving: false });
  },

  commit: async () => {
    const uid = userId();
    const body = get().body.trim();
    if (!uid || !body || countWords(body) > MAX_WORDS) return;

    // already in the library? just make it the active one rather than duplicating
    const existing = get().library.find((m) => m.body === body);
    if (existing) return get().select(existing.id);

    set({ saving: true });
    const { data, error } = await supabase
      .from('seeker_titles')
      .insert({ new_user_id: uid, body, last_used_at: new Date().toISOString() })
      .select('id, body, created_at, last_used_at')
      .single();
    if (error || !data) return set({ saving: false });

    const msg = toMessage(data as Row);
    await supabase
      .from('seeker_title_state')
      .upsert({ new_user_id: uid, body, active_id: msg.id }, { onConflict: 'new_user_id' });
    set((s) => ({ library: [msg, ...s.library], activeId: msg.id, saving: false }));
  },

  select: async (id) => {
    const uid = userId();
    const msg = get().library.find((m) => m.id === id);
    if (!uid || !msg) return;
    const usedAt = new Date().toISOString();

    set((s) => ({
      body: msg.body,
      activeId: id,
      library: s.library
        .map((m) => (m.id === id ? { ...m, lastUsedAt: usedAt } : m))
        .sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '')),
    }));

    await Promise.all([
      supabase.from('seeker_titles').update({ last_used_at: usedAt }).eq('id', id),
      supabase
        .from('seeker_title_state')
        .upsert({ new_user_id: uid, body: msg.body, active_id: id }, { onConflict: 'new_user_id' }),
    ]);
  },

  remove: async (id) => {
    // the FK is `on delete set null`, so the line on screen survives losing its
    // library entry — it just stops being linked to one.
    set((s) => ({
      library: s.library.filter((m) => m.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
    await supabase.from('seeker_titles').delete().eq('id', id);
  },
}));
