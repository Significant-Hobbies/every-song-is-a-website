// World orchestrator. Each song page calls initWorld(slug):
//   1. resolve config, seed, theme, motion
//   2. build the layer stack
//   3. mount the theme (furniture + hero + signature interactions)
//   4. scatter + mount artifacts and frames, wire behaviours
//   5. mount chrome + experiment panel
// Theme switching remounts furniture and re-skins glyphs live.
import { SONGS } from './songs.js';
import { makeRng, randomSeed } from './rng.js';
import { initMotion, allows, onMotion } from './motion.js';
import { scatter, place, rectOf } from './scatter.js';
import { makeArtifact, makeFrame } from './artifacts.js';
import { mountChrome, fillArtifactToggles } from './chrome.js';
import { draggable, bringToFront } from './behaviours.js';
import { desktopTheme } from '../themes/desktop.js';
import { picnicTheme } from '../themes/picnic.js';
import { kineticTheme } from '../themes/kinetic.js';

const THEMES = { desktop: desktopTheme, picnic: picnicTheme, kinetic: kineticTheme };
const LAYERS = ['furniture', 'artifacts', 'hero', 'fx', 'chrome'];

export function initWorld(slug) {
  const song = SONGS[slug];
  if (!song) throw new Error(`unknown song: ${slug}`);

  const params = new URLSearchParams(location.search);
  const themeParam = params.get('theme');
  const seedParam = parseInt(params.get('seed'), 10);
  const initialTheme = THEMES[themeParam] ? themeParam : song.theme;
  const seed = Number.isFinite(seedParam) ? seedParam : song.seed;

  initMotion(song.motion);
  document.documentElement.dataset.theme = initialTheme;
  document.title = `${song.title} — ${song.artist} · every song is a website`;

  const root = document.getElementById('world');
  const layers = {};
  for (const name of LAYERS) {
    const el = document.createElement('div');
    el.className = `layer layer-${name}`;
    root.append(el);
    layers[name] = el;
  }
  layers.fx.setAttribute('aria-hidden', 'true');

  const world = {
    song, root, layers,
    theme: initialTheme,
    seed,
    rng: makeRng(seed),
    artifacts: [],   // {el, spec, reskin}
    frames: [],      // {el, spec, bar}
    frameById: {},
    placed: [],      // positioned elements for recompose
    allows,
    onMotion,

    setTheme(next) {
      if (!THEMES[next] || next === world.theme) return;
      THEMES[world.theme].unmount?.(world);
      world.theme = next;
      document.documentElement.dataset.theme = next;
      for (const a of world.artifacts) a.reskin(next);
      THEMES[next].mount(world);
      world.reseat();
    },

    setArtifactVisible(type, visible) {
      for (const a of world.artifacts) {
        if (a.spec.type === type) a.el.classList.toggle('is-hidden', !visible);
      }
      for (const f of world.frames) {
        if (f.spec.type === type) f.el.classList.toggle('is-hidden', !visible);
      }
    },

    recompose() {
      world.seed = randomSeed();
      world.rng = makeRng(world.seed);
      layoutArtifacts(world);
      THEMES[world.theme].rescatter?.(world);
    },

    reseat() { layoutArtifacts(world); },
  };

  // ---- artifacts + frames ---------------------------------------------
  const artifactSpecs = [];
  for (const spec of song.artifacts ?? []) {
    for (let i = 0; i < (spec.count ?? 1); i++) artifactSpecs.push({ ...spec });
  }
  for (const spec of artifactSpecs) {
    const a = makeArtifact(spec, world.theme, world.rng);
    a.el.style.setProperty('--float-dur', `${world.rng.range(5, 9).toFixed(2)}s`);
    a.el.style.setProperty('--float-delay', `${world.rng.range(-8, 0).toFixed(2)}s`);
    layers.artifacts.append(a.el);
    world.artifacts.push(a);
  }
  for (const spec of song.frames ?? []) {
    const f = makeFrame(spec, song, {
      onClose: (id) => THEMES[world.theme].frameClosed?.(world, id),
    });
    layers.artifacts.append(f.el);
    world.frames.push(f);
    world.frameById[spec.id] = f;
    draggable(f.el, { handle: f.bar });
    f.el.addEventListener('pointerdown', () => bringToFront(f.el));
  }

  // ---- hero + theme furniture ------------------------------------------
  THEMES[world.theme].mount(world);

  // ---- chrome -----------------------------------------------------------
  const chrome = mountChrome(world);
  fillArtifactToggles(chrome.panelArtifactsEl, world);
  world.panelEl = chrome.panel;

  // ---- first layout ------------------------------------------------------
  layoutArtifacts(world);
  THEMES[world.theme].rescatter?.(world);

  addEventListener('resize', () => clampAll(world));
  return world;
}

/* ---------- layout ---------- */

// Fractional avoid-zones keep artifacts off the hero and the chip/panel
// corners. Hero zone is measured live because its size differs per theme.
function avoidZones(world) {
  const zones = [
    { x0: 0, y0: 0, x1: 0.52, y1: 0.09 },           // chip
    { x0: 0.68, y0: 0.72, x1: 1, y1: 1 },           // panel
    { x0: 0, y0: 0.88, x1: 1, y1: 1 },              // bottom furniture
  ];
  const hero = world.layers.hero.firstElementChild;
  if (hero) zones.push(rectOf(hero));
  return zones;
}

function layoutArtifacts(world) {
  const movable = [...world.artifacts.map((a) => a.el), ...world.frames.map((f) => f.el)];
  const spots = scatter(world.rng, movable.length, {
    avoid: avoidZones(world),
    minDist: 0.14,
    margin: { x: 0.04, y: 0.1 },
  });
  movable.forEach((el, i) => {
    const s = spots[i];
    delete el.dataset.fx; delete el.dataset.fy;
    place(el, s.x, s.y, s.rot);
    // keep the whole element inside the viewport
    const r = el.getBoundingClientRect();
    const dx = r.right > innerWidth - 8 ? (r.right - innerWidth + 8) / innerWidth
      : r.left < 4 ? (r.left - 4) / innerWidth : 0;
    const dy = r.bottom > innerHeight - 8 ? (r.bottom - innerHeight + 8) / innerHeight
      : r.top < 4 ? (r.top - 4) / innerHeight : 0;
    if (dx || dy) place(el, s.x - dx, s.y - dy, s.rot);
  });
}

function clampAll(world) {
  const w = innerWidth, h = innerHeight;
  for (const el of [...world.artifacts.map((a) => a.el), ...world.frames.map((f) => f.el)]) {
    if (el.dataset.fx === undefined) continue;
    const x = Math.min(Math.max(parseFloat(el.dataset.fx), -40), w - 40);
    const y = Math.min(Math.max(parseFloat(el.dataset.fy), 0), h - 40);
    el.dataset.fx = x; el.dataset.fy = y;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
  }
}
