'use client';
import { useEffect, useState } from 'react';

// Warns when the automated refresh has not completed for 18h (3 missed runs) so nobody trusts stale data.
export default function Freshness({ lastRun, label }: { lastRun: string | null; label: string }) {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!lastRun) { setStale(true); return; }
    setStale(Date.now() - new Date(lastRun).getTime() > 18 * 3600 * 1000);
  }, [lastRun]);
  if (!lastRun) return <div className="banner" role="status">No automated refresh has completed yet. The first run happens within six hours of deployment; until then the news and change feeds are empty. Last refresh: never.</div>;
  if (stale) return <div className="banner" role="status">The automated refresh has not completed since {label}. Treat news and change feeds as out of date and check the source health panel on the Changes page.</div>;
  return null;
}
