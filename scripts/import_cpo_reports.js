/**
 * Import CPO/CBO/Sprint/Landmark reports from seekers/<seeker>/reports/
 * into Supabase `kb_documents` as Pages, filed under the reserved
 * "CPO Reports" folder (source='cbo').
 *
 * Mirrors scripts/import_adhoc_notes.js, but reads credentials from the repo's
 * gitignored env files so no key needs to be pasted on the command line.
 *
 * Usage:
 *   node scripts/import_cpo_reports.js --dry-run     # show the plan, write nothing
 *   node scripts/import_cpo_reports.js               # insert missing reports
 *   node scripts/import_cpo_reports.js --update      # also refresh already-imported ones
 *
 * Env resolution (first hit wins, all optional if the files below are present):
 *   URL  <- SUPABASE_URL | VITE_SUPABASE_URL
 *   KEY  <- SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SERVICE_KEY | SERVICE_ROLE_KEY
 *   USER <- USER_EMAIL   (default: gkaushik98@gmail.com)
 * ...read from process.env, then mcp-server/.env, then .env, then .env.local.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const UPDATE = process.argv.includes('--update');
const SEEKER = 'kaushik';

// ── env loading ──────────────────────────────────────────────────────────────
// Parses KEY=VALUE files. Values are never logged — only the variable NAME that
// supplied each credential is printed, so a key can't leak into a terminal log.
function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
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

const ENV_FILES = ['mcp-server/.env', '.env', '.env.local'];
const fileEnv = {};
const envOrigin = {};
for (const rel of ENV_FILES) {
  const parsed = parseEnvFile(join(ROOT, rel));
  for (const [k, v] of Object.entries(parsed)) {
    if (!(k in fileEnv)) {
      fileEnv[k] = v;
      envOrigin[k] = rel;
    }
  }
}

// --list-env prints only the NAMES of variables found in the env files, so a
// key stored under an unexpected name can be located without exposing values.
if (process.argv.includes('--list-env')) {
  for (const [k, v] of Object.entries(envOrigin)) {
    console.log(`  ${v}: ${k}  (${fileEnv[k].length} chars)`);
  }
  process.exit(0);
}

function pick(names) {
  for (const n of names) {
    if (process.env[n]) return { name: n, value: process.env[n], from: 'process.env' };
    if (fileEnv[n]) return { name: n, value: fileEnv[n], from: envOrigin[n] };
  }
  return null;
}

const url = pick(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
const serviceKey = pick(['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SERVICE_ROLE_KEY']);
const anonKey = pick(['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']);
const seekerEmail = pick(['SEEKER_EMAIL', 'USER_EMAIL']);
const seekerPassword = pick(['SEEKER_PASSWORD']);

if (!url) {
  console.error('✗ No Supabase URL found. Set SUPABASE_URL, or add VITE_SUPABASE_URL to .env');
  process.exit(1);
}

// Two ways in, in order of preference:
//   1. anon key + the seeker's own credentials — RLS then scopes every read and
//      write to exactly this user's rows. No admin privileges anywhere.
//   2. service_role key — bypasses RLS, so the user is resolved by email via the
//      admin API. Only used if no credentials are available.
const usePassword = Boolean(anonKey && seekerEmail && seekerPassword);
if (!usePassword && !serviceKey) {
  console.error(
    '✗ No usable credentials.\n' +
      '  Either: VITE_SUPABASE_ANON_KEY + SEEKER_EMAIL + SEEKER_PASSWORD  (preferred)\n' +
      '  Or:     SUPABASE_SERVICE_ROLE_KEY\n' +
      `  Looked in process.env and: ${ENV_FILES.join(', ')}  (run --list-env to see names)`,
  );
  process.exit(1);
}

const activeKey = usePassword ? anonKey : serviceKey;
console.log(`URL  from ${url.from}:${url.name}`);
console.log(`KEY  from ${activeKey.from}:${activeKey.name}  (value not logged)`);
console.log(`AUTH ${usePassword ? `sign-in as ${seekerEmail.name} — RLS enforced` : 'service_role — RLS bypassed'}`);

const supabase = createClient(url.value, activeKey.value, { auth: { persistSession: false } });

/** Returns the user whose rows we will write, by whichever route is available. */
async function resolveUser() {
  if (usePassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: seekerEmail.value,
      password: seekerPassword.value,
    });
    if (error) {
      console.error(`✗ Sign-in failed for ${seekerEmail.value}: ${error.message}`);
      process.exit(1);
    }
    return data.user;
  }
  const email = pick(['USER_EMAIL'])?.value ?? 'gkaushik98@gmail.com';
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(`✗ Could not list users: ${error.message}`);
    console.error('  (This usually means the key is the anon key, not the service_role key.)');
    process.exit(1);
  }
  const user = data.users.find((u) => u.email === email);
  if (!user) {
    console.error(`✗ No user with email ${email}`);
    process.exit(1);
  }
  return user;
}

