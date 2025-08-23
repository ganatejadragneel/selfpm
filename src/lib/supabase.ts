import { createClient } from '@supabase/supabase-js';
import type { Task, Subtask, TaskUpdate, Note } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Task, 'id'>>;
      };
      subtasks: {
        Row: Subtask;
        Insert: Omit<Subtask, 'id' | 'createdAt'>;
        Update: Partial<Omit<Subtask, 'id'>>;
      };
      task_updates: {
        Row: TaskUpdate;
        Insert: Omit<TaskUpdate, 'id' | 'createdAt'>;
        Update: Partial<Omit<TaskUpdate, 'id'>>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id' | 'createdAt'>;
        Update: Partial<Omit<Note, 'id'>>;
      };
    };
  };
};