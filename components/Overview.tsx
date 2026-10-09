'use client';
import { useRouter } from 'next/navigation';
import type { AtlasInst } from '@/lib/atlas';
import { CATS, CatKey, ORDER } from '@/lib/stages';
import Directory from './Directory';
import StatusIcon from './StatusIcon';
import { useFilters, writeStore } from './useFilters';

export default function Overview({ insts, asOf }: { insts: AtlasInst[]; asOf: string }) {
  const router = useRouter();
  const { cats, setCats } = useFilters(insts.map((i) => i.id));
  const teaching = insts.filter((i) => i.cat === 'tc').length;
  const locs = insts.reduce((t, i) => t + i.indiaLocs.length, 0);
  const stats: [string, string][] = [[String(insts.length), 'institutions tracked'], [String(teaching), 'already teaching in India'], [String(locs), 'India campus locations']];
  const showOnMap = (k: CatKey) => {
    const c = { tc: k === 'tc', ap: k === 'ap', loi: k === 'loi', pl: k === 'pl', ot: k === 'ot' };
    setCats(c); writeStore(c, null); router.push('/map');
  };
  return (
    <>
      <section className="wrap hero">
        <div className="eyebrow">Overview &middot; data as of {asOf}</div>
        <h1>International Branch Campuses (IBCs) in India</h1>
        <p>Which foreign universities already teach in India or are moving towards it, where each is based, where its Indian campus is, and how far its approval has progressed.</p>
        <div className="statrow">{stats.map(([n, l]) => <div className="sbox" key={l}><b>{n}</b><span>{l}</span></div>)}</div>
      </section>
      <section className="wrap sec" aria-label="Status at a glance">
        <h2>Status at a glance</h2>
        <p className="lead">Each institution is counted once, under the furthest stage it has reached.</p>
        <div className="tablewrap">
          <table className="st">
            <thead><tr><th scope="col">Status</th><th scope="col">What it means</th><th scope="col" style={{ textAlign: 'right' }}>Institutions</th><th scope="col" style={{ textAlign: 'right' }}>India locations</th><th scope="col"><span style={{ position: 'absolute', left: -9999 }}>Action</span></th></tr></thead>
            <tbody>
              {ORDER.map((k) => {
                const nI = insts.filter((i) => i.cat === k).length, nL = insts.reduce((t, i) => t + (i.cat === k ? i.indiaLocs.length : 0), 0);
                return (
                  <tr key={k}>
                    <td style={{ whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600 }}><StatusIcon cat={k} size={20} />{CATS[k].label}</span></td>
                    <td style={{ color: 'var(--text3)', maxWidth: '46ch' }}>{CATS[k].note}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{nI}</td>
                    <td style={{ textAlign: 'right' }}>{nL}</td>
                    <td style={{ textAlign: 'right' }}><button className="btn sm" onClick={() => showOnMap(k)}>Show on map</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <Directory insts={insts} cats={cats} setCats={setCats} />
    </>
  );
}
