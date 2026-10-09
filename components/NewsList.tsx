import type { NewsItem } from '@/lib/data';

function day(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 'date unknown' : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}
export default function NewsList({ items, names }: { items: NewsItem[]; names?: Record<string, string> }) {
  return (
    <div className="news">
      {items.map((n) => (
        <article className="glass item" key={n.url}>
          <a className="t" href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a>
          <div className="m">
            <span>{n.source}</span><span>{day(n.published)}</span>
            {n.events.filter((e) => e !== 'General').map((e) => <span className="tag gold" key={e}>{e}</span>)}
            {n.institutions.map((i) => <span className="tag" key={i}>{names?.[i] ?? i}{n.matched_in?.[i] ? ` (${n.matched_in[i]})` : ''}</span>)}
            {n.possible_new_entrant?.length ? <span className="tag gold">Possible new entrant: {n.possible_new_entrant.join(', ')}</span> : null}
          </div>
          {n.summary ? <p>{n.summary}</p> : null}
        </article>
      ))}
    </div>
  );
}
