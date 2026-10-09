'use client';
import { useCallback, useEffect, useState } from 'react';
import type { AtlasInst } from '@/lib/atlas';
import type { CatKey } from '@/lib/stages';
import Atlas from './Atlas';
import { useFilters } from './useFilters';

export default function MapView({ insts }: { insts: AtlasInst[] }) {
  const { cats, setCats, sel, setSel, ready } = useFilters(insts.map((i) => i.id));
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  // "Show on the map" from a university page arrives as /map?focus=<id>
  useEffect(() => {
    if (!ready) return;
    const f = new URLSearchParams(window.location.search).get('focus');
    if (f && insts.some((i) => i.id === f)) {
      setCats({ tc: true, ap: true, loi: true, pl: true, ot: true }); setSel(f); setFocus({ id: f, n: 1 });
      window.history.replaceState(null, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const toggle = useCallback((k: CatKey) => setCats((c) => ({ ...c, [k]: !c[k] })), [setCats]);
  return (
    <>
      <section className="wrap pagehead">
        <div className="eyebrow">Map</div>
        <h1>Where IBCs come from and where they land</h1>
        <p>Each marker is a main campus overseas. Hover or select one to see its Indian campus. Drag to turn the globe, then zoom towards India for city detail.</p>
      </section>
      <Atlas insts={insts} cats={cats} onToggleCat={toggle} sel={sel} onSel={setSel} focus={focus} />
    </>
  );
}
