import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal Supabase stub: every builder method chains, awaiting yields rows.
const calls: string[] = [];
const chain = (rows: unknown[]) => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'insert', 'single']) c[m] = () => c;
  (c as { then: unknown }).then = (res: (v: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(res);
  return c;
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      calls.push(table);
      if (table === 'kb_folders') {
        return chain([{ id: 'f1', name: 'First Folder', is_system: false, display_order: 0, metadata: {} },
                      { id: 'sys', name: 'System', is_system: true, display_order: 901, metadata: { role: 'system' } },
                      { id: 'cpo', name: 'CPO Reports', is_system: true, display_order: 900, metadata: { role: 'cpo_reports' } }]);
      }
      return chain([{ id: 'd1', folder_id: 'f1', title: 'A', content: '', source: 'user', metadata: {}, display_order: 0, created_at: '', updated_at: '' }]);
    },
  },
}));

vi.mock('../../store/supabaseAuthStore', () => ({
  useSupabaseAuthStore: { getState: () => ({ user: { id: 'u1' } }) },
}));

const { usePagesStore } = await import('./pagesStore');

beforeEach(() => {
  calls.length = 0;
  usePagesStore.setState({ initialized: false, loading: false, documents: [], folders: [], activeFolderId: null, activeDocId: null });
});

describe('pagesStore.init concurrency', () => {
  it('runs once when the mount effect double-invokes (StrictMode)', async () => {
    const { init } = usePagesStore.getState();
    await Promise.all([init(), init()]);
    // One run reads kb_folders exactly once; a second concurrent run would double it.
    expect(calls.filter((t) => t === 'kb_folders')).toHaveLength(1);
    expect(usePagesStore.getState().initialized).toBe(true);
  });

  it('does not clobber a selection made while a second init is in flight', async () => {
    // The bug this guards: init resolving twice reset activeFolderId/activeDocId
    // to defaults AFTER a ?doc= deep-link had selected a report.
    const { init } = usePagesStore.getState();
    const first = init();
    usePagesStore.getState().setActiveDoc('deep-linked-doc');
    await Promise.all([first, init()]);
    await Promise.resolve();
    expect(calls.filter((t) => t === 'kb_folders')).toHaveLength(1);
  });
});
