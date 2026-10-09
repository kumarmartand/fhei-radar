export default function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="orb" style={{ width: 560, height: 560, left: -160, top: 120, background: '#35508F' }} />
      <div className="orb" style={{ width: 520, height: 520, right: -120, top: 620, background: '#2B6F73', animationDelay: '-8s' }} />
      <div className="orb" style={{ width: 460, height: 460, left: '30%', top: 1100, background: '#5B4C8F', animationDelay: '-14s' }} />
      <div className="grid" />
    </div>
  );
}
