// Artifact factories. Two families:
//   glyphs — decorative/interactive objects (heart, star, fruit, flower,
//            object, lozenge) whose inner art is rendered per-theme and
//            re-rendered live when the theme switches.
//   frames — titled cards (chat, photos, player, note, spec) whose chrome is
//            pure CSS: a window under `desktop`, a paper scrap under
//            `picnic`, a bordered slab under `kinetic`.
import { allows } from './motion.js';
import { burst, trail } from './behaviours.js';

const NS = 'http://www.w3.org/2000/svg';

/* ---------- pixel art (desktop theme) ---------- */

function pixelEl(map, palette, scale = 3) {
  const el = document.createElement('i');
  el.className = 'pixel-art';
  el.setAttribute('aria-hidden', 'true');
  const shadows = [];
  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (palette[ch]) shadows.push(`${x * scale}px ${y * scale}px 0 0 ${palette[ch]}`);
    });
  });
  el.style.width = `${scale}px`;
  el.style.height = `${scale}px`;
  el.style.boxShadow = shadows.join(',');
  return el;
}

const PIX = {
  heart: {
    map: [
      '.XX.XX.',
      'XXXXXXX',
      'XXXXXXX',
      '.XXXXX.',
      '..XXX..',
      '...X...',
    ],
    palette: { X: 'var(--pix-heart, #ff4f8e)' },
  },
  star: {
    map: [
      '..X..',
      '.XXX.',
      'XXXXX',
      '.XXX.',
      '..X..',
    ],
    palette: { X: 'var(--pix-star, #ffd94f)' },
  },
  watermelon: {
    map: [
      '..PPPPPPP..',
      '.PPSPPSPPP.',
      'PPPPPSPPPPP',
      'PWPPPPPPPWP',
      'PWWWWWWWWWP',
      '.GWWWWWWWG.',
      '..GGGGGGG..',
    ],
    palette: { P: '#ff5d73', S: '#33262b', W: '#eaf5d8', G: '#3d9a4e' },
  },
  orange: {
    map: [
      '..OOOOO..',
      '.OOOWOOO.',
      'OOWWWWWOO',
      'OWWOWOWWO',
      'OOWWWWWOO',
      '.OOOWOOO.',
      '..OOOOO..',
    ],
    palette: { O: '#ff9b2f', W: '#ffe9bf' },
  },
  strawberry: {
    map: [
      '..GGGGG..',
      '.G.GGG.G.',
      'RRRRRRRRR',
      'RRSRRSRRR',
      'RRRRRRRRR',
      '.RSRRRSR.',
      '.RRRRRRR.',
      '..RRRRR..',
      '...RRR...',
    ],
    palette: { R: '#f03e52', S: '#ffd9a0', G: '#3d9a4e' },
  },
  peach: {
    map: [
      '....GG...',
      '...GGGG..',
      '.PPPPPPP.',
      'PPPPPPPPP',
      'PCPPPPPPP',
      'PCCPPPPP.',
      '.PPPPPPP.',
      '..PPPPP..',
      '...PPP...',
    ],
    palette: { P: '#ffa37e', C: '#e8795a', G: '#43a047' },
  },
  flower: {
    map: [
      '.W.W.W.',
      'WWYYYWW',
      '.WYYYW.',
      'WWYYYWW',
      '.W.W.W.',
    ],
    palette: { W: '#fff7ea', Y: '#ffd23f' },
  },
  object: {
    map: [
      '...CCCC...',
      '..CCCCCC..',
      '.CCHCCCCC.',
      'CCCCCCCCC',
      'CCCCCCCCC.',
      '.CCCCCCC..',
      '...CCCC...',
    ],
    palette: { C: '#7fd4ff', H: '#ffffff' },
  },
  lozenge: {
    map: ['..XX..', '.XXXX.', 'XXXXXX', '.XXXX.', '..XX..'],
    palette: { X: '#c9c9c9' },
  },
};

/* ---------- vector glyphs (picnic fills / kinetic line-art via classes) --- */

