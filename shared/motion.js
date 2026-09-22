// Motion levels: full | calm | off. Persisted per visitor, URL-overridable.
// full  — everything: loops, trails, physics, ambient drift
// calm  — no autonomous loops or trails; direct manipulation still works
// off   — static world; interactions still function, without animation
const LEVELS = ['full', 'calm', 'off'];
const listeners = new Set();
let level = 'full';

export function initMotion(configDefault) {
  const params = new URLSearchParams(location.search);
  const url = params.get('motion');
  const saved = localStorage.getItem('esw:motion');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  level = LEVELS.includes(url) ? url
    : LEVELS.includes(saved) ? saved
    : prefersReduced ? 'calm'
    : LEVELS.includes(configDefault) ? configDefault : 'full';
  apply();
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches && level === 'full') setMotion('calm');
  });
}

export function getMotion() { return level; }

export function setMotion(next) {
  if (!LEVELS.includes(next)) return;
  level = next;
  localStorage.setItem('esw:motion', next);
  apply();
  listeners.forEach((fn) => fn(next));
}

export function cycleMotion() {
  setMotion(LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length]);
}

export function onMotion(fn) { listeners.add(fn); }

// Kinds: 'loop' = autonomous animation, 'ambient' = subtle drifting,
// 'physics' = inertia/springs after user input, 'user' = direct manipulation.
export function allows(kind) {
  if (level === 'off') return kind === 'user';
  if (level === 'calm') return kind === 'user' || kind === 'physics';
  return true;
}

function apply() {
  document.documentElement.dataset.motion = level;
  document.documentElement.classList.toggle('motion-off', level === 'off');
}
