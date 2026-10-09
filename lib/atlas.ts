import type { Inst } from './data';
import { CatKey, ORDER, groupOf, monoOf } from './stages';
import { LOGOS } from './logos';

export const D2R = Math.PI / 180, W = 720, C = 360, R0 = 300, MINK = 0.9, MAXK = 16;

// Home campus: [flag file, country, home city, lat, lon]. City-level positions of the main campus, not surveyed site coordinates.
const GEO: Record<string, [string, string, string, number, number]> = {
  'deakin-university': ['au', 'Australia', 'Geelong (Waurn Ponds)', -38.20, 144.30],
  'university-of-wollongong': ['au', 'Australia', 'Wollongong', -34.405, 150.878],
  'queen-s-university-belfast': ['gb', 'United Kingdom', 'Belfast', 54.585, -5.934],
  'coventry-university': ['gb', 'United Kingdom', 'Coventry', 52.407, -1.512],
  'university-of-surrey': ['gb', 'United Kingdom', 'Guildford', 51.243, -0.589],
  'university-of-southampton': ['gb', 'United Kingdom', 'Southampton', 50.935, -1.396],
  'university-of-liverpool': ['gb', 'United Kingdom', 'Liverpool', 53.407, -2.966],
  ied: ['it', 'Italy', 'Milan', 45.464, 9.190],
  'la-trobe': ['au', 'Australia', 'Melbourne (Bundoora)', -37.721, 145.048],
  'university-of-york': ['gb', 'United Kingdom', 'York', 53.946, -1.031],
  'university-of-aberdeen': ['gb', 'United Kingdom', 'Aberdeen', 57.165, -2.102],
  'illinois-institute-of-technology': ['us', 'United States', 'Chicago', 41.835, -87.627],
  'victoria-university': ['au', 'Australia', 'Melbourne (Footscray)', -37.791, 144.899],
  'university-of-bristol': ['gb', 'United Kingdom', 'Bristol', 51.458, -2.603],
  'university-of-new-south-wales': ['au', 'Australia', 'Sydney (Kensington)', -33.917, 151.231],
  'university-of-western-australia': ['au', 'Australia', 'Perth (Crawley)', -31.981, 115.818],
  'western-sydney-university': ['au', 'Australia', 'Sydney (Parramatta)', -33.815, 151.007],
  'lancaster-university': ['gb', 'United Kingdom', 'Lancaster', 54.010, -2.787],
  'birkbeck-university-of-london': ['gb', 'United Kingdom', 'London (Bloomsbury)', 51.522, -0.130],
  'flinders-university': ['au', 'Australia', 'Adelaide (Bedford Park)', -35.021, 138.572],
  'university-of-sussex': ['gb', 'United Kingdom', 'Brighton (Falmer)', 50.867, -0.087],
  'icn-international-college-paris': ['fr', 'France', 'Paris (La Defense)', 48.892, 2.238],
  'purdue-university': ['us', 'United States', 'West Lafayette', 40.424, -86.921],
  'university-of-colorado': ['us', 'United States', 'Boulder', 40.008, -105.266],
  'university-of-exeter': ['gb', 'United Kingdom', 'Exeter', 50.737, -3.534],
  'university-of-london': ['gb', 'United Kingdom', 'London (Bloomsbury)', 51.522, -0.131],
  'northeastern-university': ['us', 'United States', 'Boston', 42.340, -71.089],
  'newcastle-university': ['gb', 'United Kingdom', 'Newcastle upon Tyne', 54.980, -1.614],
  'university-of-birmingham': ['gb', 'United Kingdom', 'Birmingham', 52.451, -1.931],
};
const STATE_OF: Record<string, string> = { 'GIFT City, Gandhinagar': 'Gujarat', Gurugram: 'Haryana', 'Greater Noida': 'Uttar Pradesh', Bengaluru: 'Karnataka', Mumbai: 'Maharashtra', Hyderabad: 'Telangana', Chennai: 'Tamil Nadu' };
// Additional Indian campuses listed in the workbook beyond the main map_city.
const EXTRA_CAMPUSES: Record<string, { city: string; state: string; lat: number; lon: number; note: string }[]> = {
  'university-of-western-australia': [{ city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, note: 'Second campus listed in the workbook' }],
};

