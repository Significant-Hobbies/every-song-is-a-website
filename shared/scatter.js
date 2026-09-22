// Seeded scatter layout. Places artifacts across the viewport while
// respecting avoid-zones (hero, chrome, panel) and minimum separation.
// Positions are fractions of the viewport so resize keeps the composition.

export function scatter(rng, count, opts = {}) {
  const {
    avoid = [],          // [{x0,y0,x1,y1}] in 0..1 fractions
    margin = { x: 0.05, y: 0.08 },
    minDist = 0.16,
    maxTilt = 8,
  } = opts;

  const points = [];
  let guard = 0;
  while (points.length < count && guard++ < 400) {
    const x = rng.range(margin.x, 1 - margin.x);
    const y = rng.range(margin.y, 1 - margin.y);
    if (avoid.some((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1)) continue;
    if (points.some((p) => Math.hypot(p.x - x, p.y - y) < minDist)) continue;
    points.push({ x, y, rot: rng.range(-maxTilt, maxTilt) });
  }
  // If rejection sampling starves, relax distance and finish the set.
  while (points.length < count) {
    points.push({
      x: rng.range(margin.x, 1 - margin.x),
      y: rng.range(margin.y, 1 - margin.y),
      rot: rng.range(-maxTilt, maxTilt),
    });
  }
  return points;
}

export function place(el, x, y, rot = 0) {
  el.style.left = `${x * 100}%`;
  el.style.top = `${y * 100}%`;
  el.style.setProperty('--rot', `${rot}deg`);
}

// Fractional rect helpers for avoid-zones.
export function rectOf(el) {
  const r = el.getBoundingClientRect();
  const w = innerWidth, h = innerHeight;
  return {
    x0: r.left / w - 0.02, y0: r.top / h - 0.02,
    x1: r.right / w + 0.02, y1: r.bottom / h + 0.02,
  };
}
