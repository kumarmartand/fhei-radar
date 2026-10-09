// Official logo when a verified file exists, otherwise a consistent initials fallback. Never a made-up logo.
export default function Crest({ logo, mono, size, color }: { logo: string | null; mono: string; size: number; color: string }) {
  if (logo) return <img src={logo} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'contain', background: '#fff', flex: 'none' }} />;
  return <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: Math.round(size * 0.44), color: 'var(--ivory)', background: 'rgba(255,255,255,.06)', border: `1.5px solid ${color}` }}>{mono}</span>;
}
