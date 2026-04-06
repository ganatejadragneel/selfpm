import { create } from 'zustand';
import type { QuickNote } from '../types';
import { supabase } from '../lib/supabase';
import { useSupabaseAuthStore } from './supabaseAuthStore';

const DEFAULT_FETCH_DAYS = 30;

interface QuickNotesStore {
  notes: QuickNote[];
  loading: boolean;
  error: string | null;
  fetchedFrom: Date | null; // null = all time fetched, Date = lower bound of fetched range

  fetchNotes: (from?: Date | null, to?: Date) => Promise<void>;
  createNote: (title: string, content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, title: string, content: string, tags?: string[]) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useQuickNotesStore = create<QuickNotesStore>((set, _get) => ({
  notes: [],
  loading: false,
  error: null,
  fetchedFrom: new Date(Date.now() - DEFAULT_FETCH_DAYS * 24 * 60 * 60 * 1000),

  // from=undefined → default last 30 days
  // from=null      → no lower bound (all time)
  // from=Date      → custom lower bound
  fetchNotes: async (from?: Date | null, to?: Date) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ loading: true, error: null });

    const lowerBound = from === undefined
      ? new Date(Date.now() - DEFAULT_FETCH_DAYS * 24 * 60 * 60 * 1000)
      : from; // null or specific Date

    let query = supabase
      .from('quick_notes')
      .select('id, title, content, tags, created_at, updated_at')
      .eq('new_user_id', userId)
      .order('created_at', { ascending: false });

    if (lowerBound !== null) query = query.gte('created_at', lowerBound.toISOString());
    if (to) query = query.lte('created_at', to.toISOString());

    const { data, error } = await query;

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const notes: QuickNote[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const resolvedFrom = from === undefined
      ? new Date(Date.now() - DEFAULT_FETCH_DAYS * 24 * 60 * 60 * 1000)
      : from;

    set({ notes, loading: false, fetchedFrom: resolvedFrom });
  },

  createNote: async (title: string, content: string, tags: string[] = []) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ error: null });

    const { data, error } = await supabase
      .from('quick_notes')
      .insert([{ new_user_id: userId, title, content, tags }])
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      return;
    }

    const newNote: QuickNote = {
      id: data.id,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    set(state => ({ notes: [newNote, ...state.notes] }));
  },

  updateNote: async (id: string, title: string, content: string, tags?: string[]) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ error: null });

    const updatePayload: Record<string, unknown> = { title, content };
    if (tags !== undefined) updatePayload.tags = tags;

    const { data, error } = await supabase
      .from('quick_notes')
      .update(updatePayload)
      .eq('id', id)
      .eq('new_user_id', userId)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      return;
    }

    set(state => ({
      notes: state.notes.map(n =>
        n.id === id
          ? { ...n, title: data.title, content: data.content, tags: data.tags ?? n.tags, updatedAt: data.updated_at }
          : n
      ),
    }));
  },

  deleteNote: async (id: string) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ error: null });

    const { error } = await supabase
      .from('quick_notes')
      .delete()
      .eq('id', id)
      .eq('new_user_id', userId);

    if (error) {
      set({ error: error.message });
      return;
    }

    set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
  },
}));