export type IndiaLoc = { city: string; state: string; lat: number; lon: number; note: string };
export type AtlasInst = {
  id: string; name: string; mono: string; cat: CatKey; stage: string; country: string; flag: string | null; homeCity: string;
  homeLat: number | null; homeLon: number | null; mapCity: string; indiaLocs: IndiaLoc[]; indiaNote: string;
  qs: string; founded: string; launch: string; leadership: string; logo: string | null;
};
const nz = (v: unknown) => (v === null || v === undefined || String(v).trim() === '' ? 'Not recorded' : String(v).trim());
export function buildAtlas(insts: Inst[]): AtlasInst[] {
  return insts.map((d) => {
    const g = GEO[d.id];
    const locs: IndiaLoc[] = [];
    if (typeof d.lat === 'number' && typeof d.lon === 'number' && d.map_city) locs.push({ city: d.map_city, state: STATE_OF[d.map_city] ?? '', lat: d.lat, lon: d.lon, note: d.india_location ?? '' });
    (EXTRA_CAMPUSES[d.id] ?? []).forEach((c) => locs.push(c));
    return {
      id: d.id, name: d.name, mono: monoOf(d.id, d.name), cat: groupOf(d.stage), stage: d.stage,
      country: g ? g[1] : 'Not recorded', flag: g ? `/flags/${g[0]}.svg` : null, homeCity: g ? g[2] : 'Not recorded',
      homeLat: g ? g[3] : null, homeLon: g ? g[4] : null, mapCity: d.map_city ?? '', indiaLocs: locs, indiaNote: d.india_location ?? '',
      qs: nz(d.qs_2027), founded: nz(d.founded), launch: nz(d.launch),
      leadership: nz(d.leadership).split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3).join('\n') || 'Not recorded',
      logo: LOGOS[d.id] ?? null,
    };
  });
}

export const REGIONS: [string, { lon: number; lat: number; k: number }][] = [
  ['World', { lon: 20, lat: 20, k: 1 }], ['UK and Europe', { lon: -2, lat: 50, k: 3.4 }], ['Australia', { lon: 135, lat: -28, k: 2.8 }],
  ['North America', { lon: -92, lat: 40, k: 2.5 }], ['India', { lon: 79, lat: 21.5, k: 6.2 }],
];
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const normLon = (l: number) => ((l + 540) % 360) - 180;
export const shortName = (n: string) => { const s = n.replace(/^University of /, 'U. of ').replace(/ University$/, ' Univ.'); return s.length > 26 ? s.slice(0, 25) + '…' : s; };

export type Cam = { lon: number; lat: number; k: number; sp0: number; cp0: number };
export const mkCam = (lon: number, lat: number, k: number): Cam => ({ lon, lat, k, sp0: Math.sin(lat * D2R), cp0: Math.cos(lat * D2R) });
export function proj(lon: number, lat: number, cam: Cam) {
  const l = (lon - cam.lon) * D2R, p = lat * D2R, sp = Math.sin(p), cp = Math.cos(p), cl = Math.cos(l), R = R0 * cam.k;
  return { x: C + R * cp * Math.sin(l), y: C - R * (cam.cp0 * sp - cam.sp0 * cp * cl), v: cam.sp0 * sp + cam.cp0 * cp * cl };
}
// Returns a fill path (hidden points are pushed onto the horizon and joined along it) and a stroke path that only
// contains segments between two visible points, so nothing is drawn along the horizon or across the globe.
function ringPath(r: number[], cam: Cam, R: number): [string, string] {
  let fill = '', stroke = '', any = false, prevHidden = false, prevVis = false, px = 0, py = 0;
  for (let i = 0; i < r.length; i += 2) {
    const p = proj(r[i], r[i + 1], cam); let x = p.x, y = p.y; const hidden = p.v <= 0;
    if (hidden) { const dx = x - C, dy = y - C, m = Math.hypot(dx, dy) || 1; x = C + (dx / m) * R; y = C + (dy / m) * R; } else any = true;
    const xs = x.toFixed(1), ys = y.toFixed(1);
    if (i === 0) fill += `M${xs} ${ys}`;
    else if (hidden && prevHidden) {
      const cross = (px - C) * (y - C) - (py - C) * (x - C);
      fill += `A${R.toFixed(1)} ${R.toFixed(1)} 0 0 ${cross > 0 ? 1 : 0} ${xs} ${ys}`;
    } else fill += `L${xs} ${ys}`;
    if (!hidden) stroke += (prevVis ? 'L' : 'M') + xs + ' ' + ys;
    prevHidden = hidden; prevVis = !hidden; px = x; py = y;
  }
  return any ? [fill + 'Z', stroke] : ['', ''];
}
export function landPath(rings: number[][], cam: Cam): { fill: string; line: string } {
  const R = R0 * cam.k; let fill = '', line = '';
  for (const r of rings) { const [f, l] = ringPath(r, cam, R); fill += f; line += l; }
  return { fill, line };
}
export function gratPath(cam: Cam) {
  const step = cam.k < 2.5 ? 30 : cam.k < 6 ? 10 : 5, span = cam.k < 2.5 ? 180 : cam.k < 6 ? 60 : 30;
  const l0 = Math.floor((cam.lon - span) / step) * step, l1 = cam.lon + span, a0 = Math.max(-80, Math.floor((cam.lat - span) / step) * step), a1 = Math.min(80, cam.lat + span);
  let d = '';
  for (let lo = l0; lo <= l1; lo += step) { let pen = false; for (let la = a0; la <= a1; la += 3) { const p = proj(lo, la, cam); if (p.v > 0) { d += (pen ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); pen = true; } else pen = false; } }
  for (let la = Math.ceil(a0 / step) * step; la <= a1; la += step) { let pen = false; for (let lo = l0; lo <= l1; lo += 3) { const p = proj(lo, la, cam); if (p.v > 0) { d += (pen ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); pen = true; } else pen = false; } }
  return d;
}
export function arcPath(a: { lon: number; lat: number }, b: { lon: number; lat: number }, cam: Cam) {
  const v = (lon: number, lat: number) => { const p = lat * D2R, l = lon * D2R; return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]; };
  const A = v(a.lon, a.lat), B = v(b.lon, b.lat), om = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
  if (om < 1e-3) return '';
  const n = Math.max(16, Math.ceil(om / D2R / 2)); let d = '', pen = false;
  for (let i = 0; i <= n; i++) {
    const t = i / n, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2];
    const p = proj(Math.atan2(y, x) / D2R, Math.asin(clamp(z, -1, 1)) / D2R, cam);
    if (p.v > 0.02) { const f = 1 + 0.22 * (om / Math.PI) * Math.sin(Math.PI * t); d += (pen ? 'L' : 'M') + (C + (p.x - C) * f).toFixed(1) + ' ' + (C + (p.y - C) * f).toFixed(1); pen = true; } else pen = false;
  }
  return d;
}

