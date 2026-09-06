// CPO Reports tab store. Reads the seeker's reports out of kb_documents and runs
// generation.
//
// Two generation paths, one row shape:
//   dev  → the browser assembles context+payload (RLS session) and POSTs to the
//          Vite middleware, which holds the Anthropic key and calls Claude; the
//          browser then writes the row. Lets the tab work before any deploy.
//   prod → the deployed `generate-cbo-report` edge function does all of it.

import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { gather } from './reportsGather';
import { buildDocumentRow, periodWindow, todayLocal, toGridRows, type ReportGridRow } from './reportsLogic';
import type { KbDocumentRow } from './types';

const userId = () => useSupabaseAuthStore.getState().user?.id ?? null;

export interface GenerateOutcome {
  documentId: string;
  title: string;
  commitmentCount: number;
  warnings: string[];
}

interface ReportsStore {
  rows: ReportGridRow[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  /** Non-fatal notes from the last generation (thin data, unwritten history…). */
  warnings: string[];
  lastGenerated: GenerateOutcome | null;
  initialized: boolean;

  init: () => Promise<void>;
  generate: (days: number) => Promise<GenerateOutcome | null>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  dismissError: () => void;
}

async function cpoFolderId(uid: string): Promise<string> {
  const { data, error } = await supabase.from('kb_folders').select('id, metadata').eq('new_user_id', uid);
  if (error) throw new Error(error.message);
  const found = (data ?? []).find((f) => (f.metadata as { role?: string } | null)?.role === 'cpo_reports');
  if (found) return found.id;

  const { data: made, error: insErr } = await supabase
    .from('kb_folders')
    .insert({ new_user_id: uid, name: 'CPO Reports', is_system: true, metadata: { role: 'cpo_reports' }, display_order: 900 })
    .select('id')
    .single();
  if (insErr || !made) throw new Error(insErr?.message ?? 'could not create the CPO Reports folder');
  return made.id;
}

async function fetchRows(uid: string): Promise<KbDocumentRow[]> {
  const folderId = await cpoFolderId(uid);
  const { data, error } = await supabase
    .from('kb_documents')
    .select('id, title, content, source, metadata, created_at')
    .eq('new_user_id', uid)
    .eq('folder_id', folderId)
    .eq('source', 'cbo');
  if (error) throw new Error(error.message);
  return (data ?? []) as KbDocumentRow[];
}

export const useReportsStore = create<ReportsStore>((set, get) => ({
  rows: [],
  loading: false,
  generating: false,
  error: null,
  warnings: [],
  lastGenerated: null,
  initialized: false,

  init: async () => {
    const uid = userId();
    if (!uid) return set({ error: 'Not authenticated' });
    set({ loading: true, error: null });
    try {
      set({ rows: toGridRows(await fetchRows(uid)), loading: false, initialized: true });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false, initialized: true });
    }
  },

  generate: async (days) => {
    const uid = userId();
    if (!uid) {
      set({ error: 'Not authenticated' });
      return null;
    }
    set({ generating: true, error: null, warnings: [], lastGenerated: null });

    try {
      const { periodStart, periodEnd } = periodWindow(days, todayLocal());
      let outcome: GenerateOutcome;

      if (import.meta.env.DEV) {
        // Browser assembles under RLS; the dev server holds the key.
        const { payload, context, warnings } = await gather(supabase, uid, periodStart, periodEnd);
        const resp = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload, context }),
        });
        const result = await resp.json();
        if (!resp.ok || result.error) throw new Error(result.error ?? `generation failed (${resp.status})`);
        if (!result.body?.trim()) throw new Error('the model returned an empty report — nothing was saved');

        const row = buildDocumentRow({
          uid,
          folderId: await cpoFolderId(uid),
          body: result.body,
          payload,
          commitments: result.commitments ?? [],
          model: result.model ?? 'unknown',
          generatedAt: new Date().toISOString(),
        });
        const { data: inserted, error } = await supabase.from('kb_documents').insert(row).select('id').single();
        if (error || !inserted) throw new Error(error?.message ?? 'could not save the report');

        outcome = {
          documentId: inserted.id,
          title: row.title,
          commitmentCount: row.metadata.commitments.length,
          warnings: [...warnings, ...(result.commitmentParseFailed ? ['the commitments block could not be parsed'] : [])],
        };
      } else {
        const { data, error } = await supabase.functions.invoke('generate-cbo-report', {
          body: { user_id: uid, period_end: periodEnd, days, force: true },
        });
        if (error) throw new Error(error.message);
        const r = data?.results?.[0];
        if (!r || r.error) throw new Error(r?.error ?? 'generation failed');
        if (r.skipped) throw new Error(r.skipped);
        outcome = {
          documentId: r.document_id,
          title: r.title,
          commitmentCount: (r.commitments ?? []).length,
          warnings: r.warnings ?? [],
        };
      }

      // Refetch rather than patching local state: the row the DB holds is the
      // truth, and a failed refetch must not leave a phantom row in the grid.
      set({ rows: toGridRows(await fetchRows(uid)), generating: false, warnings: outcome.warnings, lastGenerated: outcome });
      return outcome;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), generating: false });
      return null;
    }
  },

  updateNotes: async (id, notes) => {
    const uid = userId();
    if (!uid) return;
    const previous = get().rows;
    set({ rows: previous.map((r) => (r.id === id ? { ...r, notes } : r)) });

    // metadata is a whole jsonb column — read-modify-write so the merge does not
    // drop period_date / commitments.
    const { data } = await supabase.from('kb_documents').select('metadata').eq('id', id).single();
    const merged = { ...((data?.metadata as Record<string, unknown>) ?? {}), notes };
    const { error } = await supabase.from('kb_documents').update({ metadata: merged }).eq('id', id);
    if (error) set({ rows: previous, error: `Could not save the note: ${error.message}` });
  },

  dismissError: () => set({ error: null }),
}));
