// Run: npx tsx tests/atlas.test.ts   (checks the globe scene logic against the real data)
import fs from 'node:fs';
import assert from 'node:assert';
import { buildAtlas, buildScene, mkCam } from '../lib/atlas';
import type { CatKey } from '../lib/stages';

const insts = buildAtlas(JSON.parse(fs.readFileSync('data/institutions.json', 'utf8')).institutions);
const ALL: Record<CatKey, boolean> = { tc: true, ap: true, loi: true, pl: true, ot: true };
assert.equal(insts.length, 29);
const count = (k: CatKey) => insts.filter((i) => i.cat === k).length;
assert.deepEqual(['tc', 'ap', 'loi', 'pl', 'ot'].map((k) => count(k as CatKey)), [11, 4, 5, 7, 2]);
assert.equal(insts.filter((i) => i.homeLat === null).length, 0, 'every institution has a home campus position');
assert.equal(insts.reduce((t, i) => t + i.indiaLocs.length, 0), 26);
assert.equal(insts.find((i) => i.id === 'university-of-western-australia')!.indiaLocs.length, 2);
assert.ok(insts.every((i) => i.flag), 'every institution has a flag');

const total = (cam: [number, number, number], cats = ALL, sel: string | null = null, s = 1) => {
  const sc = buildScene(insts, cats, sel, mkCam(...cam), s);
  return { sc, n: sc.elems.reduce((t, e) => t + e.items.length, 0) };
};
// India overview: all 26 India locations accounted for (clusters count their members)
const ind = total([79, 21.5, 6.2]);
assert.equal(ind.sc.elems.filter((e) => e.kind === 'in').reduce((t, e) => t + e.items.length, 0), 26);
// Filter synchronisation: teaching only leaves 11 India locations
const tc = total([79, 21.5, 6.2], { tc: true, ap: false, loi: false, pl: false, ot: false });
assert.equal(tc.sc.elems.reduce((t, e) => t + e.items.length, 0), 11);
// City zoom fans out co-located campuses and keeps labels from overlapping
const city = buildScene(insts, ALL, null, mkCam(77.6, 12.97, 11), 1);
assert.ok(city.elems.filter((e) => e.kind === 'in' && e.spider).length >= 6, 'Bengaluru campuses fan out');
assert.ok(city.lines.length >= 6);
const box = (l: (typeof city.labels)[0]) => [l.left, l.top, l.left + l.text.length * 6.5 + 58, l.top + 26];
for (let i = 0; i < city.labels.length; i++) for (let j = i + 1; j < city.labels.length; j++) {
  const a = box(city.labels[i]), b = box(city.labels[j]);
  assert.ok(!(a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]), 'labels overlap');
}
// Global view hides India layer; selection stays individually visible
assert.equal(total([20, 20, 1]).sc.elems.filter((e) => e.kind === 'in').length, 0);
const selected = buildScene(insts, ALL, 'university-of-liverpool', mkCam(77.6, 12.97, 6.2), 1);
assert.ok(selected.elems.some((e) => e.type === 'pin' && e.kind === 'in' && e.items[0].id === 'university-of-liverpool'));
console.log('atlas tests passed');
