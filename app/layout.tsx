import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Freshness from '@/components/Freshness';
import { getHealth, fmtDate } from '@/lib/data';

export const metadata: Metadata = { title: 'IBCs in India', description: 'International branch campuses (IBCs) in India: where each foreign university comes from, where its campus is, and its approval status.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const health = getHealth();
  const lastRun = (health._summary?.last_run as string | undefined) ?? null;
  const srcs = Object.entries(health).filter(([k]) => !k.startsWith('_') && !k.endsWith('partial')) as [string, { ok?: boolean }][];
  const failed = srcs.filter(([, v]) => v.ok === false).map(([k]) => k);
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <div className="topbar" />
          <Nav />
          <div className="stampbar"><Freshness lastRun={lastRun} label={fmtDate(lastRun)} ok={srcs.length - failed.length} total={srcs.length} failed={failed} /></div>
          {children}
          <div className="wrap">
            <footer className="f">
              Statuses and facts come from an audited workbook (as of 8 October 2026) and official regulator pages. News is collected automatically every six hours from public feeds and is matched to universities by name; each item links to its original source. The dashboard never changes a university's status on its own.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
