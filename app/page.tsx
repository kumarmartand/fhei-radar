import Wall from '@/components/Wall';
import CountUp from '@/components/CountUp';
import { getInstitutions } from '@/lib/data';
import { groupOf } from '@/lib/stages';

export default function Home() {
  const { institutions, as_of } = getInstitutions();
  const open = institutions.filter((i) => groupOf(i.stage) === 'op').length;
  return (
    <>
      <section className="wrap hero">
        <h1><CountUp to={institutions.length} /> foreign universities.<br /><CountUp to={open} delay={200} /> already teach in India.</h1>
        <p>Pick a university to see its campus, programmes, leadership, regulator status, news and sources. Workbook data as of {as_of ? new Date(as_of + 'T00:00:00Z').toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : '8 October 2026'}.</p>
      </section>
      <Wall items={institutions.map((i) => ({ id: i.id, name: i.name, city: i.map_city || 'City not published', stage: i.stage }))} />
    </>
  );
}
