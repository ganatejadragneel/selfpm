// Pure data builders for the Pages export. Kept free of React so they can be
// unit-tested and reused (CLI / scripts) without a DOM.

import type { KbDocument, KbFolder } from './types';

export type PagesExportFormat = 'csv' | 'json' | 'md';
export type PagesExportScope = 'folder' | 'all';

// ─── Export data builders ────────────────────────────────────────────────────

export interface ExportedPage {
  id: string;
  folder: string;
  title: string;
  content: string;
  source: KbDocument['source'];
  role: string;
  createdAt: string;
  updatedAt: string;
  charCount: number;
  wordCount: number;
  lineCount: number;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function folderNameFor(doc: KbDocument, folders: KbFolder[]): string {
  if (doc.folder_id === null) return 'Unfiled';
  return folders.find((f) => f.id === doc.folder_id)?.name ?? 'Unknown folder';
}

export function buildExportedPage(doc: KbDocument, folders: KbFolder[]): ExportedPage {
  const content = doc.content ?? '';
  return {
    id: doc.id,
    folder: folderNameFor(doc, folders),
    title: doc.title,
    content,
    source: doc.source,
    role: doc.role ?? '',
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    charCount: content.length,
    wordCount: countWords(content),
    lineCount: content ? content.split('\n').length : 0,
  };
}

export function buildJsonExport(docs: KbDocument[], folders: KbFolder[], scope: PagesExportScope): string {
  const pages = docs.map((d) => buildExportedPage(d, folders));
  const payload = {
    export_version: '1.0',
    export_type: 'pages',
    exported_at: new Date().toISOString(),
    scope,
    count: pages.length,
    total_words: pages.reduce((sum, p) => sum + p.wordCount, 0),
    folders: [...new Set(pages.map((p) => p.folder))],
    pages,
  };
  return JSON.stringify(payload, null, 2);
}

export function csvEscape(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function buildCsvExport(docs: KbDocument[], folders: KbFolder[]): string {
  const header =
    'id,folder,title,content,source,role,createdAt,updatedAt,charCount,wordCount,lineCount';
  const rows = docs.map((d) => {
    const p = buildExportedPage(d, folders);
    return [
      csvEscape(p.id),
      csvEscape(p.folder),
      csvEscape(p.title),
      csvEscape(p.content),
      csvEscape(p.source),
      csvEscape(p.role),
      p.createdAt,
      p.updatedAt,
      p.charCount,
      p.wordCount,
      p.lineCount,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

// Markdown: one readable document — grouped by folder, front-matter per page.
// This is the format to hand to an LLM or read yourself.
export function buildMarkdownExport(docs: KbDocument[], folders: KbFolder[], scope: PagesExportScope): string {
  const pages = docs.map((d) => buildExportedPage(d, folders));
  const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);

  const grouped = new Map<string, ExportedPage[]>();
  for (const p of pages) {
    const list = grouped.get(p.folder);
    if (list) list.push(p);
    else grouped.set(p.folder, [p]);
  }

  const out: string[] = [
    '# Pages Export',
    '',
    `- Exported: ${new Date().toISOString()}`,
    `- Scope: ${scope === 'all' ? 'all pages' : 'current folder'}`,
    `- Pages: ${pages.length}`,
    `- Words: ${totalWords.toLocaleString()}`,
    '',
    '## Contents',
    '',
  ];

  for (const [folder, list] of grouped) {
    out.push(`- **${folder}** (${list.length})`);
    for (const p of list) out.push(`  - ${p.title || 'Untitled'}`);
  }
  out.push('', '---', '');

  for (const [folder, list] of grouped) {
    out.push(`## ${folder}`, '');
    for (const p of list) {
      out.push(`### ${p.title || 'Untitled'}`, '');
      out.push(
        `> folder: ${p.folder} · source: ${p.source}${p.role ? ` · role: ${p.role}` : ''} · ` +
          `created: ${p.createdAt.slice(0, 10)} · updated: ${p.updatedAt.slice(0, 10)} · ` +
          `${p.wordCount} words`,
      );
      out.push('', p.content.trim() || '_(empty page)_', '', '---', '');
    }
  }

  return out.join('\n');
}

export function getDateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'pages'
  );
}
