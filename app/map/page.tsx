import MapView from '@/components/MapView';
import { getInstitutions } from '@/lib/data';
import { buildAtlas } from '@/lib/atlas';

export const metadata = { title: 'Map | IBCs in India' };
export default function MapPage() {
  return <MapView insts={buildAtlas(getInstitutions().institutions)} />;
}
