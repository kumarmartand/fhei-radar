import NewsFeed from '@/components/NewsFeed';
import { fmtDate, getInstitutions, getNews } from '@/lib/data';

export const metadata = { title: 'News | FHEI Radar' };
export default function NewsPage() {
  const news = getNews();
  const names = Object.fromEntries(getInstitutions().institutions.map((i) => [i.id, i.name]));
  const items = news.items.slice().sort((a, b) => (a.published < b.published ? 1 : -1));
  return (
    <div className="wrap" style={{ paddingBottom: 40 }}>
      <div className="pagehead"><h1>News</h1>
        <p>Articles from Google News, GDELT, trade press and government feeds, filtered for foreign campuses in India and matched to universities by name. Every item links to its original source. Last collected: {fmtDate(news.fetched)}.</p></div>
      <NewsFeed items={items} names={names} />
    </div>
  );
}
