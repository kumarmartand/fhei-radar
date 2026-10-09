'use client';
import { useEffect, useState } from 'react';
import type { CatKey } from '@/lib/stages';

export type Cats = Record<CatKey, boolean>;
export const ALL_CATS: Cats = { tc: true, ap: true, loi: true, pl: true, ot: true };
export const STORE_KEY = 'ibc.atlas.v1';

// Status filters and the selected university are shared by the Overview directory and the Map,
// and survive moving between pages in the same browser tab.
export function writeStore(cats: Cats, sel: string | null) { try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ cats, sel })); } catch { /* storage unavailable */ } }
export function useFilters(validIds: string[]) {
  const [cats, setCats] = useState<Cats>(ALL_CATS);
  const [sel, setSel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      if (s && s.cats) setCats({ ...ALL_CATS, ...s.cats });
      if (s && typeof s.sel === 'string' && validIds.includes(s.sel)) setSel(s.sel);
    } catch { /* start fresh */ }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (ready) writeStore(cats, sel); }, [cats, sel, ready]);
  return { cats, setCats, sel, setSel, ready };
}
