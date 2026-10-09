import { CATS, CatKey, catLook } from '@/lib/stages';

// Status shape swatch: shape + colour (never colour alone).
export default function StatusIcon({ cat, size = 14, weight = 2 }: { cat: CatKey; size?: number; weight?: number }) {
  const l = catLook(cat);
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" style={{ flex: 'none' }}>
      <path d={CATS[cat].shape} fill={l.fill} stroke={l.stroke} strokeWidth={weight} strokeLinejoin="round" strokeDasharray={l.dash} />
    </svg>
  );
}
