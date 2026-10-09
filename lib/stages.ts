export type CatKey = 'tc' | 'ap' | 'loi' | 'pl' | 'ot';
export type Cat = { label: string; long: string; note: string; color: string; shape: string; solid: boolean; dash: string };
// One status definition shared by the globe, the legend, the filters and the directory.
// Colour and shape both carry the status, so it never depends on colour alone.
export const CATS: Record<CatKey, Cat> = {
  tc: { label: 'Teaching', long: 'Open and teaching', note: 'Already teaching: on the UGC list or registered in GIFT City.', color: '#1B7F5C', shape: 'M10 1.8A8.2 8.2 0 1 1 9.99 1.8Z', solid: true, dash: 'none' },
  ap: { label: 'Approved', long: 'Approved', note: 'Approved in principle, or approved but not yet on the UGC list.', color: '#2457B8', shape: 'M10 1.2L18.8 10L10 18.8L1.2 10Z', solid: true, dash: 'none' },
  loi: { label: 'Letter of Intent', long: 'Letter of Intent', note: 'UGC has issued a letter of intent.', color: '#B26A00', shape: 'M10 2L19 17.5H1L10 2Z', solid: true, dash: 'none' },
  pl: { label: 'Proposed or in talks', long: 'Proposed or in talks', note: 'State talks, an application or reported intent. No approval yet.', color: '#7B4BA8', shape: 'M3.2 3.2H16.8V16.8H3.2Z', solid: false, dash: 'none' },
  ot: { label: 'Other', long: 'Other or not progressing', note: 'Discontinued, or no India campus plan found.', color: '#5F6B7A', shape: 'M10 3A7 7 0 1 1 9.99 3Z', solid: false, dash: '3 2.5' },
};
export const GROUPS = CATS;
// Colours used on the dark map only (the light-theme colours above are too dark against navy).
export const MAPC: Record<CatKey, string> = { tc: '#8FD3B6', ap: '#8DB0FF', loi: '#E8C98A', pl: '#C9A8E6', ot: '#B4BFD0' };
export const ORDER: CatKey[] = ['tc', 'ap', 'loi', 'pl', 'ot'];
export function groupOf(stage: string): CatKey {
  if (stage === 'Operating') return 'tc';
  if (stage === 'Approved in principle' || stage.startsWith('Approved (not')) return 'ap';
  if (stage === 'Letter of Intent') return 'loi';
  if (stage === 'Discontinued' || stage === 'No India campus plan') return 'ot';
  return 'pl';
}
export const catLook = (k: CatKey) => { const c = CATS[k]; return { shape: c.shape, fill: c.solid ? c.color : c.color + '33', stroke: c.color, dash: c.dash }; };
export const mapLook = (k: CatKey) => { const c = CATS[k], m = MAPC[k]; return { shape: c.shape, fill: c.solid ? m : m + '40', stroke: m, dash: c.dash }; };
export const LADDER = ['Reported intent', 'State talks', 'Letter of Intent', 'Approved', 'Open and teaching'];
export const LADDER_INDEX: Record<string, number> = {
  'Reported intent': 0, 'State talks': 1, 'Application / state talks': 1, 'Letter of Intent': 2,
  'Approved in principle': 3, 'Approved (not yet on UGC list)': 3, Operating: 4,
};
export const MONO: Record<string, string> = {
  'deakin-university': 'De', 'university-of-wollongong': 'UoW', 'queen-s-university-belfast': 'QUB', 'coventry-university': 'Co',
  'university-of-surrey': 'Su', 'university-of-southampton': 'So', 'university-of-liverpool': 'Lv', ied: 'IED', 'la-trobe': 'LT',
  'university-of-york': 'Yk', 'university-of-aberdeen': 'Ab', 'illinois-institute-of-technology': 'IIT', 'victoria-university': 'VU',
  'university-of-bristol': 'Br', 'university-of-new-south-wales': 'UNSW', 'university-of-western-australia': 'UWA',
  'western-sydney-university': 'WSU', 'lancaster-university': 'La', 'birkbeck-university-of-london': 'Bb', 'flinders-university': 'Fl',
  'university-of-sussex': 'Sx', 'icn-international-college-paris': 'ICN', 'purdue-university': 'Pu', 'university-of-colorado': 'CU',
  'university-of-exeter': 'Ex', 'university-of-london': 'UoL', 'northeastern-university': 'NE', 'newcastle-university': 'Nc',
  'university-of-birmingham': 'Bm',
};
export const monoOf = (id: string, name: string) => MONO[id] ?? name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3);
