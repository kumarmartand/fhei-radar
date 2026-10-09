// Logo image when one is on file, otherwise a plain initials box. Never a made-up logo.
export default function Crest({ logo, mono, h, color, dark = false, maxW }: { logo: string | null; mono: string; h: number; color: string; dark?: boolean; maxW?: number }) {
  if (logo) {
    return dark
      ? <img src={logo} alt="" style={{ height: h, maxWidth: maxW ?? h * 3, width: 'auto', objectFit: 'contain', background: '#fff', borderRadius: 3, padding: '1px 3px', boxSizing: 'border-box', flex: 'none' }} />
      : <img src={logo} alt="" style={{ height: h, maxWidth: maxW ?? '100%', width: 'auto', objectFit: 'contain', objectPosition: 'left center', display: 'block', flex: 'none' }} />;
  }
  return <span aria-hidden="true" style={{ height: h, minWidth: h, padding: '0 6px', boxSizing: 'border-box', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.max(9, Math.round(h * 0.38)), color: dark ? '#fff' : color, background: dark ? 'transparent' : '#F6F8FB', border: `1.5px solid ${color}`, borderRadius: 4 }}>{mono}</span>;
}
