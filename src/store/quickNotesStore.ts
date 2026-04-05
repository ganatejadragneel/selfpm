import { create } from 'zustand';
import type { QuickNote } from '../types';
import { supabase } from '../lib/supabase';
import { useSupabaseAuthStore } from './supabaseAuthStore';

interface QuickNotesStore {
  notes: QuickNote[];
  loading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useQuickNotesStore = create<QuickNotesStore>((set, _get) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('quick_notes')
      .select('*')
      .eq('new_user_id', userId)
      .order('created_at', { ascending: false });

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

    set({ notes, loading: false });
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

  updateNote: async (id: string, title: string, content: string) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ error: null });

    const { data, error } = await supabase
      .from('quick_notes')
      .update({ title, content })
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
          ? { ...n, title: data.title, content: data.content, updatedAt: data.updated_at }
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
