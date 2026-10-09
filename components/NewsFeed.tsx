'use client';
import { useMemo, useState } from 'react';
import type { NewsItem } from '@/lib/data';
import NewsList from './NewsList';

export default function NewsFeed({ items, names }: { items: NewsItem[]; names: Record<string, string> }) {
  const [sector, setSector] = useState(false);
  const [ev, setEv] = useState('all');
  const [who, setWho] = useState('all');
  const [q, setQ] = useState('');
  const events = useMemo(() => Array.from(new Set(items.flatMap((n) => n.events))).sort(), [items]);
  const needle = q.trim().toLowerCase();
  const shown = items.filter((n) =>
    (sector || n.confidence !== 'sector') && (ev === 'all' || n.events.includes(ev)) && (who === 'all' || n.institutions.includes(who)) &&
    (!needle || (n.title + ' ' + n.summary).toLowerCase().includes(needle))).slice(0, 200);
  return (
    <>
      <div className="bar" style={{ marginTop: 28 }}>
        <div className="chips">
          <select aria-label="Event type" value={ev} onChange={(e) => setEv(e.target.value)} className="sel"><option value="all">All events</option>{events.map((e) => <option key={e}>{e}</option>)}</select>
          <select aria-label="University" value={who} onChange={(e) => setWho(e.target.value)} className="sel"><option value="all">All universities</option>{Object.entries(names).sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
          <button className="btn chip" aria-pressed={sector} onClick={() => setSector(!sector)}>Include sector news</button>
        </div>
        <input className="q" type="search" placeholder="Search headlines" aria-label="Search headlines" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="dock">{shown.length} {shown.length === 1 ? 'article' : 'articles'}. {sector ? 'Showing articles that name a tracked university and general sector news.' : 'Showing only articles that name a tracked university.'}</div>
      {items.length === 0
        ? <div className="empty">No articles stored yet. The automated refresh runs every six hours; the first results appear after its first successful run.</div>
        : shown.length === 0 ? <div className="empty">No articles match these filters.</div> : <NewsList items={shown} names={names} />}
    </>
  );
}
