// Reusable behaviours: the motion and interaction vocabulary every theme
// shares. All autonomous effects check the motion level; direct manipulation
// always works.
import { allows, getMotion, onMotion } from './motion.js';

let zTop = 10;
export function bringToFront(el) { el.style.zIndex = ++zTop; }

export function setPos(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

// Positions are stored in px on the element (dataset.fx/fy) once dragged,
// so a dragged object stays where it lands.
export function draggable(el, opts = {}) {
  const {
    handle = el,
    inertia = false,
    roll = false,        // rotate proportional to horizontal travel (fruit)
    onGrab, onMove, onRelease,
  } = opts;
  let active = false, px = 0, py = 0, vx = 0, vy = 0, lx = 0, ly = 0, lt = 0;
  let rollDeg = 0, raf = 0;

  handle.style.touchAction = 'none';
  handle.classList.add('can-drag');
  // keyboard: arrows nudge, shift+arrows fling-ish
  if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
  el.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 48 : 14;
    const keys = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!keys[e.key]) return;
    e.preventDefault();
    const parent = el.offsetParent?.getBoundingClientRect() ?? { width: innerWidth, height: innerHeight };
    const cur = el.dataset.fx !== undefined
      ? { x: parseFloat(el.dataset.fx), y: parseFloat(el.dataset.fy) }
      : { x: el.offsetLeft, y: el.offsetTop };
    const x = Math.min(Math.max(cur.x + keys[e.key][0] * step, -el.offsetWidth * 0.3), parent.width - el.offsetWidth * 0.7);
    const y = Math.min(Math.max(cur.y + keys[e.key][1] * step, 0), parent.height - el.offsetHeight * 0.6);
    el.dataset.fx = x; el.dataset.fy = y;
    setPos(el, x, y);
    bringToFront(el);
  });

  handle.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    if (e.target.closest('button, a, input, select, textarea, [data-nodrag]')) return;
    active = true;
    cancelAnimationFrame(raf);
    try { handle.setPointerCapture(e.pointerId); } catch {}
    const r = el.getBoundingClientRect();
    px = e.clientX - r.left;
    py = e.clientY - r.top;
    lx = e.clientX; ly = e.clientY; lt = performance.now();
    vx = vy = 0;
    el.classList.add('is-dragging');
    bringToFront(el);
    onGrab?.(e);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!active) return;
    const parent = el.offsetParent?.getBoundingClientRect()
      ?? { left: 0, top: 0, width: innerWidth, height: innerHeight };
    let x = e.clientX - parent.left - px;
    let y = e.clientY - parent.top - py;
    x = Math.min(Math.max(x, -el.offsetWidth * 0.35), parent.width - el.offsetWidth * 0.65);
    y = Math.min(Math.max(y, -el.offsetHeight * 0.2), parent.height - el.offsetHeight * 0.6);
    const t = performance.now();
    const dt = Math.max(1, t - lt);
    vx = ((e.clientX - lx) / dt) * 16;
    vy = ((e.clientY - ly) / dt) * 16;
    lx = e.clientX; ly = e.clientY; lt = t;
    if (roll) {
      rollDeg += vx * 0.25;
      el.style.setProperty('--rot', `${rollDeg.toFixed(1)}deg`);
    }
    el.dataset.fx = x; el.dataset.fy = y;
    setPos(el, x, y);
    onMove?.({ vx, vy, x, y });
  });

  const end = (e) => {
    if (!active) return;
    active = false;
    el.classList.remove('is-dragging');
    onRelease?.({ vx, vy });
    if (inertia && allows('physics')) fling(el, vx, vy, roll);
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);

  function fling(elm, ivx, ivy, doRoll) {
    let x = parseFloat(elm.dataset.fx), y = parseFloat(elm.dataset.fy);
    let sx = ivx, sy = ivy, deg = rollDeg;
    const step = () => {
      const parent = elm.offsetParent?.getBoundingClientRect()
        ?? { width: innerWidth, height: innerHeight };
      x += sx; y += sy;
      sx *= 0.955; sy *= 0.955;
      if (x < -elm.offsetWidth * 0.2) { x = -elm.offsetWidth * 0.2; sx = Math.abs(sx) * 0.55; }
      if (x > parent.width - elm.offsetWidth * 0.8) { x = parent.width - elm.offsetWidth * 0.8; sx = -Math.abs(sx) * 0.55; }
      if (y < 0) { y = 0; sy = Math.abs(sy) * 0.55; }
      if (y > parent.height - elm.offsetHeight * 0.7) { y = parent.height - elm.offsetHeight * 0.7; sy = -Math.abs(sy) * 0.55; }
      if (doRoll) { deg += sx * 0.22; elm.style.setProperty('--rot', `${deg.toFixed(1)}deg`); }
      elm.dataset.fx = x; elm.dataset.fy = y;
      setPos(elm, x, y);
      if (Math.hypot(sx, sy) > 0.25) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
}

// Elastic squash: while dragging, deform by velocity; on release, a damped
// spring wobbles the object back to rest. The "liquid" feel of the kinetic
// world.
export function elastic(el, strength = 1) {
  let raf = 0;
  const deform = ({ vx, vy }) => {
    const speed = Math.min(30, Math.hypot(vx, vy));
    const squash = 1 + speed * 0.012 * strength;
    const angle = Math.atan2(vy, vx);
    el.style.setProperty('--sq-a', `${angle}rad`);
    el.style.setProperty('--sq', squash.toFixed(3));
  };
  const release = () => {
    if (!allows('physics')) { el.style.setProperty('--sq', 1); return; }
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const s = 1 + 0.22 * strength * Math.exp(-4.2 * t) * Math.cos(11 * t);
      el.style.setProperty('--sq', s.toFixed(3));
      if (t < 1.4) raf = requestAnimationFrame(tick);
      else el.style.setProperty('--sq', 1);
    };
    raf = requestAnimationFrame(tick);
  };
  return { deform, release };
}

