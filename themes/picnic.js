// Theme: picnic — a gingham blanket seen from above.
// Furniture: drifting sun, marching ant parade, cloth folds. Hero: a kraft
// tag with the song title in handwriting. Signature interactions: fruit that
// drags with momentum and rolls, watermelons that pop seeds when clicked.
import { draggable, trail, typer } from '../shared/behaviours.js';
import { allows } from '../shared/motion.js';

export const picnicTheme = {
  id: 'picnic',
  _cleanup: [],

  mount(world) {
    const { song, layers, rng } = world;
    const clean = this._cleanup;
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); clean.push(() => el.removeEventListener(ev, fn, o)); };

    /* sun -------------------------------------------------------------- */
    const sun = document.createElement('div');
    sun.className = 'sun';
    sun.innerHTML = '<i class="sun-face"></i><i class="sun-rays loop"></i>';
    layers.furniture.append(sun);

    /* ant parade -------------------------------------------------------- */
    const parade = document.createElement('div');
    parade.className = 'ant-parade';
    parade.setAttribute('aria-hidden', 'true');
    const w = innerWidth;
    const y0 = innerHeight - 26;
    const path = `M -40 ${y0} C ${w * 0.2} ${y0 - 34}, ${w * 0.35} ${y0 + 14}, ${w * 0.55} ${y0 - 20} S ${w * 0.85} ${y0 + 10}, ${w + 60} ${y0 - 8}`;
    for (let i = 0; i < 6; i++) {
      const ant = document.createElement('i');
      ant.className = 'ant loop';
      ant.style.offsetPath = `path("${path}")`;
      ant.style.animationDelay = `${(-i * 3.4 - rng.range(0, 1.5)).toFixed(2)}s`;
      if (i === 2) ant.classList.add('ant-crumb'); // one carries treasure
      parade.append(ant);
    }
    layers.furniture.append(parade);

    /* hero: kraft tag ---------------------------------------------------- */
    const hero = document.createElement('section');
    hero.className = 'hero-tag';
    hero.innerHTML = `
      <i class="tag-hole"></i><i class="tag-string"></i>
      <p class="hero-kicker">a song for</p>
      <h1 class="hero-title">${song.title.toLowerCase()}</h1>
      <p class="hero-artist">${song.artist} · ${song.year}</p>
      <p class="hero-hint">drag the fruit · click the melon</p>`;
    layers.hero.append(hero);
    const hr = hero.getBoundingClientRect();
    hero.style.left = `${innerWidth * 0.5 - hr.width / 2}px`;
    hero.style.top = `${innerHeight * 0.3 - hr.height / 2}px`;

    /* fruit physics ------------------------------------------------------- */
    for (const a of world.artifacts) {
      if (a.spec.type !== 'fruit' && a.spec.type !== 'flower') continue;
      // bound once: an artifact keeps its native physics in any skin
      if (!a.el.dataset.bound) {
        a.el.dataset.bound = '1';
        draggable(a.el, { inertia: a.spec.type === 'fruit', roll: true });
      }
      if (a.spec.kind === 'watermelon') {
        let downX = 0, downY = 0;
        on(a.el, 'pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
        on(a.el, 'pointerup', (e) => {
          if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
          popSeeds(world, a.el, rng);
        });
      }
    }

    /* chat typing --------------------------------------------------------- */
    const chatLog = world.root.querySelector('.frame-chat .chat-log');
    if (chatLog && song.chat) clean.push(typer(chatLog, song.chat));

    /* seed crumb trail ------------------------------------------------------ */
    clean.push(trail(layers.fx, () => {
      const s = document.createElement('i');
      s.className = 'trail-seed';
      return s;
    }, { gap: 70, life: 1100 }));

    clean.push(() => { layers.fx.replaceChildren(); });
  },

  unmount(world) {
    for (const fn of this._cleanup.splice(0)) fn();
    world.layers.furniture.replaceChildren();
    world.layers.hero.replaceChildren();
    world.layers.fx.replaceChildren();
    world.root.querySelectorAll('.seed-stuck').forEach((s) => s.remove());
  },
};

// A watermelon click pops seeds that arc out and stay scattered on the cloth.
function popSeeds(world, melon, rng) {
  const r = melon.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height * 0.4;
  const n = rng.int(4, 7);
  for (let i = 0; i < n; i++) {
    const seed = document.createElement('i');
    seed.className = 'seed-flying';
    seed.style.left = `${cx}px`;
    seed.style.top = `${cy}px`;
    world.layers.fx.append(seed);
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(46, 130);
    const tx = cx + Math.cos(a) * d;
    const ty = cy + Math.abs(Math.sin(a)) * d * 0.7 + 20;
    const midY = cy - rng.range(40, 90);
    if (!allows('physics')) {
      land(seed, tx, ty, rng);
      continue;
    }
    const anim = seed.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0, offset: 0 },
        { transform: `translate(${tx - cx - (tx - cx) * 0.5}px, ${midY - cy}px) translate(-50%,-50%) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${tx - cx}px, ${ty - cy}px) translate(-50%,-50%) scale(1)`, opacity: 1, offset: 1 },
      ],
      { duration: 620 + rng.range(0, 260), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' },
    );
    anim.onfinish = () => land(seed, tx, ty, rng);
  }
  melon.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.92) rotate(-3deg)' }, { transform: 'scale(1)' }],
    { duration: 260, easing: 'ease-out' },
  );
}

function land(seed, x, y, rng) {
  seed.remove();
  const stuck = document.createElement('i');
  stuck.className = 'seed-stuck';
  stuck.style.left = `${x}px`;
  stuck.style.top = `${y}px`;
  stuck.style.transform = `translate(-50%,-50%) rotate(${rng.range(0, 360)}deg)`;
  const layer = document.querySelector('.layer-artifacts');
  layer.append(stuck);
  const stuckAll = layer.querySelectorAll('.seed-stuck');
  if (stuckAll.length > 48) stuckAll[0].remove();
}