// ── file discovery ───────────────────────────────────────────────────────────
// All three report directories are flattened into the one CPO Reports folder
// (kb_folders has no parent_id — the schema is deliberately flat).
const REPORT_DIRS = [
  `seekers/${SEEKER}/reports`,
  `seekers/${SEEKER}/reports/landmark_reports`,
  `seekers/${SEEKER}/reports/focus-structure`,
];

// adhoc_journal_notes.md is a 209KB running journal already imported into
// quick_notes by import_adhoc_notes.js — it is not a report.
const EXCLUDE = new Set(['adhoc_journal_notes.md']);

function collectFiles() {
  const files = [];
  for (const dir of REPORT_DIRS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs)) {
      // skip dotfiles: .fuse_hidden* are byte-identical Dropbox/FUSE shadows of
      // reports already present under their real names.
      if (name.startsWith('.')) continue;
      if (!name.endsWith('.md')) continue;
      if (EXCLUDE.has(name)) continue;
      files.push({ relPath: `${dir}/${name}`, absPath: join(abs, name), fileName: name });
    }
  }
  return files;
}

// ── metadata extraction ──────────────────────────────────────────────────────
const MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

function toIsoDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Title, in order: the H1; else the first plausible heading line. The earliest
 * reports (Nov 2025 - Jan 2026) were pasted out of chat and open with a bare
 * indented title line rather than a markdown H1, so a heading-shaped first line
 * is accepted as the title.
 */
function extractTitle(content, fileName) {
  const lines = content.split('\n', 40);
  for (const line of lines) {
    const m = line.match(/^#\s+(.*\S)\s*$/);
    if (m) return m[1].replace(/\s+/g, ' ').trim();
  }
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    // reject table rows, list items, quotes, rules, and bold-label metadata lines
    if (/^[|>\-*_=]/.test(t)) continue;
    if (/^\*\*[\w ]+:\*\*/.test(t)) continue;
    if (t.length > 120) break;
    return t.replace(/^\*+|\*+$/g, '').replace(/\s+/g, ' ').trim();
  }
  return basename(fileName, '.md').replace(/_/g, ' ');
}

/**
 * Report date, best available source:
 *   1. YYYY-MM-DD in the filename          (CBO_Report_2026-06-18_*.md)
 *   2. a **Generated:/Date:/Ended:** line   (Sprint reports date this way)
 *   3. null — undated, sorted to the bottom
 */
