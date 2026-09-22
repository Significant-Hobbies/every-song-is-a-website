// Theme: scrapbook — a journal page in pencil and washi tape.
// Furniture: taped corners, coffee ring, margin note. Hero: the title
// handwritten in Caveat over a drawn squiggle. Signature interaction:
// pencil doodles redraw themselves when clicked (stroke draw-on).
import { draggable, trail, typer } from '../shared/behaviours.js';

export const scrapbookTheme = {
  id: 'scrapbook',
  _cleanup: [],

  mount(world) {
    const { song, layers, rng } = world;
    const clean = this._cleanup;
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); clean.push(() => el.removeEventListener(ev, fn, o)); };

    /* furniture: tape corners, coffee ring, margin note -------------------- */
    const deco = document.createElement('div');
    deco.className = 'scrap-deco';
    deco.setAttribute('aria-hidden', 'true');
    deco.innerHTML = `
      <i class="tape tape-tl"></i><i class="tape tape-br"></i>
      <i class="coffee-ring"></i>
      <p class="margin-note">side a · don't forget to feel things ♪</p>`;
    layers.furniture.append(deco);

    /* hero: handwritten title + drawn underline ----------------------------- */
    const hero = document.createElement('section');
    hero.className = 'hero-page';
    hero.innerHTML = `
      <p class="s-kicker">track ${String(rng.int(1, 9)).padStart(2, '0')} —</p>
      <h1 class="s-title">${song.title.toLowerCase()}</h1>
      <svg class="s-squiggle" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
        <path class="s-squiggle-path loop" d="M4 9 C 60 2, 120 13, 180 7 S 280 10, 296 6" pathLength="1"/>
      </svg>
      <p class="s-artist">${song.artist} · ${song.year}</p>
      <p class="s-hint">click a doodle — it draws itself again</p>`;
    layers.hero.append(hero);
    const hr = hero.getBoundingClientRect();
    hero.style.left = `${innerWidth * 0.5 - hr.width / 2}px`;
    hero.style.top = `${innerHeight * 0.3 - hr.height / 2}px`;

    /* doodles: pencil sketches that redraw on click -------------------------- */
    for (const a of world.artifacts) {
      // normalize stroke length so the draw-on animation is uniform
      a.el.querySelectorAll('svg path, svg circle, svg ellipse, svg rect')
        .forEach((p) => p.setAttribute('pathLength', '1'));
      if (!a.el.dataset.bound) {
        a.el.dataset.bound = '1';
        draggable(a.el, { roll: true });
      }
      let downX = 0, downY = 0;
      on(a.el, 'pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
      on(a.el, 'pointerup', (e) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
        const body = a.el.querySelector('.artifact-body');
        body.classList.remove('redraw');
        void body.offsetWidth; // restart the animation
        body.classList.add('redraw');
      });
    }

    /* chat typing ------------------------------------------------------------- */
    const chatLog = world.root.querySelector('.frame-chat .chat-log');
    if (chatLog && song.chat) clean.push(typer(chatLog, song.chat));

    /* cursor trail: pencil ticks ------------------------------------------------ */
    clean.push(trail(layers.fx, () => {
      const s = document.createElement('i');
      s.className = 'trail-pencil';
      s.textContent = rng.pick(['~', '·', '✳', '·']);
      return s;
    }, { gap: 70, life: 900 }));

    clean.push(() => layers.fx.replaceChildren());
  },

  unmount(world) {
    for (const fn of this._cleanup.splice(0)) fn();
    world.layers.furniture.replaceChildren();
    world.layers.hero.replaceChildren();
    world.layers.fx.replaceChildren();
  },
};
