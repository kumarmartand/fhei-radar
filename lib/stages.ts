export type GroupKey = 'op' | 'ap' | 'loi' | 'pl';
export const GROUPS: Record<GroupKey, { label: string; note: string; color: string }> = {
  op: { label: 'Open and teaching', note: 'On the UGC list or registered in GIFT City.', color: '#8FD3B6' },
  ap: { label: 'Approved', note: 'Approved in principle, or approved but not yet on the UGC list.', color: '#9DB2E8' },
  loi: { label: 'Letter of Intent', note: 'UGC has issued a letter of intent.', color: '#E3C58A' },
  pl: { label: 'In talks or on hold', note: 'State talks, reported intent, discontinued or no plan.', color: '#C2A5D9' },
};
export const ORDER: GroupKey[] = ['op', 'ap', 'loi', 'pl'];
export function groupOf(stage: string): GroupKey {
  if (stage === 'Operating') return 'op';
  if (stage === 'Approved in principle' || stage.startsWith('Approved (not')) return 'ap';
  if (stage === 'Letter of Intent') return 'loi';
  return 'pl';
}
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