function svgGlyph(name) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('class', `glyph glyph-${name}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = GLYPHS[name] ?? '';
  return svg;
}

const GLYPHS = {
  heart: `
    <path class="g-outline" d="M60 104 C30 82 14 62 14 42 C14 26 26 16 40 16 C49 16 56 21 60 29 C64 21 71 16 80 16 C94 16 106 26 106 42 C106 62 90 82 60 104 Z"/>
    <path class="g-fill" d="M60 96 C34 77 21 60 21 43 C21 31 30 23 41 23 C50 23 56 28 60 36 C64 28 70 23 79 23 C90 23 99 31 99 43 C99 60 86 77 60 96 Z"/>`,
  star: `
    <path class="g-outline" d="M60 8 L71 44 L108 44 L78 65 L89 102 L60 80 L31 102 L42 65 L12 44 L49 44 Z"/>
    <path class="g-fill" d="M60 18 L68 47 L97 47 L74 64 L83 93 L60 75 L37 93 L46 64 L23 47 L52 47 Z"/>`,
  watermelon: `
    <path class="g-outline" d="M12 30 A52 52 0 0 0 108 30 Z"/>
    <path class="g-rind" d="M16 30 A48 48 0 0 0 104 30 Z"/>
    <path class="g-pith" d="M21 30 A43 43 0 0 0 99 30 Z"/>
    <path class="g-flesh" d="M26 30 A38 38 0 0 0 94 30 Z"/>
    <ellipse class="g-seed" cx="46" cy="44" rx="3" ry="4.4"/>
    <ellipse class="g-seed" cx="74" cy="44" rx="3" ry="4.4"/>
    <ellipse class="g-seed" cx="60" cy="56" rx="3" ry="4.4"/>
    <ellipse class="g-seed" cx="38" cy="56" rx="3" ry="4.4"/>
    <ellipse class="g-seed" cx="82" cy="56" rx="3" ry="4.4"/>`,
  orange: `
    <circle class="g-outline" cx="60" cy="60" r="52"/>
    <circle class="g-rind" cx="60" cy="60" r="46"/>
    <circle class="g-flesh" cx="60" cy="60" r="38"/>
    <g class="g-pith">
      <path d="M60 22 L60 98"/><path d="M22 60 L98 60"/>
      <path d="M33 33 L87 87"/><path d="M87 33 L33 87"/>
    </g>
    <circle class="g-pith-fill" cx="60" cy="60" r="5"/>`,
  strawberry: `
    <path class="g-outline" d="M60 108 C34 88 20 68 20 50 C20 34 36 26 60 26 C84 26 100 34 100 50 C100 68 86 88 60 108 Z"/>
    <path class="g-flesh" d="M60 100 C38 82 27 65 27 51 C27 39 41 33 60 33 C79 33 93 39 93 51 C93 65 82 82 60 100 Z"/>
    <path class="g-leaf" d="M44 30 C46 20 52 14 60 12 C68 14 74 20 76 30 C70 26 65 25 60 25 C55 25 50 26 44 30 Z"/>
    <path class="g-leaf" d="M60 12 C58 6 60 4 62 2"/>
    <g class="g-seed">
      <ellipse cx="44" cy="50" rx="2.2" ry="3.4"/><ellipse cx="76" cy="50" rx="2.2" ry="3.4"/>
      <ellipse cx="60" cy="46" rx="2.2" ry="3.4"/><ellipse cx="52" cy="66" rx="2.2" ry="3.4"/>
      <ellipse cx="68" cy="66" rx="2.2" ry="3.4"/><ellipse cx="60" cy="82" rx="2.2" ry="3.4"/>
    </g>`,
  peach: `
    <path class="g-outline" d="M60 26 C40 26 22 44 22 64 C22 90 40 108 60 108 C80 108 98 90 98 64 C98 44 80 26 60 26 Z"/>
    <path class="g-flesh" d="M60 33 C45 33 30 47 30 65 C30 85 44 101 60 101 C76 101 90 85 90 65 C90 47 75 33 60 33 Z"/>
    <path class="g-cleft" d="M60 30 C53 48 53 78 60 103"/>
    <path class="g-leaf" d="M60 24 C58 12 66 6 78 8 C78 18 70 25 60 24 Z"/>`,
  flower: `
    <g class="g-petal">
      <circle cx="60" cy="26" r="16"/><circle cx="92" cy="47" r="16"/>
      <circle cx="92" cy="79" r="16"/><circle cx="60" cy="98" r="16"/>
      <circle cx="28" cy="79" r="16"/><circle cx="28" cy="47" r="16"/>
    </g>
    <circle class="g-fill" cx="60" cy="62" r="17"/>`,
  object: `
    <path class="g-outline" d="M60 10 C88 10 108 32 108 58 C108 88 86 110 58 110 C30 110 12 90 12 62 C12 34 34 10 60 10 Z"/>
    <path class="g-fill" d="M42 38 C50 30 62 26 72 28 C62 34 52 42 46 54 C42 50 40 44 42 38 Z"/>`,
  lozenge: `
    <rect class="g-outline" x="18" y="42" width="84" height="36" rx="18"/>
    <path class="g-fill" d="M30 60 L90 60"/>`,
};

/* ---------- artifact wrapper ---------- */

// spec: {type, kind?, count?} — one element per instance.
export function makeArtifact(spec, theme, rng, hooks = {}) {
  const el = document.createElement('div');
  el.className = `artifact artifact-${spec.type} loop`;
  el.dataset.artifact = spec.type;
  if (spec.kind) el.dataset.kind = spec.kind;
  const body = document.createElement('div');
  body.className = 'artifact-body';
  el.append(body);
  renderGlyph(body, spec, theme);
  return {
    el,
    spec,
    reskin(nextTheme) {
      body.replaceChildren();
      renderGlyph(body, spec, nextTheme);
      el.classList.remove('skin-desktop', 'skin-picnic', 'skin-kinetic');
      el.classList.add(`skin-${nextTheme}`);
    },
  };
}

export function renderGlyph(body, spec, theme) {
  const name = spec.kind ?? spec.type;
  body.classList.add(`glyph-${theme}`);
  if (theme === 'desktop') {
    const px = PIX[name] ?? PIX[spec.type] ?? PIX.object;
    body.append(pixelEl(px.map, px.palette, name === 'object' ? 5 : 4));
  } else if (theme === 'kinetic' && spec.type === 'object') {
    const blob = document.createElement('i');
    blob.className = 'chrome-blob';
    body.append(blob);
  } else {
    body.append(svgGlyph(PIX[name] ? name : spec.type));
  }
}

// Standalone glyph element (cursor trails, bursts, icons).
export function glyphEl(spec, theme) {
  const el = document.createElement('span');
  el.className = 'glyph-el';
  renderGlyph(el, spec, theme);
  return el;
}

/* ---------- frames ---------- */

// A frame: titlebar + body. Content renderer chosen by spec.type.
// All chrome differences between worlds are CSS on [data-theme].
let escBound = false;
function bindMaxEscape() {
  if (escBound) return;
  escBound = true;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const m = document.querySelector('.frame.is-maxed');
    if (m) m.querySelector('.frame-max')?.click();
  });
}

export function makeFrame(spec, song, hooks = {}) {
  bindMaxEscape();
  const el = document.createElement('section');
  el.className = `frame frame-${spec.type}`;
  el.dataset.artifact = 'frame';
  el.dataset.frameId = spec.id;
  el.setAttribute('aria-label', spec.title);

  const bar = document.createElement('header');
  bar.className = 'frame-bar';
  const title = document.createElement('span');
  title.className = 'frame-title';
  title.textContent = spec.title;
  const controls = document.createElement('span');
  controls.className = 'frame-controls';
  const collapse = document.createElement('button');
  collapse.className = 'frame-btn frame-collapse';
  collapse.type = 'button';
  collapse.setAttribute('aria-label', `collapse ${spec.title}`);
  collapse.textContent = '_';
  const max = document.createElement('button');
  max.className = 'frame-btn frame-max';
  max.type = 'button';
  max.setAttribute('aria-label', `expand ${spec.title}`);
  max.textContent = '□';
  const close = document.createElement('button');
  close.className = 'frame-btn frame-close';
  close.type = 'button';
  close.setAttribute('aria-label', `close ${spec.title}`);
  close.textContent = '✕';
  collapse.addEventListener('click', () => el.classList.toggle('is-collapsed'));
  max.addEventListener('click', () => {
    el.classList.remove('is-collapsed');
    const on = el.classList.toggle('is-maxed');
    max.setAttribute('aria-label', `${on ? 'restore' : 'expand'} ${spec.title}`);
    max.textContent = on ? '❐' : '□';
  });
  close.addEventListener('click', () => {
    el.classList.add('is-closed');
    hooks.onClose?.(spec.id);
  });
  controls.append(collapse, max, close);
  bar.append(title, controls);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'frame-body';
  CONTENT[spec.type]?.(bodyEl, spec, song);

  el.append(bar, bodyEl);
  return { el, spec, bar };
}

const CONTENT = {
  chat(body, spec, song) {
    const log = document.createElement('ul');
    log.className = 'chat-log';
    const input = document.createElement('div');
    input.className = 'chat-input';
    input.innerHTML = '<span class="chat-caret loop"></span><span class="chat-hint">say something…</span>';
    body.append(log, input);
    // typer is wired by the theme/world after mount (needs the element live)
    body.dataset.pendingTyper = '1';
  },
  photos(body, spec, song) {
    const grid = document.createElement('div');
    grid.className = 'photo-grid';
    // captions vary per song — hash of slug picks the memories, year dates them
    let h = 0;
    for (const c of song.slug) h = (h * 31 + c.charCodeAt(0)) | 0;
    const places = ['the bluffs', 'the lake', 'the rooftop', 'the quarry', 'the boardwalk', 'the drive-in'];
    const events = ['night drive', 'road trip', 'that party', 'first snow', 'graduation', 'the move', 'kitchen, 3am', 'prom night'];
    const last = ["somebody’s pool", 'the last summer', 'grandma’s kitchen', 'the mall', 'backstage-ish', 'the ferry'];
    const pick = (arr, i) => arr[Math.abs(h + i * 7) % arr.length];
    const yy = String(song.year ?? '99').slice(2);
    const shots = [
      { cls: 'photo-sunset', cap: `${pick(places, 0)}, '${yy}` },
      { cls: 'photo-drive', cap: pick(events, 1) },
      { cls: 'photo-pool', cap: pick(last, 2) },
    ];
    for (const s of shots) {
      const fig = document.createElement('figure');
      fig.className = 'photo';
      fig.innerHTML = `<div class="photo-scene ${s.cls}"></div><figcaption>${s.cap}</figcaption>`;
      grid.append(fig);
    }
    body.append(grid);
  },
  player(body, spec, song) {
    const wrap = document.createElement('div');
    wrap.className = 'player';
    const track = document.createElement('div');
    track.className = 'player-track';
    track.textContent = `${song.title.toLowerCase()} — ${song.artist.toLowerCase()}`;
    wrap.append(track);
    if (song.youtube) {
      const frame = document.createElement('iframe');
      frame.className = 'player-embed';
      // enablejsapi lets the chip's listen button drive play/pause in place
      frame.src = `https://www.youtube.com/embed/${song.youtube}?rel=0&enablejsapi=1`;
      frame.title = `${song.title} — ${song.artist} (official video)`;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      wrap.append(frame);
    } else {
      const fake = document.createElement('div');
      fake.innerHTML = `
        <div class="player-bar"><i class="player-fill loop"></i></div>
        <div class="player-row">
          <span class="player-btns">◂◂ ▶ ▸▸</span>
          <span class="player-meta">128 kbps · 44 kHz</span>
        </div>`;
      wrap.append(fake);
    }
    body.append(wrap);
  },
  // Licensed lyrics via Genius's official embed, sandboxed in a srcdoc
  // iframe (their embed.js document.writes, which only works mid-parse).
  lyrics(body, spec, song) {
    if (!song.genius) {
      CONTENT.note(body, { ...spec, note: 'demo' }, song);
      return;
    }
    const frame = document.createElement('iframe');
    frame.className = 'lyrics-embed';
    frame.title = `${song.title} — ${song.artist}, lyrics on Genius`;
    frame.loading = 'lazy';
    frame.srcdoc = `<!doctype html><body style="margin:0">` +
      `<div id='rg_embed_link_${song.genius}' class='rg_embed_link' data-song-id='${song.genius}'>` +
      `Read <a href='https://genius.com/songs/${song.genius}'>“${song.title}” by ${song.artist}</a> on Genius` +
      `</div>` +
      `<script crossorigin src='https://genius.com/songs/${song.genius}/embed.js'><\/script>` +
      `</body>`;
    body.append(frame);
  },
  spec(body, spec, song) {
    const ul = document.createElement('ul');
    ul.className = 'spec-list';
    for (const line of song.spec ?? []) {
      const li = document.createElement('li');
      li.textContent = line;
      ul.append(li);
    }
    body.append(ul);
  },
  note(body, spec, song) {
    const lines = spec.note === 'menu' ? song.menu : song.lyrics;
    const wrap = document.createElement('div');
    wrap.className = 'note-text';
    if (spec.note === 'menu' && Array.isArray(lines)) {
      const ul = document.createElement('ul');
      for (const l of lines) {
        const li = document.createElement('li');
        li.textContent = l;
        ul.append(li);
      }
      wrap.append(ul);
    } else {
      for (const l of lines ?? []) {
        const p = document.createElement('p');
        p.textContent = l;
        wrap.append(p);
      }
      const tag = document.createElement('p');
      tag.className = 'note-demo-tag';
      tag.textContent = '· demo lyrics, written for this page ·';
      wrap.append(tag);
    }
    body.append(wrap);
  },
};