function extractDate(content, fileName) {
  const fromName = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  if (fromName) return { date: fromName[1], dateSource: 'filename' };

  const DATE = `(?:${MONTHS})\\s+\\d{1,2},?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2}`;
  const labels = ['Generated', 'Date', 'Compiled', 'Report Date', 'Ended', 'Started'];
  for (const label of labels) {
    const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(${DATE})`, 'i');
    const m = content.match(re);
    if (m) {
      const iso = toIsoDate(m[1]);
      if (iso) return { date: iso, dateSource: `content:${label}` };
    }
  }

  // Last resort: any date in the header block — catches italic subtitles like
  // "*Week of Jan 26, 2026*" that carry no bold label.
  const header = content.split('\n').slice(0, 15).join('\n');
  const bare = header.match(new RegExp(DATE, 'i'));
  if (bare) {
    const iso = toIsoDate(bare[0]);
    if (iso) return { date: iso, dateSource: 'content:header' };
  }
  return { date: null, dateSource: 'none' };
}

function extractReportType(fileName) {
  const n = fileName.toLowerCase();
  if (n.startsWith('landmark')) return 'landmark';
  if (n.startsWith('sprint')) return 'sprint';
  if (n.startsWith('cbo_report') || n.startsWith('cpo_report')) return 'cbo';
  return 'other';
}

function buildRecords() {
  const records = collectFiles().map((f) => {
    const content = readFileSync(f.absPath, 'utf-8');
    const { date, dateSource } = extractDate(content, f.fileName);
    return {
      ...f,
      content,
      title: extractTitle(content, f.fileName),
      date,
      dateSource,
      reportType: extractReportType(f.fileName),
    };
  });

  // Newest first: display_order 0 sits at the top of the Pages list, and the
  // store sorts by display_order ascending.
  records.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.fileName.localeCompare(b.fileName);
  });
  return records;
}

// ── folder resolution ────────────────────────────────────────────────────────
// Matches pagesStore.ensureReserved: metadata.role='cpo_reports', is_system.
async function resolveCpoFolder(uid) {
  const { data, error } = await supabase
    .from('kb_folders')
    .select('id, name, metadata')
    .eq('new_user_id', uid);
  if (error) throw new Error(`kb_folders read failed: ${error.message}`);

  const existing = (data ?? []).find((f) => f.metadata?.role === 'cpo_reports');
  if (existing) return { id: existing.id, name: existing.name, created: false };

  if (DRY_RUN) return { id: '(would be created)', name: 'CPO Reports', created: true };
  const { data: made, error: insErr } = await supabase
    .from('kb_folders')
    .insert({ new_user_id: uid, name: 'CPO Reports', is_system: true, metadata: { role: 'cpo_reports' }, display_order: 900 })
    .select()
    .single();
  if (insErr) throw new Error(`kb_folders insert failed: ${insErr.message}`);
  return { id: made.id, name: made.name, created: true };
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const records = buildRecords();
  console.log(`\nFound ${records.length} report files across ${REPORT_DIRS.length} directories.`);

  const undated = records.filter((r) => !r.date);
  if (undated.length) {
    console.log(`  ⚠ ${undated.length} undated (sorted last): ${undated.map((r) => r.fileName).join(', ')}`);
  }

  const user = await resolveUser();
  console.log(`User: ${user.email} (${user.id})`);

  const folder = await resolveCpoFolder(user.id);
  console.log(`Folder: "${folder.name}" ${folder.created ? '(created)' : `(${folder.id})`}`);

  // Idempotency: metadata.source_file is the natural key for an imported report.
  const { data: existingDocs, error: docErr } = await supabase
    .from('kb_documents')
    .select('id, title, metadata')
    .eq('new_user_id', user.id)
    .eq('source', 'cbo');
  if (docErr) throw new Error(`kb_documents read failed: ${docErr.message}`);

  const bySourceFile = new Map();
  for (const d of existingDocs ?? []) {
    if (d.metadata?.source_file) bySourceFile.set(d.metadata.source_file, d);
  }
  console.log(`Already imported: ${bySourceFile.size}\n`);

  const importedAt = new Date().toISOString();
  const toInsert = [];
  const toUpdate = [];

  records.forEach((r, i) => {
    const row = {
      new_user_id: user.id,
      folder_id: folder.id,
      title: r.title,
      content: r.content,
      source: 'cbo',
      display_order: i,
      metadata: {
        source_file: r.relPath,
        report_type: r.reportType,
        period_date: r.date,
        date_source: r.dateSource,
        imported_at: importedAt,
      },
    };
    const hit = bySourceFile.get(r.relPath);
    if (!hit) toInsert.push({ row, rec: r });
    else if (UPDATE) toUpdate.push({ id: hit.id, row, rec: r });
  });

  const skipped = records.length - toInsert.length - toUpdate.length;
  console.log(`Plan: ${toInsert.length} insert · ${toUpdate.length} update · ${skipped} skip (already present)\n`);

  for (const { row, rec } of toInsert) {
    const kb = (rec.content.length / 1024).toFixed(1);
    console.log(`  + [${String(row.display_order).padStart(2)}] ${rec.date ?? '  undated '}  ${rec.reportType.padEnd(8)} ${kb.padStart(6)}KB  ${row.title.slice(0, 60)}`);
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  // Insert in small batches so one oversized payload can't fail the whole run.
  let inserted = 0;
  const BATCH = 10;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const chunk = toInsert.slice(i, i + BATCH).map((x) => x.row);
    const { error } = await supabase.from('kb_documents').insert(chunk);
    if (error) {
      console.error(`✗ Batch ${i / BATCH + 1} failed: ${error.message}`);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  ...inserted ${inserted}/${toInsert.length}`);
  }

  let updated = 0;
  for (const { id, row } of toUpdate) {
    const { error } = await supabase
      .from('kb_documents')
      .update({ title: row.title, content: row.content, display_order: row.display_order, metadata: row.metadata })
      .eq('id', id);
    if (error) {
      console.error(`✗ Update ${id} failed: ${error.message}`);
      process.exit(1);
    }
    updated += 1;
  }

  // Verify from the server, not from local assumptions.
  const { count, error: cErr } = await supabase
    .from('kb_documents')
    .select('id', { count: 'exact', head: true })
    .eq('new_user_id', user.id)
    .eq('folder_id', folder.id)
    .eq('source', 'cbo');
  if (cErr) console.warn(`(verification count failed: ${cErr.message})`);

  console.log(`\n✓ Done. Inserted ${inserted}, updated ${updated}.`);
  console.log(`  "${folder.name}" now holds ${count ?? '?'} report pages.`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
