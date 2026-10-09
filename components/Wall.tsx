'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GROUPS, ORDER, GroupKey, groupOf, monoOf } from '@/lib/stages';

export type WallItem = { id: string; name: string; city: string; stage: string };
export default function Wall({ items }: { items: WallItem[] }) {
  const [f, setF] = useState<'all' | GroupKey>('all');
  const [q, setQ] = useState('');
  const [hover, setHover] = useState('');
  const withGroup = useMemo(() => items.map((i) => ({ ...i, g: groupOf(i.stage) })), [items]);
  const needle = q.trim().toLowerCase();
  const groups = ORDER.filter((k) => f === 'all' || f === k).map((k) => ({
    k, list: withGroup.filter((i) => i.g === k && (!needle || i.name.toLowerCase().includes(needle) || i.city.toLowerCase().includes(needle))),
  })).filter((g) => g.list.length > 0);
  let n = 0;
  return (
    <>
      <section className="wrap">
        <div className="glass bar">
          <div className="chips">
            <button className="pill" aria-pressed={f === 'all'} onClick={() => setF('all')}>All {items.length}</button>
            {ORDER.map((k) => (
              <button key={k} className="pill" aria-pressed={f === k} onClick={() => setF(k)}>{GROUPS[k].label} {withGroup.filter((i) => i.g === k).length}</button>
            ))}
          </div>
          <input className="q" type="search" placeholder="Search university or city" aria-label="Search university or city" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="dock" aria-live="polite">{hover || 'Hover a university to preview it. Select it to open the full page.'}</div>
      </section>
      <main className="wrap" style={{ paddingBottom: 40 }}>
        {groups.map(({ k, list }) => (
          <section className="group" key={k}>
            <div className="meta"><h2>{GROUPS[k].label}</h2><span className="muted">{list.length} universities. {GROUPS[k].note}</span></div>
            <div className="tiles">
              {list.map((i) => (
                <Link key={i.id} href={`/university/${i.id}`} className="tile" style={{ ['--c' as string]: GROUPS[k].color, animationDelay: `${Math.min(n++, 40) * 35}ms` }}
                  onMouseEnter={() => setHover(`${i.name}. ${GROUPS[k].label}. ${i.city}.`)} onFocus={() => setHover(`${i.name}. ${GROUPS[k].label}. ${i.city}.`)}
                  aria-label={`${i.name}, ${GROUPS[k].label}`}>
                  <div className="crest">{monoOf(i.id, i.name)}</div>
                  <div style={{ marginTop: 'auto' }}>
                    <div className="nm">{i.name}</div>
                    <div className="ct">{i.city}</div>
                    <div className="st"><span className="dot" />{GROUPS[k].label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <div className="empty" style={{ marginTop: 48 }}>No university matches that search. Clear the search or choose All to see every university.</div>}
      </main>
    </>
  );
}
