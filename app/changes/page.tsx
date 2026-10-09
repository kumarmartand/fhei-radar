import { fmtDate, getChanges, getHealth, getUgc } from '@/lib/data';

export const metadata = { title: 'Changes | FHEI Radar' };
export default function ChangesPage() {
  const changes = getChanges(), health = getHealth(), ugc = getUgc();
  const sources = Object.entries(health).filter(([k]) => !k.startsWith('_') && !k.endsWith('partial'));
  const sum = health._summary;
  return (
    <div className="wrap" style={{ paddingBottom: 40 }}>
      <div className="pagehead"><h1>Changes</h1>
        <p>The UGC list of foreign campuses is read every six hours. Any campus added or removed, and any possible new entrant found in the news, is logged here with its time.</p></div>

      <div className="glass" style={{ padding: 28, marginTop: 28, maxWidth: 900 }}>
        <h2 style={{ fontSize: 30, marginBottom: 12 }}>UGC list</h2>
        {ugc.rows.length
          ? <><div className="muted" style={{ fontSize: 15, marginBottom: 14 }}>{ugc.rows.length} campuses listed. Last read {fmtDate(ugc.fetched)}.</div>
              <div className="chips">{ugc.rows.map((r) => <span className="tag" key={r.name} style={{ fontSize: 14, padding: '8px 14px' }}>{r.name}</span>)}</div></>
          : <div className="muted">Not read yet. The first automated run fills this.</div>}
      </div>

      <h2 style={{ fontSize: 34, margin: '40px 0 14px' }}>Change log</h2>
      {changes.length === 0
        ? <div className="empty">No changes recorded. A change appears here when the UGC list gains or loses a campus, or when the news mentions a university we do not track.</div>
        : <div className="news">{changes.map((c, i) => (
            <div className="glass item" key={i}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{c.type}</div>
              <div className="m"><span>{fmtDate(c.at)}</span></div>
              <p>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: '#9DB8FF' }}>{c.detail}</a> : c.detail}</p>
            </div>))}</div>}

      <h2 style={{ fontSize: 34, margin: '40px 0 14px' }}>Source health</h2>
      <div className="glass" style={{ padding: '8px 24px', overflowX: 'auto' }}>
        {sources.length === 0 ? <div style={{ padding: '16px 0' }} className="muted">No run recorded yet.</div> : (
          <table className="h"><thead><tr><th>Source</th><th>Last run</th><th>Last success</th><th>Items</th></tr></thead>
            <tbody>{sources.map(([k, v]) => (
              <tr key={k}><td>{k}</td>
                <td>{v.ok ? 'OK' : <span style={{ color: '#E3C58A' }}>Failed: {v.error}</span>}</td>
                <td>{fmtDate(v.last_ok)}</td><td>{v.items ?? ''}</td></tr>))}</tbody></table>)}
      </div>
      {sum?.last_run && <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>Last run {fmtDate(sum.last_run)}: {sum.raw_items} items read, {sum.new_relevant_items} new relevant items.</p>}
    </div>
  );
}
