// Pages (Knowledge Base) types — mirror the kb_folders / kb_documents schema.
// Field names match the planned tables so the Supabase swap is mechanical.

export interface KbFolder {
  id: string;
  name: string;
  is_system: boolean; // reserved folders (CPO Reports, System) — not deletable/renamable
  display_order: number;
  /** reserved-folder role: 'cpo_reports' | 'system' (from metadata.role) */
  role?: 'cpo_reports' | 'system';
}

export type KbSource = 'user' | 'cbo';
export type KbRole = 'charter' | 'history';

export interface KbDocument {
  id: string;
  folder_id: string | null; // null = Unfiled
  title: string;
  content: string;
  source: KbSource;
  /** config pages carry a role; CPO reports carry period/model in metadata */
  role?: KbRole;
  updated_at: string; // ISO
  created_at: string; // ISO
  display_order: number;
}
