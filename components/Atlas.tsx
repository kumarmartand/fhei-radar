'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LAND from '@/lib/land.json';
import { AtlasInst, MAXK, MINK, D2R, R0, REGIONS, W, arcPath, buildScene, clamp, gratPath, landPath, mkCam, normLon } from '@/lib/atlas';
import { CATS, CatKey, MAPC, ORDER, mapLook } from '@/lib/stages';
import Crest from './Crest';
import StatusIcon from './StatusIcon';

type Cats = Record<CatKey, boolean>;
type Props = { insts: AtlasInst[]; cats: Cats; onToggleCat: (k: CatKey) => void; sel: string | null; onSel: (id: string | null) => void; focus: { id: string; n: number } | null };
const LVL = ['', 'Level 1 · Global overview', 'Level 2 · Regional overview', 'Level 3 · Country overview', 'Level 4 · City detail'];
const world = LAND.world as number[][], india = LAND.india as number[][];

export default function Atlas({ insts, cats, onToggleCat, sel, onSel, focus }: Props) {
  const [cam, setCam] = useState({ lon: 20, lat: 20, k: 1 });
  const [sc, setSc] = useState(1);
  const [spin, setSpin] = useState(true);
  const [hov, setHov] = useState('');
  const [selCamp, setSelCamp] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const camRef = useRef(cam); camRef.current = cam;
  const drag = useRef<{ x: number; y: number; lon: number; lat: number; moved: boolean } | null>(null);
  const swallow = useRef(false), touch = useRef(false), flying = useRef(false), reduced = useRef(false);
  const raf = useRef(0), hideT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const byId = useMemo(() => new Map(insts.map((i) => [i.id, i])), [insts]);

  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduced.current) setSpin(false); }, []);
  useEffect(() => {
    const el = stage.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setSc(clamp(el.getBoundingClientRect().width / W, 0.3, 1.4)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(hideT.current); }, []);
  useEffect(() => {
    const t = setInterval(() => {
      if (!spin || drag.current || flying.current || reduced.current || camRef.current.k > 1.8 || document.hidden) return;
      setCam((c) => ({ ...c, lon: normLon(c.lon + 0.18) }));
    }, 50);
    return () => clearInterval(t);
  }, [spin]);

  const fly = useCallback((to: { lon: number; lat: number; k: number }, ms: number) => {
    const s = camRef.current, dl = normLon(to.lon - s.lon), dist = Math.hypot(dl, to.lat - s.lat);
    cancelAnimationFrame(raf.current); setSpin(false);
    if (reduced.current || !ms) { flying.current = false; setCam({ lon: normLon(s.lon + dl), lat: to.lat, k: to.k }); return; }
    const t0 = performance.now(); flying.current = true;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const lk = Math.log(s.k) + (Math.log(to.k) - Math.log(s.k)) * e - Math.sin(Math.PI * e) * Math.min(1, dist / 80) * 0.55;
      setCam({ lon: normLon(s.lon + dl * e), lat: s.lat + (to.lat - s.lat) * e, k: clamp(Math.exp(lk), MINK, MAXK) });
      if (t < 1) raf.current = requestAnimationFrame(step); else flying.current = false;
    };
    raf.current = requestAnimationFrame(step);
  }, []);
  const zoomBy = (f: number) => { cancelAnimationFrame(raf.current); flying.current = false; setSpin(false); setCam((c) => ({ ...c, k: clamp(c.k * f, MINK, MAXK) })); };
  const pick = (id: string, locIdx: number) => { onSel(id); setSelCamp(locIdx); setHov(''); };

  // "Show on the map" from a university page
  useEffect(() => {
    if (!focus) return; const i = byId.get(focus.id); if (!i) return;
    setSelCamp(0);
    if (i.indiaLocs.length) fly({ lon: i.indiaLocs[0].lon, lat: i.indiaLocs[0].lat, k: 9 }, 1200);
    else if (i.homeLat !== null && i.homeLon !== null) fly({ lon: i.homeLon, lat: i.homeLat, k: 4.5 }, 1200);
  }, [focus, byId, fly]);

  const c3 = mkCam(cam.lon, cam.lat, cam.k);
  const scene = useMemo(() => buildScene(insts, cats, sel, c3, sc), [insts, cats, sel, cam, sc]); // eslint-disable-line react-hooks/exhaustive-deps
  const R = R0 * cam.k;
  const lw = landPath(world, c3), li = cam.k > 2.6 ? landPath(india, c3) : null;
  const selI = sel ? byId.get(sel) ?? null : null;
  const hovEl = hov ? scene.elems.find((e) => e.key === hov) ?? null : null;
  const arcI = hovEl && hovEl.type === 'pin' ? byId.get(hovEl.items[0].id) : selI;
  let arc = '';
  if (arcI && cats[arcI.cat] && arcI.indiaLocs.length && arcI.homeLat !== null && arcI.homeLon !== null) {
    const l = arcI.indiaLocs[Math.min(arcI.id === sel ? selCamp : 0, arcI.indiaLocs.length - 1)];
    arc = arcPath({ lon: arcI.homeLon as number, lat: arcI.homeLat as number }, l, c3);
  }
  const instCount = insts.filter((i) => cats[i.cat]).length, locCount = insts.reduce((t, i) => t + (cats[i.cat] ? i.indiaLocs.length : 0), 0), locAll = insts.reduce((t, i) => t + i.indiaLocs.length, 0);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => { touch.current = e.pointerType === 'touch'; drag.current = { x: e.clientX, y: e.clientY, lon: cam.lon, lat: cam.lat, moved: false }; cancelAnimationFrame(raf.current); flying.current = false; };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 4) { d.moved = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    if (!d.moved) return;
    const vb = W / e.currentTarget.getBoundingClientRect().width, deg = vb / (R0 * camRef.current.k) / D2R;
    setSpin(false); setHov('');
    setCam((c) => ({ ...c, lon: normLon(d.lon - (dx * deg) / Math.max(0.35, Math.cos(d.lat * D2R))), lat: clamp(d.lat + dy * deg, -85, 85) }));
  };
  const onUp = () => { const d = drag.current; drag.current = null; if (d?.moved) { swallow.current = true; setTimeout(() => { swallow.current = false; }, 0); } };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const st = 12 / cam.k, mv: Record<string, [number, number]> = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] };
    if (mv[e.key]) { e.preventDefault(); setSpin(false); setCam((c) => ({ ...c, lon: normLon(c.lon + mv[e.key][0]), lat: clamp(c.lat + mv[e.key][1], -85, 85) })); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.5); } else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(1 / 1.5); }
  };
  const enter = (k: string) => { clearTimeout(hideT.current); setHov(k); };
  const leave = () => { clearTimeout(hideT.current); hideT.current = setTimeout(() => setHov(''), 260); };
  const pct = (v: number) => `${((v / W) * 100).toFixed(3)}%`;

  // hover card geometry
  let cardStyle: React.CSSProperties = {};
  if (hovEl) {
    const right = hovEl.x > W * 0.5, below = hovEl.y > W * 0.55;
    cardStyle = { ...(right ? { right: `calc(${100 - (hovEl.x / W) * 100}% + 22px)` } : { left: `calc(${(hovEl.x / W) * 100}% + 22px)` }), ...(below ? { bottom: `calc(${100 - (hovEl.y / W) * 100}% - 12px)` } : { top: `calc(${(hovEl.y / W) * 100}% - 20px)` }) };
  }
  const hovI = hovEl && hovEl.type === 'pin' ? byId.get(hovEl.items[0].id) ?? null : null;
  const camps = selI ? selI.indiaLocs : [];
  const campNow = camps[Math.min(selCamp, Math.max(0, camps.length - 1))];
  const mates = selI && campNow ? insts.flatMap((o) => o.id === selI.id ? [] : o.indiaLocs.map((l, n) => ({ o, l, n })).filter((x) => x.l.city === campNow.city)) : [];

  return (
    <section className="wrap" aria-label="Globe" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginRight: 6 }}>Go to</span>
          {REGIONS.map(([l, t]) => <button key={l} className="btn chip" onClick={() => fly(t, 1400)}>{l}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 520px', minWidth: 0 }}>
            <div ref={stage} id="ibc-stage" className="stage" tabIndex={0} aria-label="Interactive globe of foreign university campuses. Drag to rotate, plus and minus keys to zoom, arrow keys to turn."
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
              onClick={() => { if (!swallow.current && hov) setHov(''); }}>
              <svg viewBox="0 0 720 720" aria-hidden="true">
                <circle cx="360" cy="360" r={R} fill="#0F2755" stroke="#3A66B5" strokeWidth="1" />
                <path d={gratPath(c3)} fill="none" stroke="rgba(150,185,255,.2)" strokeWidth=".7" />
                <g opacity={cam.k < 4.5 ? 1 : clamp(1 - (cam.k - 4.5) / 1.5, 0, 1)}>
                  <path d={lw.fill} fill="#26437C" />
                  <path d={lw.line} fill="none" stroke="#8FB0EA" strokeWidth=".8" strokeLinejoin="round" />
                </g>
                {li && <g opacity={clamp((cam.k - 2.6) / 1.4, 0, 1)}>
                  <path d={li.fill} fill="#2F4F8E" />
                  <path d={li.line} fill="none" stroke="#BBD2FF" strokeWidth="1" strokeLinejoin="round" />
                </g>}
                <path d={arc} fill="none" stroke="#E8C98A" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
                {scene.lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#9DB6E6" strokeWidth="1" />)}
              </svg>

              {scene.cityLabels.map((c) => <span key={c.text} className="clab" style={{ left: pct(c.left), top: pct(c.top), opacity: scene.ia }}>{c.text}</span>)}

              {scene.elems.map((e) => {
                const op = e.kind === 'in' ? scene.ia : 1, pe = op < 0.3 ? 'none' : 'auto';
                if (e.type === 'pin') {
                  const it = e.items[0], d = byId.get(it.id); if (!d) return null;
                  const on = it.id === sel, look = mapLook(e.cat), sz = (e.spider ? scene.size + 2 : scene.size) + (on ? 6 : 0);
                  return (
                    <button key={e.key} className="mk" aria-pressed={on} aria-label={`${d.name}, ${e.kind === 'home' ? 'home campus, ' + d.homeCity : 'India campus, ' + it.city}, ${CATS[e.cat].label}`}
                      style={{ left: pct(e.x), top: pct(e.y), width: sz, height: sz, opacity: op, pointerEvents: pe, zIndex: on ? 4 : 2, ...(on ? { borderRadius: '50%', boxShadow: '0 0 0 3px #06142F,0 0 0 5px #fff' } : {}) }}
                      onClick={(ev) => { ev.stopPropagation(); if (touch.current) { onSel(it.id); setSelCamp(e.kind === 'in' ? it.locIdx : 0); setHov(e.key); } else pick(it.id, e.kind === 'in' ? it.locIdx : 0); }}
                      onMouseEnter={() => enter(e.key)} onMouseLeave={leave} onFocus={() => enter(e.key)} onBlur={leave}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d={CATS[e.cat].shape} fill="none" stroke="#06142F" strokeWidth="5.5" strokeLinejoin="round" />
                        <path d={CATS[e.cat].shape} fill={look.fill} stroke={look.stroke} strokeWidth="2.2" strokeLinejoin="round" strokeDasharray={look.dash} />
                      </svg>
                    </button>
                  );
                }
                const sz = 28 + Math.min(16, e.items.length * 2.5);
                return (
                  <button key={e.key} className="mk" aria-label={`${e.kind === 'home' ? e.items.length + ' universities with home campuses here' : e.items.length + ' campuses in ' + (e.city || 'this area')}. Zoom in.`}
                    style={{ left: pct(e.x), top: pct(e.y), width: sz, height: sz, opacity: op, pointerEvents: pe, zIndex: 3 }}
                    onClick={(ev) => { ev.stopPropagation(); fly({ lon: e.items.reduce((t, o) => t + o.lon, 0) / e.items.length, lat: e.items.reduce((t, o) => t + o.lat, 0) / e.items.length, k: clamp(cam.k * 2.4, 1, MAXK) }, 900); }}
                    onMouseEnter={() => enter(e.key)} onMouseLeave={leave} onFocus={() => enter(e.key)} onBlur={leave}>
                    <span className="clus" style={{ borderColor: MAPC[e.cat] }}>{e.items.length}</span>
                  </button>
                );
              })}

              {scene.labels.map((l) => {
                const d = byId.get(l.id); if (!d) return null; const look = mapLook(l.cat);
                return (
                  <button key={l.id + l.kind + l.locIdx} className="lab" tabIndex={-1} aria-hidden="true" style={{ left: pct(l.left), top: pct(l.top), opacity: l.kind === 'in' ? scene.ia : 1, zIndex: l.selected ? 5 : 3 }}
                    onClick={(ev) => { ev.stopPropagation(); pick(l.id, l.kind === 'in' ? l.locIdx : 0); }}>
                    <Crest logo={d.logo} mono={d.mono} h={20} maxW={64} dark color={MAPC[l.cat]} />
                    <span>{l.text}</span>
                    <svg viewBox="0 0 20 20" width="10" height="10" aria-hidden="true"><path d={CATS[l.cat].shape} fill={look.fill} stroke={look.stroke} strokeWidth="3" strokeLinejoin="round" /></svg>
                  </button>
                );
              })}

              {hovEl && (
                <div className="hcard" style={cardStyle} role="group" aria-label={hovI ? hovI.name : 'Group of campuses'} onMouseEnter={() => clearTimeout(hideT.current)} onMouseLeave={leave}>
                  {hovI ? (
                    <>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Crest logo={hovI.logo} mono={hovI.mono} h={44} maxW={96} color={CATS[hovI.cat].color} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}>{hovI.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, fontSize: 13, color: 'var(--text2)' }}>{hovI.flag && <img className="flag" src={hovI.flag} alt="" width={20} height={15} />}<span>{hovI.country}</span></div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
                        <span style={{ color: 'var(--muted)' }}>Home campus:</span> {hovI.homeCity}<br />
                        <span style={{ color: 'var(--muted)' }}>Indian campus:</span> {hovI.indiaLocs.length ? hovI.indiaLocs.map((c) => c.city + (c.state ? ', ' + c.state : '')).join(' and ') : hovI.indiaNote ? 'No campus city verified' : 'No India city published'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, fontWeight: 700 }}><StatusIcon cat={hovI.cat} />{CATS[hovI.cat].long}</div>
                      <Link href={`/university/${hovI.id}`} className="vlink">View institution</Link>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{hovEl.kind === 'home' ? `${hovEl.items.length} universities with home campuses here` : `${hovEl.items.length} campuses${hovEl.city ? ' in ' + hovEl.city : ''}`}</div>
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: 'var(--ink)' }}>
                        {hovEl.items.slice(0, 8).map((o) => <li key={o.id + o.locIdx}>{byId.get(o.id)?.name}</li>)}
                        {hovEl.items.length > 8 && <li>and {hovEl.items.length - 8} more</li>}
                      </ul>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>Select to zoom in.</div>
                    </>
                  )}
                </div>
              )}

              <div className="lvl">{LVL[scene.lvl]}</div>
              <button className="btn dk rotb" aria-pressed={spin} onClick={(e) => { e.stopPropagation(); setSpin((v) => !v); }} onPointerDown={(e) => e.stopPropagation()}>{spin ? 'Pause rotation' : 'Rotate'}</button>
              <div className="zoomc" onPointerDown={(e) => e.stopPropagation()}>
                <button className="zb dk" aria-label="Zoom in" onClick={() => zoomBy(1.6)}>+</button>
                <button className="zb dk" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.6)}>&minus;</button>
              </div>
              {cam.k < 1.2 && <div className="hint">Drag to rotate. Use + and &minus; to zoom.</div>}
            </div>
            <p className="geonote">Positions are city-level. Home campuses are main-campus cities; Indian campuses are placed at their city, because site coordinates are not verified. Where several campuses share a city they are fanned out at city zoom for legibility. The outline shows coastlines only; no international or state boundaries are drawn, and it is not a Survey of India map.</p>
          </div>

          <aside style={{ flex: '1 1 320px', maxWidth: 420, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selI ? (
              <div className="panelx" key={selI.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                    <Crest logo={selI.logo} mono={selI.mono} h={60} maxW={130} color={CATS[selI.cat].color} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 24, lineHeight: 1.15, color: 'var(--navy)' }}>{selI.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 14, color: 'var(--text2)' }}>{selI.flag && <img className="flag" src={selI.flag} alt="" width={22} height={16} />}<span>{selI.country}</span></div>
                    </div>
                  </div>
                  <button className="zb" aria-label="Clear selection" style={{ flex: 'none', fontSize: 20, boxShadow: 'none' }} onClick={() => { onSel(null); setHov(''); }}>&times;</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 14, fontWeight: 700 }}><StatusIcon cat={selI.cat} size={16} />{CATS[selI.cat].long} ({selI.stage})</div>
                {!cats[selI.cat] && <div style={{ marginTop: 8, fontSize: 13, color: '#7A4B00' }}>Hidden on the globe by the current filter.</div>}
                <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                  <div className="blk"><div className="bk">Home campus</div><div style={{ marginTop: 4, fontSize: 15 }}>{selI.homeCity}, {selI.country}. City-level position of the main campus.</div></div>
                  <div className="blk navy"><div className="bk" style={{ color: 'var(--navy)' }}>Indian campus</div>
                    {camps.length ? camps.map((c, n) => (
                      <div key={c.city + n} style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5 }}>{c.city}{c.state ? ', ' + c.state : ''}{c.note && c.note !== c.city ? ' — ' + c.note : ''}
                        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{selI.cat === 'pl' ? 'Proposed city only. No campus site has been announced.' : 'City-level position on the globe. Site coordinates are not verified.'}</div></div>
                    )) : <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5 }}>{selI.indiaNote ? 'No campus city verified' : 'No India city published'}<div style={{ fontSize: 13, color: 'var(--text3)' }}>Nothing is placed on the India map for this institution.</div></div>}
                  </div>
                </div>
                <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}><span style={{ color: 'var(--muted)' }}>QS 2027:</span> {selI.qs} &nbsp;&middot;&nbsp; <span style={{ color: 'var(--muted)' }}>Founded:</span> {selI.founded} &nbsp;&middot;&nbsp; <span style={{ color: 'var(--muted)' }}>India launch:</span> {selI.launch}</div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div className="bk">Contacts and leadership</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-line', color: 'var(--ink)' }}>{selI.leadership}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>No phone numbers or email addresses are recorded in the workbook.</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                  {camps.length > 0 && <button className="btn primary" onClick={() => campNow && fly({ lon: campNow.lon, lat: campNow.lat, k: 11 }, 1500)}>{selI.cat === 'pl' ? 'Show proposed city' : 'Explore in India'}</button>}
                  <Link href={`/university/${selI.id}`} className="btn">View institution</Link>
                </div>
                {mates.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <div className="bk">Also in {campNow?.city}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{mates.map((m) => <button key={m.o.id} className="btn chip" onClick={() => pick(m.o.id, m.n)}>{m.o.name}</button>)}</div>
                  </div>
                )}
                {!selI.logo && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>Logo not yet added. Initials are shown instead.</div>}
              </div>
            ) : <div className="emptybox">Select a marker to see the institution: its home campus, its Indian campus, status, contacts and sources. Hover or focus a marker for a quick preview.</div>}

            <div style={{ paddingTop: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ORDER.map((k) => {
                  const nI = insts.filter((i) => i.cat === k).length, nL = insts.reduce((t, i) => t + (i.cat === k ? i.indiaLocs.length : 0), 0), on = cats[k];
                  return (
                    <button key={k} className="lrow" aria-pressed={on} onClick={() => onToggleCat(k)} style={{ borderColor: on ? 'var(--navy)' : undefined, opacity: on ? 1 : 0.55 }}>
                      <span className="chipicon"><StatusIcon cat={k} size={20} map /></span>
                      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{CATS[k].label}</span><span style={{ display: 'block', fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.4 }}>{CATS[k].note}</span></span>
                      <span style={{ fontSize: 13, textAlign: 'right', color: 'var(--ink)', whiteSpace: 'nowrap' }}>{nI} {nI === 1 ? 'institution' : 'institutions'}<br />{nL ? `${nL} India ${nL === 1 ? 'location' : 'locations'}` : 'no India location'}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.55 }}>Showing {instCount} of {insts.length} institutions and {locCount} of {locAll} India locations.</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>Shape and colour both carry the status. An institution is counted once, even when it has more than one Indian campus.</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
