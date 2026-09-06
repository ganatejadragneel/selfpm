import { defineConfig } from 'vitest/config';

// Unit tests cover pure logic only (no DOM, no network) — the app's data modules
// keep their pure functions separate from their Supabase I/O for exactly this reason.
//
// `supabase/functions/**` is included so the DEPLOYED edge-function code is the
// code under test, rather than a copy of it. Its remote Deno import is aliased to
// the installed npm package so Node can load the module unchanged.
export default defineConfig({
  resolve: {
    alias: [{ find: 'https://esm.sh/@supabase/supabase-js@2', replacement: '@supabase/supabase-js' }],
  },
  test: {
    // Node by default; component tests opt into jsdom with a per-file
    // `@vitest-environment jsdom` docblock, so pure-logic suites stay fast.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
  },
});
