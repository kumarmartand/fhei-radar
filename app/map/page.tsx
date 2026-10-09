import IndiaMap, { MapUni } from '@/components/IndiaMap';
import { getInstitutions } from '@/lib/data';

// Gurugram and Greater Noida are ~45 km apart and overlap on a national map, so they are shown as one Delhi NCR marker.
const NCR = new Set(['Gurugram', 'Greater Noida']);
export const metadata = { title: 'India map | FHEI Radar' };
export default function MapPage() {
  const unis: MapUni[] = getInstitutions().institutions
    .filter((i) => typeof i.lat === 'number' && typeof i.lon === 'number' && i.map_city)
    .map((i) => ({ id: i.id, name: i.name, stage: i.stage, city: NCR.has(i.map_city as string) ? 'Delhi NCR' : (i.map_city as string), lat: NCR.has(i.map_city as string) ? 28.4595 : (i.lat as number), lon: NCR.has(i.map_city as string) ? 77.0266 : (i.lon as number) }));
  return (
    <div className="wrap" style={{ paddingBottom: 40 }}>
      <div className="pagehead"><h1>Where they are going</h1>
        <p>Each circle is a city. The number is how many universities are there, and the colour is the most advanced stage in that city. Select a city to list them. Universities with no published city are not shown.</p></div>
      <IndiaMap unis={unis} />
    </div>
  );
}