// Cursor trail — spawns small glyphs that drift up and fade. Pointer-fine
// devices only, and only at full motion.
export function trail(layer, makeGlyph, { gap = 46, life = 900 } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return () => {};
  let last = 0;
  const onMove = (e) => {
    if (!allows('ambient')) return;
    const now = performance.now();
    if (now - last < gap) return;
    last = now;
    const g = makeGlyph();
    g.classList.add('trail-glyph');
    g.style.left = `${e.clientX}px`;
    g.style.top = `${e.clientY}px`;
    layer.append(g);
    const dx = (Math.random() - 0.5) * 30;
    g.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0.7)', opacity: 0.9 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% - 46px)) scale(1.15)`, opacity: 0 },
      ],
      { duration: life, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
    ).onfinish = () => g.remove();
    if (layer.childElementCount > 60) layer.firstElementChild?.remove();
  };
  addEventListener('pointermove', onMove);
  return () => removeEventListener('pointermove', onMove);
}

// Click burst — n small glyphs fly radially out of a point and vanish.
export function burst(layer, x, y, makeGlyph, n = 8) {
  if (!allows('physics')) return;
  for (let i = 0; i < n; i++) {
    const g = makeGlyph();
    g.classList.add('trail-glyph');
    g.style.left = `${x}px`;
    g.style.top = `${y}px`;
    layer.append(g);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
    const d = 34 + Math.random() * 52;
    g.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0.5)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 20}px)) scale(1)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.16,.8,.4,1)', fill: 'forwards' },
    ).onfinish = () => g.remove();
  }
}

// Chat typer — messages arrive on a loop at full motion; rendered instantly
// at calm/off so the content never depends on animation.
export function typer(log, script, { loopDelay = 6000 } = {}) {
  let timer = 0, alive = true;
  const renderAll = () => {
    log.replaceChildren();
    for (const m of script) addMsg(m);
  };
  const addMsg = (m) => {
    const li = document.createElement('li');
    li.className = `chat-msg is-${m.who}`;
    li.innerHTML = `<span class="chat-bubble">${m.text}</span>`;
    log.append(li);
    log.scrollTop = log.scrollHeight;
  };
  const run = () => {
    if (!alive) return;
    if (!allows('loop')) { renderAll(); return; }
    log.replaceChildren();
    let i = 0;
    const step = () => {
      if (!alive || i >= script.length) {
        if (alive && i >= script.length) timer = setTimeout(run, loopDelay);
        return;
      }
      const typing = document.createElement('li');
      typing.className = `chat-msg is-${script[i].who} is-typing`;
      typing.innerHTML = '<span class="chat-bubble"><i></i><i></i><i></i></span>';
      log.append(typing);
      log.scrollTop = log.scrollHeight;
      timer = setTimeout(() => {
        typing.remove();
        addMsg(script[i++]);
        timer = setTimeout(step, 650 + Math.random() * 900);
      }, 600 + Math.random() * 500);
    };
    step();
  };
  run();
  onMotion(() => { clearTimeout(timer); if (alive) run(); });
  return () => { alive = false; clearTimeout(timer); };
}

// Kinetic letters — pointer proximity stretches each letter along the
// variable-font width axis; they lerp back with a springy feel.
export function kineticLetters(container) {
  const letters = [...container.querySelectorAll('[data-letter]')];
  if (!letters.length) return () => {};
  const state = letters.map(() => ({ w: 100, t: 0, cur: 100, curT: 0 }));
  let px = -9999, py = -9999, raf = 0, running = false;

  const measure = () => letters.map((l) => {
    const r = l.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  let centers = measure();
  addEventListener('resize', () => { centers = measure(); });

  const frame = () => {
    let alive = false;
    letters.forEach((l, i) => {
      const c = centers[i];
      const d = Math.hypot(px - c.cx, py - c.cy);
      const t = Math.max(0, 1 - d / 260);
      const target = 100 + t * 60;                 // wdth axis stretch
      const lift = -t * 14;
      const s = state[i];
      s.cur += (target - s.cur) * 0.16;
      s.curT += (lift - s.curT) * 0.16;
      if (Math.abs(s.cur - 100) > 0.4 || Math.abs(s.curT) > 0.4) alive = true;
      l.style.fontVariationSettings = `'wdth' ${s.cur.toFixed(1)}, 'wght' ${(500 + (s.cur - 100) * 4).toFixed(0)}`;
      l.style.transform = `translateY(${s.curT.toFixed(1)}px)`;
    });
    if (alive || getMotion() === 'full') raf = requestAnimationFrame(frame);
    else running = false;
  };
  const wake = () => {
    if (getMotion() === 'off') return;
    if (!running && allows('user')) { running = true; raf = requestAnimationFrame(frame); }
  };
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; wake(); });
  return () => cancelAnimationFrame(raf);
}
