import { CATS, CatKey, catLook, mapLook } from '@/lib/stages';

// Status shape swatch: shape + colour (never colour alone). `map` uses the lighter colours made for the navy map.
export default function StatusIcon({ cat, size = 14, weight = 2, map = false }: { cat: CatKey; size?: number; weight?: number; map?: boolean }) {
  const l = map ? mapLook(cat) : catLook(cat);
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" style={{ flex: 'none' }}>
      <path d={CATS[cat].shape} fill={l.fill} stroke={l.stroke} strokeWidth={weight} strokeLinejoin="round" strokeDasharray={l.dash} />
    </svg>
  );
}
