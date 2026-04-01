/**
 * Import adhoc journal notes into the quick_notes Supabase table.
 *
 * Usage:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> USER_EMAIL=<email> node scripts/import_adhoc_notes.js
 *
 * Requires: npm install @supabase/supabase-js  (already in project deps)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_EMAIL = process.env.USER_EMAIL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !USER_EMAIL) {
  console.error('Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_EMAIL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse a date string like "Feb 22, 2026" or "March 28, 2026" from a title
function parseDateFromTitle(title) {
  // Match patterns like "Feb 22, 2026", "Mar 4, 2026", "March 28, 2026"
  const datePattern = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/i;
  const match = title.match(datePattern);
  if (match) {
    const parsed = new Date(match[0]);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
}

async function main() {
  // Look up user by email
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing users:', authError.message);
    process.exit(1);
  }

  const user = authData.users.find(u => u.email === USER_EMAIL);
  if (!user) {
    console.error(`No user found with email: ${USER_EMAIL}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);

  // Read the markdown file
  const filePath = resolve(__dirname, '../seekers/kaushik/reports/adhoc_journal_notes.md');
  const content = readFileSync(filePath, 'utf-8');

  // Split into entries by ## headers (skip the file title which is # not ##)
  const sections = content.split(/^## /m).slice(1); // skip everything before first ##

  const notes = sections.map(section => {
    const lines = section.split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    const createdAt = parseDateFromTitle(title);

    return {
      new_user_id: user.id,
      title,
      content: body,
      ...(createdAt && { created_at: createdAt }),
    };
  }).filter(note => note.content.length > 0);

  console.log(`Parsed ${notes.length} notes from markdown file`);

  // Insert in batches
  const BATCH_SIZE = 10;
  let inserted = 0;

  for (let i = 0; i < notes.length; i += BATCH_SIZE) {
    const batch = notes.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('quick_notes')
      .insert(batch)
      .select('id, title');

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      continue;
    }

    inserted += data.length;
    data.forEach(row => console.log(`  Inserted: ${row.title.substring(0, 60)}...`));
  }

  console.log(`\nDone! Inserted ${inserted}/${notes.length} notes for ${USER_EMAIL}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
