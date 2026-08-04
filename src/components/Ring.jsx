// A ring's on-screen size (100px default, 78px inside .goal-cell, 54px as
// variant="sm") comes entirely from ambient CSS in theme.css — pass a `size`
// only for the odd one-off, never as the normal path.
export default function Ring({ pct, ringColor = 'var(--accent-necessary)', value, sub, variant = 'default' }) {
  const clamped = Math.min(Math.max(pct, 0), 100);

  if (variant === 'sm') {
    return (
      <div className="ring-sm" style={{ background: `conic-gradient(${ringColor} ${clamped}%, var(--border-tertiary) 0)` }}>
        <div className="hole">
          <div className="v">{value}</div>
          {sub != null && <div className="s">{sub}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ring-wrap">
      <div className="ring" style={{ '--pct': clamped, '--ring-color': ringColor }}>
        <div className="ring-hole">
          <div className="v">{value}</div>
          {sub != null && <div className="s">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
