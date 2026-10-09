import Home from '@/components/Home';
import { getInstitutions } from '@/lib/data';
import { buildAtlas } from '@/lib/atlas';

export default function Page() {
  const { institutions, as_of } = getInstitutions();
  const asOf = as_of ? new Date(as_of + 'T00:00:00Z').toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : '8 October 2026';
  return <Home insts={buildAtlas(institutions)} asOf={asOf} />;
}
