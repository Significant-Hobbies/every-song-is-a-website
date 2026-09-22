// Theme: kinetic — an acid-printed poster you can grab.
// Furniture: crop marks, bottom marquee ticker. Hero: the title as oversized
// letters that stretch along the variable width axis near the cursor and
// spring back. Signature interactions: elastic chrome blobs (squash while
// dragged, wobble on release), letters that scatter on click.
import { draggable, elastic, kineticLetters, trail } from '../shared/behaviours.js';
import { allows } from '../shared/motion.js';
import { glyphEl } from '../shared/artifacts.js';

export const kineticTheme = {
  id: 'kinetic',
  _cleanup: [],

  mount(world) {
    const { song, layers, rng } = world;
    const clean = this._cleanup;
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); clean.push(() => el.removeEventListener(ev, fn, o)); };

    /* crop marks ---------------------------------------------------------- */
    const marks = document.createElement('div');
    marks.className = 'crop-marks';
    marks.setAttribute('aria-hidden', 'true');
    marks.innerHTML = '<i class="cm tl"></i><i class="cm tr"></i><i class="cm bl"></i><i class="cm br"></i>';
    layers.furniture.append(marks);

    /* hero: oversized kinetic type ----------------------------------------- */
    const hero = document.createElement('section');
    hero.className = 'hero-kinetic';
    const letters = song.title.toUpperCase().split(' ').map((word) =>
      `<span class="k-word">${[...word].map((ch) => `<span class="k-letter" data-letter>${ch}</span>`).join('')}</span>`,
    ).join('');
    hero.innerHTML = `
      <h1 class="k-title" aria-label="${song.title}">${letters}</h1>
      <p class="k-sub">${song.artist.toUpperCase()} — ${song.year} — ${song.mood.toUpperCase()}</p>
      <p class="k-hint">run your cursor through the title · grab the chrome</p>`;
    layers.hero.append(hero);
    clean.push(kineticLetters(hero));

    // Click the title: letters scatter and snap back.
    const title = hero.querySelector('.k-title');
    on(title, 'click', () => {
      if (!allows('physics')) return;
      title.querySelectorAll('[data-letter]').forEach((l) => {
        const dx = rng.range(-90, 90), dy = rng.range(-70, 40), rot = rng.range(-40, 40);
        l.animate(
          [
            { transform: 'translate(0,0) rotate(0)' },
            { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, offset: 0.35 },
            { transform: 'translate(0,0) rotate(0)' },
          ],
          { duration: 750, easing: 'cubic-bezier(.16,1.2,.3,1)' },
        );
      });
    });

    /* marquee --------------------------------------------------------------- */
    const ticker = document.createElement('div');
    ticker.className = 'marquee';
    ticker.setAttribute('aria-hidden', 'true');
    const phrase = `${song.title.toUpperCase()} — ${song.artist.toUpperCase()} — `;
    ticker.innerHTML = `<div class="marquee-track loop"><span>${phrase.repeat(6)}</span><span>${phrase.repeat(6)}</span></div>`;
    layers.furniture.append(ticker);

    /* elastic objects --------------------------------------------------------- */
    for (const a of world.artifacts) {
      if (a.spec.type !== 'object' && a.spec.type !== 'lozenge') continue;
      if (!a.el.dataset.bound) {
        a.el.dataset.bound = '1';
        const spring = elastic(a.el, a.spec.type === 'object' ? 1 : 0.6);
        draggable(a.el, {
          onMove: spring.deform,
          onRelease: spring.release,
        });
      }
      on(a.el, 'click', (e) => {
        if (!allows('physics')) return;
        const ring = document.createElement('i');
        ring.className = 'ring-pulse';
        ring.style.left = `${e.clientX}px`;
        ring.style.top = `${e.clientY}px`;
        layers.fx.append(ring);
        ring.animate(
          [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 },
           { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }],
          { duration: 550, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' },
        ).onfinish = () => ring.remove();
      });
    }

    /* cursor trail: lime sparks ------------------------------------------------ */
    clean.push(trail(layers.fx, () => {
      const s = document.createElement('i');
      s.className = 'trail-spark';
      s.textContent = '+';
      return s;
    }, { gap: 55, life: 650 }));

    clean.push(() => layers.fx.replaceChildren());
  },

  unmount(world) {
    for (const fn of this._cleanup.splice(0)) fn();
    world.layers.furniture.replaceChildren();
    world.layers.hero.replaceChildren();
    world.layers.fx.replaceChildren();
  },
};
