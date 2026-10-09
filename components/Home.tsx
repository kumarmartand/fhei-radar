'use client';
import { useCallback, useEffect, useState } from 'react';
import type { AtlasInst } from '@/lib/atlas';
import type { CatKey } from '@/lib/stages';
import Atlas from './Atlas';
import Directory from './Directory';

type Cats = Record<CatKey, boolean>;
const ALL: Cats = { tc: true, ap: true, loi: true, pl: true, ot: true };
const KEY = 'ibc.atlas.v1';

export default function Home({ insts, asOf }: { insts: AtlasInst[]; asOf: string }) {
  const [cats, setCats] = useState<Cats>(ALL);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);

  // Keep the selected institution and filters when moving between pages; honour ?focus=<id> from a university page.
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && s.cats) setCats({ ...ALL, ...s.cats });
      if (s && typeof s.sel === 'string' && insts.some((i) => i.id === s.sel)) setSel(s.sel);
    } catch { /* storage unavailable: start fresh */ }
    const f = new URLSearchParams(window.location.search).get('focus');
    if (f && insts.some((i) => i.id === f)) { setSel(f); setFocus({ id: f, n: 1 }); window.history.replaceState(null, '', window.location.pathname); }
  }, [insts]);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify({ cats, sel })); } catch { /* ignore */ } }, [cats, sel]);

  const toggle = useCallback((k: CatKey) => setCats((c) => ({ ...c, [k]: !c[k] })), []);
  const instCount = insts.filter((i) => cats[i.cat]).length;
  const teaching = insts.filter((i) => i.cat === 'tc' && cats.tc).length;
  const locCount = insts.reduce((t, i) => t + (cats[i.cat] ? i.indiaLocs.length : 0), 0), locAll = insts.reduce((t, i) => t + i.indiaLocs.length, 0);
  const stats: [string, string][] = [[String(instCount), instCount === insts.length ? 'institutions' : 'institutions shown'], [String(teaching), 'already teaching'], [String(locCount), locCount === locAll ? 'India campus locations' : 'India locations shown']];
  return (
    <>
      <section className="wrap hero">
        <div className="eyebrow">International branch campuses &middot; workbook data as of {asOf}</div>
        <h1>IBC in India</h1>
        <p>Where each foreign university comes from, where its Indian campus is, and how far the approval has gone. Drag the globe, then zoom towards India.</p>
        <div className="statrow">{stats.map(([n, l]) => <div className="glass sbox" key={l}><b>{n}</b><span>{l}</span></div>)}</div>
      </section>
      <Atlas insts={insts} cats={cats} onToggleCat={toggle} sel={sel} onSel={setSel} focus={focus} />
      <Directory insts={insts} cats={cats} setCats={setCats} q={q} setQ={setQ} />
    </>
  );
}
