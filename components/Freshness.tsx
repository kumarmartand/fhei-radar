'use client';
import { useEffect, useState } from 'react';

// Always shows when the automated refresh last ran and how many sources answered.
// Warns when no refresh has completed for 18h (3 missed runs) so nobody trusts stale data.
export default function Freshness({ lastRun, label, ok, total, failed }: { lastRun: string | null; label: string; ok: number; total: number; failed: string[] }) {
  const [ago, setAgo] = useState('');
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!lastRun) { setStale(true); return; }
    const mins = Math.max(0, Math.round((Date.now() - new Date(lastRun).getTime()) / 60000));
    setStale(mins > 18 * 60);
    setAgo(mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 48 * 60 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} days ago`);
  }, [lastRun]);
  if (!lastRun) return <div className="stamp" role="status"><span className="dot warn" aria-hidden="true" />No automated refresh has completed yet. The first run happens within six hours of deployment; until then the news feed is empty. Last refresh: never.</div>;
  return (
    <>
      <div className="stamp" role="status"><span className={stale ? 'dot warn' : 'dot'} aria-hidden="true" />
        Data last refreshed {label}{ago ? ` (${ago})` : ''} &middot; {ok} of {total} sources responded{failed.length ? ` (no response: ${failed.join(', ')})` : ''}
      </div>
      {stale && <div className="banner" role="alert">The automated refresh has not completed since {label}. Treat the news feed as out of date.</div>}
    </>
  );
}
