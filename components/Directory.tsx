'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AtlasInst } from '@/lib/atlas';
import { CATS, CatKey, ORDER } from '@/lib/stages';
import Crest from './Crest';
import StatusIcon from './StatusIcon';

type Cats = Record<CatKey, boolean>;
export default function Directory({ insts, cats, setCats }: { insts: AtlasInst[]; cats: Cats; setCats: (c: Cats) => void }) {
  const [q, setQ] = useState('');
  const [hover, setHover] = useState('');
  const needle = q.trim().toLowerCase();
  const allOn = ORDER.every((k) => cats[k]), noneOn = !ORDER.some((k) => cats[k]);
  const groups = useMemo(() => ORDER.filter((k) => cats[k]).map((k) => ({
    k, list: insts.filter((i) => i.cat === k && (!needle || i.name.toLowerCase().includes(needle) || i.mapCity.toLowerCase().includes(needle) || i.country.toLowerCase().includes(needle) || i.homeCity.toLowerCase().includes(needle))),
  })).filter((g) => g.list.length > 0), [insts, cats, needle]);
  const only = (k: CatKey) => setCats({ tc: k === 'tc', ap: k === 'ap', loi: k === 'loi', pl: k === 'pl', ot: k === 'ot' });
  const line = (i: AtlasInst, k: CatKey) => `${i.name}. ${i.country}. ${CATS[k].label}. ${i.mapCity || 'No India city published'}.`;
  return (
    <>
      <section className="wrap sec" aria-label="Directory">
        <h2 style={{ marginBottom: 14 }}>Directory</h2>
        <div className="bar">
          <div className="chips">
            <button className="btn chip" aria-pressed={allOn} onClick={() => setCats({ tc: true, ap: true, loi: true, pl: true, ot: true })}>All {insts.length}</button>
            {ORDER.map((k) => (
              <button key={k} className="btn chip" aria-pressed={cats[k] && !allOn} onClick={() => only(k)}>
                <StatusIcon cat={k} size={13} />&nbsp;{CATS[k].label} {insts.filter((i) => i.cat === k).length}
              </button>
            ))}
          </div>
          <input className="q" type="search" placeholder="Search university, country or city" aria-label="Search university, country or city" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="dock" aria-live="polite">{hover || 'Hover a university to preview it. Select it to open its full page. The status filter here also applies on the Map.'}</div>
      </section>
      <main className="wrap" style={{ paddingBottom: 24 }}>
        {groups.map(({ k, list }) => (
          <section className="group" key={k}>
            <div className="meta"><StatusIcon cat={k} size={22} /><h2>{CATS[k].long}</h2><span className="n">{list.length} {list.length === 1 ? 'university' : 'universities'}. {CATS[k].note}</span></div>
            <div className="tiles">
              {list.map((i) => (
                <Link key={i.id} href={`/university/${i.id}`} className="tile" aria-label={`${i.name}, ${i.country}, ${CATS[k].label}`}
                  onMouseEnter={() => setHover(line(i, k))} onFocus={() => setHover(line(i, k))}>
                  <div className="lg"><Crest logo={i.logo} mono={i.mono} h={56} color={CATS[k].color} /></div>
                  <div className="nm">{i.name}</div>
                  <div className="ct">{i.flag && <img className="flag" src={i.flag} alt="" width={20} height={15} />}<span>{i.country}</span></div>
                  <div className="ci">{i.mapCity ? `India: ${i.mapCity}` : 'No India city published'}</div>
                  <div className="st"><StatusIcon cat={k} size={14} weight={2.4} />{CATS[k].label}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <div className="empty">{noneOn ? 'No status is selected. Choose All, or pick a status above.' : 'No university matches that search. Clear the search or choose All to see every university.'}</div>}
      </main>
    </>
  );
}
