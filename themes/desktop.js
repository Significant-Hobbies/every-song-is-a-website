// Theme: desktop — a year-2000 desktop OS.
// Furniture: taskbar (start menu, task buttons, live clock), desktop icons.
// Hero: a "welcome.exe" window. Signature interactions: draggable windows,
// icons that open them, typing IM chat, heart clicks that burst, and a
// pixel-heart cursor trail.
import { draggable, trail, burst, typer } from '../shared/behaviours.js';
import { allows } from '../shared/motion.js';
import { ORDER, SONGS } from '../shared/songs.js';
import { glyphEl } from '../shared/artifacts.js';

const ICON_GLYPH = {
  chat: '💬', photos: '🖼', player: '♫', note: '✎', lyrics: '✎',
  spec: '≡', menu: '❏', invite: '✉', welcome: '♥',
};

export const desktopTheme = {
  id: 'desktop',
  _cleanup: [],

  mount(world) {
    const { song, layers } = world;
    const clean = this._cleanup;
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); clean.push(() => el.removeEventListener(ev, fn, o)); };

    /* hero: welcome window ------------------------------------------- */
    const hero = document.createElement('section');
    hero.className = 'frame hero-window';
    hero.dataset.artifact = 'frame';
    hero.setAttribute('aria-label', 'welcome');
    hero.innerHTML = `
      <header class="frame-bar">
        <span class="frame-title">♥ welcome.exe</span>
        <span class="frame-controls"><button class="frame-btn" type="button" aria-hidden="true" tabindex="-1">_</button><button class="frame-btn" type="button" aria-hidden="true" tabindex="-1">✕</button></span>
      </header>
      <div class="frame-body hero-body">
        <p class="hero-kicker">now playing</p>
        <h1 class="hero-title">${song.title.toLowerCase()}</h1>
        <p class="hero-artist">${song.artist} · ${song.year}</p>
        <p class="hero-hint">drag windows · click icons · catch hearts</p>
      </div>`;
    layers.hero.append(hero);
    draggable(hero, { handle: hero.querySelector('.frame-bar') });
    on(hero, 'pointerdown', () => { hero.style.zIndex = worldZ(); });
    center(hero);

    /* taskbar --------------------------------------------------------- */
    const taskbar = document.createElement('footer');
    taskbar.className = 'taskbar';
    taskbar.innerHTML = `
      <button class="taskbar-start" type="button"><span class="taskbar-logo">♥</span> start</button>
      <div class="taskbar-tasks" role="list"></div>
      <div class="taskbar-clock" aria-label="clock"><span class="clock-time"></span></div>`;
    layers.furniture.append(taskbar);

    const startMenu = document.createElement('div');
    startMenu.className = 'start-menu';
    startMenu.hidden = true;
    startMenu.innerHTML = `
      <p class="start-head">every song is a website</p>
      ${ORDER.map((s) => `<a class="start-item" href="../${s}/">${s === song.slug ? '▸' : '·'} ${SONGS[s].title} — ${SONGS[s].artist}</a>`).join('')}
      <a class="start-item" href="../../">· back to the gallery</a>`;
    taskbar.append(startMenu);
    const startBtn = taskbar.querySelector('.taskbar-start');
    on(startBtn, 'click', (e) => { e.stopPropagation(); startMenu.hidden = !startMenu.hidden; });
    on(document, 'pointerdown', (e) => { if (!taskbar.contains(e.target)) startMenu.hidden = true; });

    const tasks = taskbar.querySelector('.taskbar-tasks');
    const taskBtns = {};
    for (const f of world.frames.concat([{ el: hero, spec: { id: 'welcome', title: 'welcome' } }])) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'task-btn';
      b.textContent = f.spec.title;
      taskBtns[f.spec.id] = b;
      on(b, 'click', () => {
        const closed = f.el.classList.toggle('is-closed');
        b.classList.toggle('is-open', !closed);
        if (!closed) f.el.style.zIndex = ++zCounter;
      });
      b.classList.add('is-open');
      tasks.append(b);
    }
    world.taskBtns = taskBtns;

    const clockEl = taskbar.querySelector('.clock-time');
    const tick = () => {
      clockEl.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };
    tick();
    const clock = setInterval(tick, 15000);
    clean.push(() => clearInterval(clock));

    /* desktop icons ---------------------------------------------------- */
    const icons = document.createElement('div');
    icons.className = 'icons';
    const entries = [
      ...world.frames.map((f) => ({
        id: f.spec.id, label: f.spec.title.replace(/ — .*/, ''), glyph: ICON_GLYPH[f.spec.type] ?? '❏',
        open: () => { f.el.classList.remove('is-closed'); f.el.style.zIndex = ++zCounter; taskBtns[f.spec.id]?.classList.add('is-open'); },
      })),
      {
        id: 'trash', label: 'trash', glyph: '🗑',
        open: () => alertBox(layers.furniture, 'trash', 'the trash is empty.\nsome things you keep forever.'),
      },
    ];
    for (const e of entries) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'icon';
      b.innerHTML = `<span class="icon-glyph">${e.glyph}</span><span class="icon-label">${e.label}</span>`;
      on(b, 'click', e.open);
      icons.append(b);
    }
    layers.furniture.append(icons);

    /* chat typing ------------------------------------------------------- */
    const chatLog = world.root.querySelector('.frame-chat .chat-log');
    if (chatLog && song.chat) clean.push(typer(chatLog, song.chat));

    /* heart bursts + cursor trail --------------------------------------- */
    const heartGlyph = () => {
      const s = document.createElement('span');
      s.className = 'mini-heart';
      s.append(glyphEl({ type: 'heart' }, 'desktop'));
      return s;
    };
    for (const a of world.artifacts) {
      if (a.spec.type !== 'heart') continue;
      const pop = (x, y) => {
        burst(layers.fx, x, y, heartGlyph, 7);
        a.el.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
          { duration: 320, easing: 'ease-out' },
        );
      };
      a.el.tabIndex = 0;
      on(a.el, 'click', (e) => pop(e.clientX, e.clientY));
      on(a.el, 'keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const r = a.el.getBoundingClientRect();
        pop(r.left + r.width / 2, r.top + r.height / 2);
      });
    }
    clean.push(trail(layers.fx, heartGlyph, { gap: 60 }));
    clean.push(() => { layers.fx.replaceChildren(); });
  },

  frameClosed(world, id) {
    world.taskBtns?.[id]?.classList.remove('is-open');
  },

  unmount(world) {
    for (const fn of this._cleanup.splice(0)) fn();
    world.layers.furniture.replaceChildren();
    world.layers.hero.replaceChildren();
    world.layers.fx.replaceChildren();
    world.taskBtns = null;
  },
};

let zCounter = 50;
function worldZ() { return ++zCounter; }

function center(el) {
  const w = el.offsetWidth || 320, h = el.offsetHeight || 200;
  el.style.left = `${Math.max(8, innerWidth / 2 - w / 2)}px`;
  el.style.top = `${Math.max(8, innerHeight * 0.36 - h / 2)}px`;
}

// A classic message box — the desktop world's native dialog.
function alertBox(parent, title, text) {
  const box = document.createElement('div');
  box.className = 'frame alert-box';
  box.dataset.artifact = 'frame';
  box.innerHTML = `
    <header class="frame-bar"><span class="frame-title">${title}</span>
      <span class="frame-controls"><button class="frame-btn" type="button" aria-label="close">✕</button></span>
    </header>
    <div class="frame-body alert-body"><p>${text.replace(/\n/g, '<br>')}</p>
      <button class="alert-ok" type="button">OK</button></div>`;
  parent.append(box);
  center(box);
  box.style.zIndex = ++zCounter;
  draggable(box, { handle: box.querySelector('.frame-bar') });
  const dismiss = () => box.remove();
  box.querySelector('.alert-ok').addEventListener('click', dismiss);
  box.querySelector('.frame-btn').addEventListener('click', dismiss);
}
