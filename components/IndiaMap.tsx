'use client';
import Link from 'next/link';
import { useState } from 'react';
import { GROUPS, ORDER, groupOf } from '@/lib/stages';

export type MapUni = { id: string; name: string; stage: string; city: string; lat: number; lon: number };
const POLY = '3.8,46.0 8.1,53.0 12.5,56.0 18.1,54.3 18.1,61.7 21.2,73.3 24.4,82.0 28.8,92.0 32.8,98.0 38.1,94.3 41.6,81.3 50.9,66.0 60.9,58.3 66.6,52.7 68.8,50.0 68.8,38.3 78.1,40.0 87.5,35.0 94.7,31.7 87.5,26.7 78.1,32.3 68.1,34.0 65.6,36.7 53.1,33.7 42.2,29.0 37.5,21.7 35.9,16.7 39.1,11.7 33.7,6.7 25.0,3.3 23.4,10.0 22.5,16.7 25.9,18.3 21.9,21.7 23.4,25.0 15.6,31.7 10.9,31.7 7.8,38.3';
export default function IndiaMap({ unis }: { unis: MapUni[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const by: Record<string, MapUni[]> = {};
  unis.forEach((u) => { (by[u.city] = by[u.city] || []).push(u); });
  const cities = Object.entries(by);
  const cur = sel ? by[sel] : null;
  return (
    <div className="cols">
      <div className="glass mapbox">
        <div className="mapin">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={POLY} fill="rgba(255,255,255,.05)" stroke="rgba(217,194,142,.55)" strokeWidth=".4" vectorEffect="non-scaling-stroke" /></svg>
          {cities.map(([city, list]) => {
            const best = ORDER.find((k) => list.some((u) => groupOf(u.stage) === k))!;
            const col = GROUPS[best].color, size = 30 + list.length * 7, on = sel === city;
            return (
              <button key={city} className="city" aria-label={`${city}, ${list.length} universities`} onClick={() => setSel(city)}
                style={{ left: `${((list[0].lon - 67) / 32) * 100}%`, top: `${((37.5 - list[0].lat) / 30) * 100}%`, width: size, height: size, border: `2px solid ${col}`, background: on ? col + '88' : col + '33', boxShadow: on ? `0 0 0 6px ${col}33` : 'none' }}>
                {list.length}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: '#8FA0BA' }}>Schematic outline for orientation only; borders are not survey-accurate.</div>
      </div>
      <div className="side">
        <h2>{cur ? sel : 'Select a city'}</h2>
        <div className="rows">
          {(cur || []).map((u) => {
            const g = GROUPS[groupOf(u.stage)];
            return (
              <Link key={u.id} href={`/university/${u.id}`} className="glass row" style={{ ['--c' as string]: g.color }}>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{u.name}</span>
                <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><span className="dot" />{g.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
