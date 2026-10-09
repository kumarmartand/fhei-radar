import fs from 'node:fs';
import path from 'node:path';

export type Inst = {
  id: string; name: string; country_or_note?: string | null; india_location?: string | null; stage: string; stage_evidence?: string | null;
  lat?: number | null; lon?: number | null; map_city?: string | null; qs_2027?: string | null; founded?: string | null; students?: string | null;
  achievements?: string | null; launch?: string | null; intake?: string | null; courses?: string | null; leadership?: string | null;
  ownership?: string | null; partner?: string | null; service_provider?: string | null; sources?: string[];
};
export type NewsItem = {
  title: string; url: string; source: string; published: string; summary: string; institutions: string[];
  matched_in?: Record<string, string>; confidence?: 'high' | 'medium' | 'sector'; events: string[]; possible_new_entrant?: string[]; first_seen?: string;
};
export type Change = { at: string; type: string; detail: string; url?: string };
export type Health = Record<string, { ok?: boolean; error?: string; items?: number | null; at?: string; last_ok?: string | null; last_run?: string; raw_items?: number; new_relevant_items?: number }>;

const DIR = path.join(process.cwd(), 'data');
function read<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T; } catch { return fallback; }
}
export function getInstitutions(): { as_of?: string; institutions: Inst[] } {
  const d = read<unknown>('institutions.json', { institutions: [] });
  return Array.isArray(d) ? { institutions: d as Inst[] } : (d as { as_of?: string; institutions: Inst[] });
}
export const getNews = () => read<{ fetched: string | null; items: NewsItem[] }>('news.json', { fetched: null, items: [] });
export const getChanges = () => read<Change[]>('changes.json', []).slice().reverse();
export const getHealth = () => read<Health>('source_health.json', {});
export const getUgc = () => read<{ fetched: string | null; rows: { state: string; name: string; address: string }[] }>('ugc_list.json', { fetched: null, rows: [] });
export const getSignals = () => read<Record<string, { on_ugc_list: boolean; checked: string }>>('signals.json', {});

export function nz(v: unknown): string {
  return v === null || v === undefined || String(v).trim() === '' ? 'Not recorded' : String(v).trim();
}
export function fmtDate(iso?: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 'unknown' : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' IST';
}
