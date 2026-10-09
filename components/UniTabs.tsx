'use client';
import { useState } from 'react';
import type { NewsItem } from '@/lib/data';
import NewsList from './NewsList';

export type Fact = { k: string; v: string };
export type Src = { url: string; label: string };
const TABS = [['over', 'Overview'], ['prog', 'Programmes'], ['lead', 'Leadership'], ['news', 'Latest news'], ['src', 'Sources']] as const;

export default function UniTabs({ facts, progs, leadership, sources, news, name, names }: { facts: Fact[]; progs: string[]; leadership: string; sources: Src[]; news: NewsItem[]; name: string; names?: Record<string, string> }) {
  const [t, setT] = useState<(typeof TABS)[number][0]>('over');
  return (
    <>
      <div className="tabs" role="tablist" aria-label="University details">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" className="btn chip" aria-selected={t === k} onClick={() => setT(k)}>{l}{k === 'news' && news.length ? ` ${news.length}` : ''}</button>
        ))}
      </div>
      <div className="panel" key={t}>
        {t === 'over' && <div className="box">{facts.map((f) => <div className="fact" key={f.k}><div className="k">{f.k}</div><div className="v">{f.v}</div></div>)}</div>}
        {t === 'prog' && <div className="box">{progs.map((p) => <div className="fact" key={p}><div className="v" style={{ fontSize: 17 }}>{p}</div></div>)}</div>}
        {t === 'lead' && <div className="box" style={{ padding: 24, fontSize: 17, lineHeight: 1.7, whiteSpace: 'pre-line', maxWidth: '80ch' }}>{leadership}</div>}
        {t === 'news' && (news.length
          ? <NewsList items={news} names={names} />
          : <div className="empty">No articles matched {name} yet. News appears here after an automated refresh finds an article that names it.</div>)}
        {t === 'src' && <div className="box" style={{ padding: '20px 24px' }}>{sources.length
          ? <ul className="src">{sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}</li>)}</ul>
          : 'Not recorded'}</div>}
      </div>
    </>
  );
}
