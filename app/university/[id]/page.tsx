import Link from 'next/link';
import { notFound } from 'next/navigation';
import UniTabs, { Fact, Src } from '@/components/UniTabs';
import { fmtDate, getInstitutions, getNews, getSignals, nz } from '@/lib/data';
import { CATS, LADDER, LADDER_INDEX } from '@/lib/stages';
import { buildAtlas } from '@/lib/atlas';
import Crest from '@/components/Crest';

export function generateStaticParams() { return getInstitutions().institutions.map((i) => ({ id: i.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = getInstitutions().institutions.find((i) => i.id === id);
  return { title: u ? `${u.name} | IBCs in India` : 'IBCs in India' };
}

export default async function University({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = getInstitutions().institutions.find((i) => i.id === id);
  if (!u) notFound();
  const a = buildAtlas([u])[0];
  const g = CATS[a.cat];
  const idx = LADDER_INDEX[u.stage];
  const sig = getSignals()[u.id];
  const news = getNews().items.filter((n) => n.institutions.includes(u.id) && n.confidence !== 'sector').sort((a, b) => (a.published < b.published ? 1 : -1));
  const facts: Fact[] = [
    { k: 'Home country', v: a.country }, { k: 'Home campus', v: `${a.homeCity} (city-level position)` }, { k: 'India location', v: nz(u.india_location) }, { k: 'Launch', v: nz(u.launch) },
    { k: 'First intake', v: nz(u.intake) }, { k: 'Students overall', v: nz(u.students) }, { k: 'Ownership', v: nz(u.ownership) },
  ];
  if (u.partner) facts.push({ k: 'Joint-venture partner', v: u.partner });
  if (u.service_provider) facts.push({ k: 'Service provider', v: u.service_provider });
  if (u.achievements) facts.push({ k: 'Highlights', v: u.achievements });
  const progs = (u.courses || '').split(';').map((s) => s.trim()).filter(Boolean);
  const sources: Src[] = (u.sources || []).map((s) => {
    const m = String(s).match(/^(https?:\/\/\S+)\s*(.*)$/);
    return { url: m ? m[1] : '', label: m ? (m[2] ? m[2].replace(/^\(|\)$/g, '') + ' - ' : '') + m[1] : String(s) };
  });
  const short = u.name.replace(/^University of /, '').replace(/ University$/, '');
  return (
    <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        <Link href="/" className="btn">Back to the overview</Link>
        <Link href={`/map?focus=${u.id}`} className="btn primary">Show on the map</Link>
      </div>
      <div className="udet">
        <main className="umain">
          <div className="uhead">
            <Crest logo={a.logo} mono={a.mono} h={100} maxW={240} color={g.color} />
            <div>
              <h1>{u.name}</h1>
              <p style={{ margin: '10px 0 0', fontSize: 18, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{a.flag && <img className="flag" src={a.flag} alt="" width={28} height={21} style={{ width: 28, height: 21 }} />}<span>{a.country}. {u.map_city ? `Campus: ${u.map_city}.` : 'No India city published.'}</span></p>
            </div>
          </div>
          <div className="stats">
            <div className="stat"><b>{nz(u.qs_2027)}</b><span>QS World Rankings 2027</span></div>
            <div className="stat"><b>{nz(u.founded)}</b><span>Founded</span></div>
            <div className="stat"><b>{nz(u.launch)}</b><span>India campus launch</span></div>
          </div>
          <UniTabs name={u.name} facts={facts} progs={progs.length ? progs : ['Not recorded']} leadership={nz(u.leadership)} sources={sources}
            news={news.slice(0, 30)}
            names={Object.fromEntries(getInstitutions().institutions.map((i) => [i.id, i.name]))} />
        </main>
        <aside className="uside">
          <div className="side">
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>Where {short} stands</h2>
            {idx !== undefined && (
              <div className="ladder">
                {LADDER.map((l, i) => (
                  <div key={l}>
                    <span className="n" style={{ borderColor: i <= idx ? g.color : undefined, background: i === idx ? g.color : i < idx ? g.color + '55' : 'transparent' }} />
                    <span style={{ fontSize: i === idx ? 18 : 15, fontWeight: i === idx ? 600 : 400, color: i === idx ? 'var(--ink)' : 'var(--muted)' }}>{l}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink)' }}>Status: {u.stage}. {nz(u.stage_evidence)}</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text3)', marginTop: 16 }}>
              {sig ? `Automated UGC check (${fmtDate(sig.checked)}): ${sig.on_ugc_list ? 'listed on the UGC foreign-campus page.' : 'not listed on the UGC foreign-campus page.'}` : 'Automated UGC check: not run yet.'}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
