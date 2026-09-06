// Shared Supabase access for the local report CLIs.
//
// Signs in as the seeker with the anon key rather than using a service-role key,
// so RLS scopes every read to their own rows and no privileged key is needed on
// a developer machine. Credentials come from the gitignored env files; only the
// NAME of the variable that supplied each one is ever logged.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ENV_FILES = ['mcp-server/.env', '.env', '.env.local'];

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const raw of readFileSync(path, 'utf-8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && val) out[key] = val;
  }
  return out;
}

const fileEnv: Record<string, string> = {};
const origin: Record<string, string> = {};
for (const rel of ENV_FILES) {
  for (const [k, v] of Object.entries(parseEnvFile(join(ROOT, rel)))) {
    if (!(k in fileEnv)) {
      fileEnv[k] = v;
      origin[k] = rel;
    }
  }
}

function pick(names: string[]): { name: string; value: string } | null {
  for (const n of names) {
    if (process.env[n]) return { name: n, value: process.env[n] as string };
    if (fileEnv[n]) return { name: n, value: fileEnv[n] };
  }
  return null;
}

/**
 * Read a value from process.env or the gitignored env files, by any of several
 * names. Returns the value only — callers must never log it.
 */
export function envValue(names: string[]): string | undefined {
  return pick(names)?.value;
}

export interface SeekerSession {
  supabase: SupabaseClient;
  userId: string;
  email: string;
}

export async function signInAsSeeker(quiet = false): Promise<SeekerSession> {
  const url = pick(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  const key = pick(['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']);
  const email = pick(['SEEKER_EMAIL', 'USER_EMAIL']);
  const password = pick(['SEEKER_PASSWORD']);

  if (!url || !key || !email || !password) {
    throw new Error(
      'Missing credentials. Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY + SEEKER_EMAIL + SEEKER_PASSWORD\n' +
        `Looked in process.env and: ${ENV_FILES.join(', ')}`,
    );
  }

  const supabase = createClient(url.value, key.value, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
  if (error || !data.user) throw new Error(`Sign-in failed for ${email.value}: ${error?.message ?? 'no user'}`);

  if (!quiet) console.log(`Signed in as ${data.user.email} — RLS enforced (key from ${origin[key.name] ?? 'env'}:${key.name})`);
  return { supabase, userId: data.user.id, email: data.user.email ?? email.value };
}

/** Shift an ISO date (YYYY-MM-DD) by whole days, without timezone drift. */
export function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function assertIsoDate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be YYYY-MM-DD, got "${value}"`);
  return value;
}
