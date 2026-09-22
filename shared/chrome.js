// Shared chrome: song chip (title · artist · listen · nav · motion toggle),
// the experiment panel, and the gallery link. Always present, always
// secondary — skinned per theme via [data-theme] CSS.
import { getMotion, setMotion, cycleMotion, onMotion } from './motion.js';
import { neighbors, ORDER, SONGS } from './songs.js';

const THEME_LABELS = { desktop: 'old desktop', picnic: 'picnic blanket', kinetic: 'acid poster' };
const MOTION_LABELS = { full: 'full', calm: 'calm', off: 'off' };
const MOTION_GLYPHS = { full: '●', calm: '◐', off: '○' };

export function mountChrome(world) {
  const { song } = world;
  const { prev, next } = neighbors(song.slug);

  const chip = document.createElement('nav');
  chip.className = 'chip';
  chip.setAttribute('aria-label', 'song');
  chip.innerHTML = `
    <a class="chip-home" href="../" aria-label="all songs">♪</a>
    <span class="chip-id">
      <span class="chip-title">${song.title}</span>
      <span class="chip-artist">${song.artist}</span>
    </span>
    <a class="chip-listen" href="${song.listen}" target="_blank" rel="noopener">listen ↗</a>
    <span class="chip-nav">
      <a href="../${prev.slug}/" aria-label="previous song: ${prev.title}">←</a>
      <a href="../${next.slug}/" aria-label="next song: ${next.title}">→</a>
    </span>
    <button class="chip-motion" type="button" aria-label="cycle motion level"></button>
    <button class="chip-lab" type="button" aria-expanded="false">lab</button>`;
  world.layers.chrome.append(chip);

  const motionBtn = chip.querySelector('.chip-motion');
  const paintMotion = () => {
    motionBtn.textContent = MOTION_GLYPHS[getMotion()];
    motionBtn.setAttribute('aria-label', `motion: ${MOTION_LABELS[getMotion()]} — click to change`);
    motionBtn.title = `motion: ${MOTION_LABELS[getMotion()]}`;
  };
  paintMotion();
  motionBtn.addEventListener('click', cycleMotion);
  onMotion(paintMotion);

  /* ---------- experiment panel ---------- */

  const panel = document.createElement('aside');
  panel.className = 'panel';
  panel.setAttribute('aria-label', 'experiment panel');
  panel.hidden = true;
  panel.innerHTML = `
    <div class="panel-inner">
      <p class="panel-head">experiment</p>
      <fieldset class="panel-group">
        <legend>theme</legend>
        ${Object.keys(THEME_LABELS).map((t) => `
          <label class="panel-opt">
            <input type="radio" name="esw-theme" value="${t}" ${t === world.theme ? 'checked' : ''}>
            <span>${THEME_LABELS[t]}</span>
          </label>`).join('')}
      </fieldset>
      <fieldset class="panel-group">
        <legend>artifacts</legend>
        <div class="panel-artifacts"></div>
      </fieldset>
      <fieldset class="panel-group">
        <legend>motion</legend>
        <div class="panel-motion">
          ${Object.keys(MOTION_LABELS).map((m) => `
            <label class="panel-opt">
              <input type="radio" name="esw-motion" value="${m}" ${m === getMotion() ? 'checked' : ''}>
              <span>${MOTION_LABELS[m]}</span>
            </label>`).join('')}
        </div>
      </fieldset>
      <div class="panel-group panel-seed">
        <span class="panel-seed-label">layout seed <code>${world.seed}</code></span>
        <button class="panel-reseed" type="button">recompose</button>
      </div>
      <a class="panel-home" href="../">← all songs</a>
    </div>`;
  world.layers.chrome.append(panel);

  const labBtn = chip.querySelector('.chip-lab');
  const setPanel = (open) => {
    panel.hidden = !open;
    labBtn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
  };
  labBtn.addEventListener('click', () => setPanel(panel.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setPanel(false); });

  panel.addEventListener('change', (e) => {
    const input = e.target;
    if (input.name === 'esw-theme') world.setTheme(input.value);
    if (input.name === 'esw-motion') setMotion(input.value);
    if (input.name === 'esw-artifact') {
      world.setArtifactVisible(input.value, input.checked);
    }
  });
  onMotion(() => {
    const r = panel.querySelector(`input[name=esw-motion][value=${getMotion()}]`);
    if (r) r.checked = true;
  });
  panel.querySelector('.panel-reseed').addEventListener('click', () => {
    world.recompose();
    panel.querySelector('.panel-seed code').textContent = world.seed;
  });

  return { chip, panel, panelArtifactsEl: panel.querySelector('.panel-artifacts') };
}

// Populate the artifact toggles once artifacts exist — frames count too
// (a chat window is as much an artifact as a heart).
export function fillArtifactToggles(panelArtifactsEl, world) {
  const types = [...new Set([
    ...world.artifacts.map((a) => a.spec.type),
    ...world.frames.map((f) => f.spec.type),
  ])];
  panelArtifactsEl.replaceChildren(...types.map((t) => {
    const label = document.createElement('label');
    label.className = 'panel-opt';
    label.innerHTML = `<input type="checkbox" name="esw-artifact" value="${t}" checked><span>${/s$/.test(t) ? t : t + 's'}</span>`;
    return label;
  }));
}
