// Pages store — Supabase-backed (kb_folders / kb_documents).
// Mirrors the quickNotesStore pattern: shared `supabase` client, `new_user_id`
// from the auth store, optimistic local state + async persistence.
// The component contract is unchanged from the local version.

import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import type { KbDocument, KbFolder } from './types';

export const UNFILED = '__unfiled__';

const userId = () => useSupabaseAuthStore.getState().user?.id ?? null;

// ── row → model mappers (role lives in metadata.role) ──
type FolderRow = { id: string; name: string; is_system: boolean; display_order: number; metadata: { role?: KbFolder['role'] } | null };
type DocRow = {
  id: string; folder_id: string | null; title: string; content: string; source: KbDocument['source'];
  metadata: { role?: KbDocument['role'] } | null; display_order: number; created_at: string; updated_at: string;
};

const toFolder = (r: FolderRow): KbFolder => ({
  id: r.id, name: r.name, is_system: r.is_system, display_order: r.display_order, role: r.metadata?.role,
});
const toDoc = (r: DocRow): KbDocument => ({
  id: r.id, folder_id: r.folder_id, title: r.title, content: r.content, source: r.source,
  role: r.metadata?.role, display_order: r.display_order, created_at: r.created_at, updated_at: r.updated_at,
});

const inFolder = (folderId: string | null) => (d: KbDocument) =>
  d.folder_id === (folderId === UNFILED ? null : folderId);

interface PagesStore {
  folders: KbFolder[];
  documents: KbDocument[];
  activeFolderId: string | null;
  activeDocId: string | null;
  saving: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  init: () => Promise<void>;
  setActiveFolder: (id: string) => void;
  setActiveDoc: (id: string | null) => void;

