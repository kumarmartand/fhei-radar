'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [['/', 'Universities'], ['/map', 'India map'], ['/news', 'News'], ['/changes', 'Changes']] as const;
export default function Nav() {
  const p = usePathname() || '/';
  const active = (h: string) => (h === '/' ? p === '/' || p.startsWith('/university') : p.startsWith(h));
  return (
    <header className="top">
      <Link href="/" className="brand"><i />FHEI Radar</Link>
      <nav className="main" aria-label="Main">
        {LINKS.map(([h, l]) => (
          <Link key={h} href={h} aria-current={active(h) ? 'page' : undefined}>{l}</Link>
        ))}
      </nav>
    </header>
  );
}