export type Pt = { kind: 'home' | 'in'; id: string; locIdx: number; city: string; lat: number; lon: number; x: number; y: number; cat: CatKey };
export type Elem = { type: 'pin' | 'cluster'; kind: 'home' | 'in'; items: Pt[]; x: number; y: number; cat: CatKey; key: string; spider?: boolean; ang?: number; city?: string };
export type LabelBox = { id: string; kind: 'home' | 'in'; locIdx: number; text: string; left: number; top: number; cat: CatKey; selected: boolean };
export type Scene = { lvl: 1 | 2 | 3 | 4; size: number; ia: number; elems: Elem[]; lines: { x1: number; y1: number; x2: number; y2: number }[]; labels: LabelBox[]; cityLabels: { text: string; left: number; top: number }[] };

// Pure scene builder: projects markers, clusters them in screen space, fans out same-city campuses at city zoom and places collision-aware labels.
export function buildScene(insts: AtlasInst[], cats: Record<CatKey, boolean>, selId: string | null, cam: Cam, s: number): Scene {
  const k = cam.k, lvl = (k < 2.4 ? 1 : k < 5 ? 2 : k < 9 ? 3 : 4) as 1 | 2 | 3 | 4;
  const size = Math.round(12 + 10 * clamp((k - 1) / 8, 0, 1));
  const ia = clamp((k - 2.2) / 1.2, 0, 1);
  const byId = new Map(insts.map((i) => [i.id, i]));
  const mk = (kind: 'home' | 'in'): Pt[] => {
    const out: Pt[] = [];
    insts.forEach((i) => {
      if (!cats[i.cat]) return;
      const src = kind === 'home' ? (i.homeLat !== null && i.homeLon !== null ? [{ city: i.homeCity, lat: i.homeLat, lon: i.homeLon }] : []) : i.indiaLocs;
      src.forEach((c, n) => {
        const p = proj(c.lon, c.lat, cam);
        if (p.v > 0.02 && p.x > -30 && p.x < W + 30 && p.y > -30 && p.y < W + 30) out.push({ kind, id: i.id, locIdx: n, city: c.city, lat: c.lat, lon: c.lon, x: p.x, y: p.y, cat: i.cat });
      });
    });
    return out;
  };
  const elems: Elem[] = [], lines: Scene['lines'] = [];
  const run = (items: Pt[], kind: 'home' | 'in') => {
    const selItems = items.filter((it) => it.id === selId), rest = items.filter((it) => it.id !== selId).sort((a, b) => ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat));
    selItems.forEach((it) => elems.push({ type: 'pin', kind, items: [it], x: it.x, y: it.y, cat: it.cat, key: `${kind}:${it.id}:${it.locIdx}` }));
    const used = new Set<number>();
    rest.forEach((it, a) => {
      if (used.has(a)) return; used.add(a); const grp = [it];
      rest.forEach((o, b) => { if (!used.has(b) && Math.hypot((o.x - it.x) * s, (o.y - it.y) * s) < 26) { used.add(b); grp.push(o); } });
      if (grp.length === 1) { elems.push({ type: 'pin', kind, items: grp, x: it.x, y: it.y, cat: it.cat, key: `${kind}:${it.id}:${it.locIdx}` }); return; }
      const cx = grp.reduce((t, o) => t + o.x, 0) / grp.length, cy = grp.reduce((t, o) => t + o.y, 0) / grp.length;
      const spread = Math.max(...grp.map((o) => Math.hypot((o.x - cx) * s, (o.y - cy) * s)));
      if (lvl >= 4 && spread < 3 && grp.length <= 8) {
        const r = 34 + grp.length * 5;
        grp.forEach((o, n) => {
          const ang = -Math.PI / 2 + (n * 2 * Math.PI) / grp.length, px = cx + (Math.cos(ang) * r) / s, py = cy + (Math.sin(ang) * r) / s;
          lines.push({ x1: cx, y1: cy, x2: px, y2: py });
          elems.push({ type: 'pin', kind, items: [o], x: px, y: py, cat: o.cat, spider: true, ang, key: `${kind}:${o.id}:${o.locIdx}` });
        });
        return;
      }
      const best = grp.map((o) => o.cat).sort((p, q) => ORDER.indexOf(p) - ORDER.indexOf(q))[0];
      const sameCity = kind === 'in' && grp.every((o) => o.city === grp[0].city) ? grp[0].city : '';
      elems.push({ type: 'cluster', kind, items: grp, x: cx, y: cy, cat: best, city: sameCity, key: `${kind}|` + grp.map((o) => o.id + o.locIdx).join('|') });
    });
  };
  run(mk('home'), 'home'); if (ia > 0.02) run(mk('in'), 'in');

  // labels: progressive and collision-aware
  const boxes: number[][] = [];
  const hit = (b: number[]) => boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  elems.forEach((e) => { const sz = e.type === 'pin' ? size + 4 : 34; boxes.push([e.x * s - sz / 2, e.y * s - sz / 2, e.x * s + sz / 2, e.y * s + sz / 2]); });
  const cityLabels: Scene['cityLabels'] = [];
  if (lvl >= 3) elems.filter((e) => e.type === 'cluster' && e.city && e.kind === 'in').forEach((e) => {
    cityLabels.push({ text: (e.city as string).replace(/, .*/, ''), left: e.x, top: e.y + 24 / s });
    boxes.push([e.x * s - 34, e.y * s + 20, e.x * s + 34, e.y * s + 36]);
  });
  const cap = lvl >= 4 ? 24 : lvl >= 3 ? 10 : 0;
  const nm = (e: Elem) => byId.get(e.items[0].id)?.name ?? '';
  const cand = elems.filter((e) => e.type === 'pin' && (e.items[0].id === selId || cap > 0)).sort((a, b) => {
    const sa = a.items[0].id === selId ? -1 : 0, sb = b.items[0].id === selId ? -1 : 0;
    return (sa - sb) || (ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat)) || nm(a).localeCompare(nm(b));
  });
  const labels: LabelBox[] = []; let placed = 0;
  cand.forEach((e) => {
    const it = e.items[0], isSel = it.id === selId; if (!isSel && placed >= cap) return;
    if (e.kind === 'in' && ia < 0.6 && !isSel) return;
    const text = shortName(nm(e)), w = 20 + 6 + text.length * 6.5 + 10 + 16 + 6, h = 26, off = (size + (isSel ? 6 : 0)) / 2 + 6, px = e.x * s, py = e.y * s;
    const opts = e.spider ? (Math.cos(e.ang ?? 0) >= 0 ? [[px + off, py - h / 2], [px - off - w, py - h / 2]] : [[px - off - w, py - h / 2], [px + off, py - h / 2]])
      : [[px + off, py - h / 2], [px - off - w, py - h / 2], [px - w / 2, py - off - h], [px - w / 2, py + off]];
    for (const o of opts) {
      const b = [o[0], o[1], o[0] + w, o[1] + h];
      if (b[0] < 4 || b[1] < 4 || b[2] > W * s - 4 || b[3] > W * s - 4 || hit(b)) continue;
      boxes.push(b); if (!isSel) placed++;
      labels.push({ id: it.id, kind: e.kind, locIdx: it.locIdx, text, left: b[0] / s, top: b[1] / s, cat: e.cat, selected: isSel });
      break;
    }
  });
  return { lvl, size, ia, elems, lines, labels, cityLabels };
}