  createFolder: (name: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createDocument: (folderId: string) => Promise<void>;
  updateDocument: (id: string, patch: Partial<Pick<KbDocument, 'title' | 'content'>>) => void;
  deleteDocument: (id: string) => Promise<void>;
  reorderDocument: (id: string, dir: 'up' | 'down') => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Ensure the reserved folders + config pages exist for this user (seed on first load).
async function ensureReserved(uid: string, folders: KbFolder[]): Promise<KbFolder[]> {
  const out = [...folders];

  const ensureFolder = async (role: 'cpo_reports' | 'system', name: string, order: number) => {
    if (out.some((f) => f.role === role)) return;
    const { data } = await supabase
      .from('kb_folders')
      .insert({ new_user_id: uid, name, is_system: true, metadata: { role }, display_order: order })
      .select()
      .single();
    if (data) out.push(toFolder(data as FolderRow));
  };
  await ensureFolder('cpo_reports', 'CPO Reports', 900);
  await ensureFolder('system', 'System', 901);

  const systemFolder = out.find((f) => f.role === 'system');
  if (systemFolder) {
    const { data: sysDocs } = await supabase
      .from('kb_documents')
      .select('id, metadata')
      .eq('new_user_id', uid)
      .eq('folder_id', systemFolder.id);
    const roles = new Set((sysDocs ?? []).map((d: { metadata: { role?: string } | null }) => d.metadata?.role));
    const seedDoc = async (role: 'charter' | 'history', title: string, content: string, order: number) => {
      if (roles.has(role)) return;
      await supabase.from('kb_documents').insert({
        new_user_id: uid, folder_id: systemFolder.id, title, content, source: 'user',
        metadata: { role }, display_order: order,
      });
    };
    await seedDoc('charter', 'Charter', CHARTER_SEED, 0);
    await seedDoc('history', 'History', HISTORY_SEED, 1);
  }
  return out;
}

export const usePagesStore = create<PagesStore>((set, get) => ({
  folders: [],
  documents: [],
  activeFolderId: null,
  activeDocId: null,
  saving: false,
  loading: false,
  error: null,
  initialized: false,

  init: async () => {
    const uid = userId();
    if (!uid) return set({ error: 'Not authenticated' });
    set({ loading: true, error: null });

    const { data: folderRows, error: fErr } = await supabase
      .from('kb_folders')
      .select('id, name, is_system, display_order, metadata')
      .eq('new_user_id', uid)
      .order('display_order', { ascending: true });
    if (fErr) return set({ error: fErr.message, loading: false });

    let folders = (folderRows ?? []).map((r) => toFolder(r as FolderRow));
    folders = await ensureReserved(uid, folders);

    const { data: docRows, error: dErr } = await supabase
      .from('kb_documents')
      .select('id, folder_id, title, content, source, metadata, display_order, created_at, updated_at')
      .eq('new_user_id', uid)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (dErr) return set({ error: dErr.message, loading: false });

    const documents = (docRows ?? []).map((r) => toDoc(r as DocRow));
    const firstUser = folders.find((f) => !f.is_system) ?? folders[0] ?? null;
    const firstDoc = firstUser ? documents.filter(inFolder(firstUser.id))[0] : undefined;

    set({
      folders,
      documents,
      activeFolderId: firstUser?.id ?? null,
      activeDocId: firstDoc?.id ?? null,
      loading: false,
      initialized: true,
    });
  },

  setActiveFolder: (id) => {
    const firstDoc = get().documents.filter(inFolder(id))[0];
    set({ activeFolderId: id, activeDocId: firstDoc?.id ?? null });
  },

  setActiveDoc: (id) => set({ activeDocId: id }),

  createFolder: async (name) => {
    const uid = userId();
    if (!uid) return;
    const { data, error } = await supabase
      .from('kb_folders')
      .insert({ new_user_id: uid, name: name.trim() || 'New folder', is_system: false, display_order: get().folders.length })
      .select()
      .single();
    if (error || !data) return set({ error: error?.message ?? 'create folder failed' });
    const folder = toFolder(data as FolderRow);
    set((s) => ({ folders: [...s.folders, folder], activeFolderId: folder.id, activeDocId: null }));
  },

  renameFolder: async (id, name) => {
    const target = get().folders.find((f) => f.id === id);
    if (!target || target.is_system) return;
    const clean = name.trim() || target.name;
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name: clean } : f)) }));
    await supabase.from('kb_folders').update({ name: clean }).eq('id', id);
  },

  deleteFolder: async (id) => {
    const target = get().folders.find((f) => f.id === id);
    if (!target || target.is_system) return;
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      documents: s.documents.map((d) => (d.folder_id === id ? { ...d, folder_id: null } : d)),
      activeFolderId: s.activeFolderId === id ? s.folders.find((f) => !f.is_system && f.id !== id)?.id ?? UNFILED : s.activeFolderId,
      activeDocId: null,
    }));
    await supabase.from('kb_folders').delete().eq('id', id); // FK on delete set null moves docs to Unfiled
  },

  createDocument: async (folderId) => {
    const uid = userId();
    if (!uid) return;
    const { data, error } = await supabase
      .from('kb_documents')
      .insert({ new_user_id: uid, folder_id: folderId === UNFILED ? null : folderId, title: 'Untitled', content: '', source: 'user', display_order: 0 })
      .select()
      .single();
    if (error || !data) return set({ error: error?.message ?? 'create page failed' });
    const doc = toDoc(data as DocRow);
    set((s) => ({ documents: [doc, ...s.documents], activeDocId: doc.id }));
  },

  updateDocument: (id, patch) => {
    // optimistic local update
    set((s) => ({
      saving: true,
      documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch, updated_at: new Date().toISOString() } : d)),
    }));
    // debounced persist (autosave)
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const doc = get().documents.find((d) => d.id === id);
      if (doc) {
        await supabase.from('kb_documents').update({ title: doc.title, content: doc.content }).eq('id', id);
      }
      set({ saving: false });
    }, 800);
  },

  deleteDocument: async (id) => {
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      activeDocId: s.activeDocId === id ? null : s.activeDocId,
    }));
    await supabase.from('kb_documents').delete().eq('id', id);
  },

  reorderDocument: async (id, dir) => {
    const docs = [...get().documents];
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const folderId = docs[idx].folder_id;
    let j = dir === 'up' ? idx - 1 : idx + 1;
    while (j >= 0 && j < docs.length && docs[j].folder_id !== folderId) j += dir === 'up' ? -1 : 1;
    if (j < 0 || j >= docs.length) return;
    // swap display_order values, persist both
    const a = docs[idx], b = docs[j];
    const aOrder = a.display_order, bOrder = b.display_order;
    [docs[idx], docs[j]] = [b, a];
    set({ documents: docs });
    await Promise.all([
      supabase.from('kb_documents').update({ display_order: bOrder }).eq('id', a.id),
      supabase.from('kb_documents').update({ display_order: aOrder }).eq('id', b.id),
    ]);
  },
}));

// Generic seed content (no personal data). The dashboard + nightly brief read
// the `ore` / `goal` / `notes_tag` / `unit` lines below straight off this page —
// edit the values and they take effect (ORE name matches your daily task,
// case-insensitive). Leave a `<placeholder>` and the default is used instead.
const CHARTER_SEED = `# Charter

Edit the values below — the Focus dashboard and the nightly brief read them
from this page. Use your daily-task ORE's exact name.

## Focus ORE
Replace the value after each colon. Match your daily task's name exactly.
- ore: Hard Focus Hours
- unit: hrs
- goal: weekly average >= 6
- notes_tag: focus log

## How it's used
The daily brief analyzes this ORE's outcomes + its per-day notes + any quick
notes tagged with the notes_tag above.`;

const HISTORY_SEED = `# History (curated)

Your established patterns and arc — the prose the weekly report reads for long-range continuity.`;
