import type { Metadata } from 'next';
import './globals.css';
import Background from '@/components/Background';
import Nav from '@/components/Nav';
import Freshness from '@/components/Freshness';
import { getHealth, fmtDate } from '@/lib/data';

export const metadata: Metadata = { title: 'FHEI Radar', description: 'Foreign higher-education institutions entering India: status, campuses, news and regulator changes.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lastRun = (getHealth()._summary?.last_run as string | undefined) ?? null;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Background />
        <div className="shell">
          <Nav />
          <div className="wrap"><Freshness lastRun={lastRun} label={fmtDate(lastRun)} /></div>
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
