'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AtlasInst } from '@/lib/atlas';
import { CATS, CatKey, ORDER } from '@/lib/stages';
import Crest from './Crest';
import StatusIcon from './StatusIcon';

type Cats = Record<CatKey, boolean>;
export default function Directory({ insts, cats, setCats, q, setQ }: { insts: AtlasInst[]; cats: Cats; setCats: (c: Cats) => void; q: string; setQ: (v: string) => void }) {
  const [hover, setHover] = useState('');
  const needle = q.trim().toLowerCase();
  const allOn = ORDER.every((k) => cats[k]), noneOn = !ORDER.some((k) => cats[k]);
  const groups = useMemo(() => ORDER.filter((k) => cats[k]).map((k) => ({
    k, list: insts.filter((i) => i.cat === k && (!needle || i.name.toLowerCase().includes(needle) || i.mapCity.toLowerCase().includes(needle) || i.country.toLowerCase().includes(needle) || i.homeCity.toLowerCase().includes(needle))),
  })).filter((g) => g.list.length > 0), [insts, cats, needle]);
  const only = (k: CatKey) => setCats({ tc: k === 'tc', ap: k === 'ap', loi: k === 'loi', pl: k === 'pl', ot: k === 'ot' });
  let n = 0;
  return (
    <>
      <section className="wrap" style={{ paddingTop: 34 }}>
        <h2 style={{ fontSize: 44, marginBottom: 16 }}>Directory</h2>
        <div className="glass bar">
          <div className="chips">
            <button className="pill" aria-pressed={allOn} onClick={() => setCats({ tc: true, ap: true, loi: true, pl: true, ot: true })}>All {insts.length}</button>
            {ORDER.map((k) => (
              <button key={k} className="pill" aria-pressed={cats[k] && !allOn} onClick={() => only(k)}><StatusIcon cat={k} size={13} />&nbsp;{CATS[k].label} {insts.filter((i) => i.cat === k).length}</button>
            ))}
          </div>
          <input className="q" type="search" placeholder="Search university, country or city" aria-label="Search university, country or city" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="dock" aria-live="polite">{hover || 'Hover a university to preview it. Select it to open the full page. Filters here match the globe.'}</div>
      </section>
      <main className="wrap" style={{ paddingBottom: 40 }}>
        {groups.map(({ k, list }) => (
          <section className="group" key={k}>
            <div className="meta" style={{ alignItems: 'center' }}><StatusIcon cat={k} size={24} /><h2>{CATS[k].long}</h2><span className="muted">{list.length} {list.length === 1 ? 'university' : 'universities'}. {CATS[k].note}</span></div>
            <div className="tiles">
              {list.map((i) => (
                <Link key={i.id} href={`/university/${i.id}`} className="tile" style={{ ['--c' as string]: CATS[k].color, animationDelay: `${Math.min(n++, 40) * 35}ms` }}
                  onMouseEnter={() => setHover(`${i.name}. ${i.country}. ${CATS[k].label}. ${i.mapCity || 'No India city published'}.`)} onFocus={() => setHover(`${i.name}. ${i.country}. ${CATS[k].label}. ${i.mapCity || 'No India city published'}.`)}
                  aria-label={`${i.name}, ${i.country}, ${CATS[k].label}`}>
                  <div className="crestw"><Crest logo={i.logo} mono={i.mono} size={54} color={CATS[k].color} />{i.flag && <img className="flagb" src={i.flag} alt="" width={26} height={19} />}</div>
                  <div style={{ marginTop: 'auto' }}>
                    <div className="nm">{i.name}</div>
                    <div className="ct">{i.country}</div>
                    <div className="ct" style={{ marginTop: 2 }}>{i.mapCity ? `India: ${i.mapCity}` : 'No India city published'}</div>
                    <div className="st"><StatusIcon cat={k} size={13} weight={2.4} />{CATS[k].label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <div className="empty" style={{ marginTop: 48 }}>{noneOn ? 'No status is selected. Choose All, or turn a status on in the legend.' : 'No university matches that search. Clear the search or choose All to see every university.'}</div>}
      </main>
    </>
  );
}
