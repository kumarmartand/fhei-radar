'use client';
import { useEffect, useState } from 'react';

export default function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [v, setV] = useState(to); // server render shows the true number; animation is cosmetic only
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0; const start = performance.now() + delay; setV(0);
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / 1600));
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return <span>{v}</span>;
}
