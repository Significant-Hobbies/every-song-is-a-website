// Theme: neon — a midnight city block under a retrowave sun.
// Furniture: star field, striped horizon disc, perspective grid floor.
// Hero: the title as a buzzing neon sign (one letter flickers).
// Signature interactions: neon artifacts buzz when clicked, spark trail.
import { draggable, trail, typer } from '../shared/behaviours.js';
import { allows } from '../shared/motion.js';

export const neonTheme = {
  id: 'neon',
  _cleanup: [],

  mount(world) {
    const { song, layers, rng } = world;
    const clean = this._cleanup;
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); clean.push(() => el.removeEventListener(ev, fn, o)); };

    /* night sky ------------------------------------------------------------ */
    const sky = document.createElement('div');
    sky.className = 'night-sky';
    sky.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 36; i++) {
      const star = document.createElement('i');
      star.className = 'sky-star' + (i % 5 === 0 ? ' loop twinkle' : '');
      star.style.left = `${rng.range(0, 100)}%`;
      star.style.top = `${rng.range(0, 52)}%`;
      star.style.animationDelay = `${rng.range(0, 6)}s`;
      sky.append(star);
    }
    const sun = document.createElement('div');
    sun.className = 'neon-sun';
    const grid = document.createElement('div');
    grid.className = 'grid-floor';
    layers.furniture.append(sky, sun, grid);

    /* hero: neon sign -------------------------------------------------------- */
    const hero = document.createElement('section');
    hero.className = 'hero-sign';
    const letters = [...song.title].map((ch) =>
      ch === ' ' ? '<span class="n-space"></span>' : `<span class="n-letter">${ch}</span>`,
    ).join('');
    hero.innerHTML = `
      <h1 class="n-title" aria-label="${song.title}">${letters}</h1>
      <p class="n-sub">${song.artist} · ${song.year}</p>
      <p class="n-hint">tap a sign — it buzzes</p>`;
    layers.hero.append(hero);

    // one letter flickers forever; which one is the song's choice
    const ls = hero.querySelectorAll('.n-letter');
    if (ls.length) ls[rng.int(0, ls.length - 1)].classList.add('loop', 'flicker');

    const hr = hero.getBoundingClientRect();
    hero.style.left = `${innerWidth * 0.5 - hr.width / 2}px`;
    hero.style.top = `${innerHeight * 0.28 - hr.height / 2}px`;

    /* neon artifacts: draggable signs that buzz ------------------------------- */
    for (const a of world.artifacts) {
      if (!a.el.dataset.bound) {
        a.el.dataset.bound = '1';
        draggable(a.el, { inertia: true });
      }
      let downX = 0, downY = 0;
      on(a.el, 'pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
      on(a.el, 'pointerup', (e) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
        if (!allows('physics')) { a.el.classList.add('buzz'); setTimeout(() => a.el.classList.remove('buzz'), 450); return; }
        a.el.classList.add('buzz');
        setTimeout(() => a.el.classList.remove('buzz'), 450);
      });
    }

    /* chat typing -------------------------------------------------------------- */
    const chatLog = world.root.querySelector('.frame-chat .chat-log');
    if (chatLog && song.chat) clean.push(typer(chatLog, song.chat));

    /* cursor trail: neon sparks ------------------------------------------------- */
    clean.push(trail(layers.fx, () => {
      const s = document.createElement('i');
      s.className = 'trail-neon';
      s.textContent = rng.pick(['+', '·', '×']);
      s.style.color = rng.pick(['#ff2d78', '#22e5ff', '#ffd94f']);
      return s;
    }, { gap: 60, life: 700 }));

    clean.push(() => layers.fx.replaceChildren());
  },

  unmount(world) {
    for (const fn of this._cleanup.splice(0)) fn();
    world.layers.furniture.replaceChildren();
    world.layers.hero.replaceChildren();
    world.layers.fx.replaceChildren();
  },
};
