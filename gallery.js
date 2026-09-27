// Gallery — renders one door per song from the registry. Each door carries a
// miniature of its world's skin; adding a song to shared/songs.js is enough.
import './shared/clarity.js';
import './shared/app-health.js';
import { ORDER, SONGS } from './shared/songs.js';

const DESC = {
  desktop: 'a year-2000 desktop',
  picnic: 'a picnic blanket',
  kinetic: 'an acid poster',
  neon: 'a neon night',
  scrapbook: 'a scrapbook page',
};

const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

/* picnic doors show the song's own fruit — seed picks it */
const FRUIT_MINIS = [
  `<svg class="mini-melon" viewBox="0 0 120 120">
    <path d="M12 40 A52 52 0 0 0 108 40 Z" fill="#3f9e4d"/>
    <path d="M18 40 A46 46 0 0 0 102 40 Z" fill="#eef5dc"/>
    <path d="M24 40 A40 40 0 0 0 96 40 Z" fill="#ff6b7d"/>
    <ellipse cx="46" cy="56" rx="3" ry="4.4" fill="#3a2a2e"/>
    <ellipse cx="74" cy="56" rx="3" ry="4.4" fill="#3a2a2e"/>
    <ellipse cx="60" cy="70" rx="3" ry="4.4" fill="#3a2a2e"/>
  </svg>`,
  `<svg class="mini-melon" viewBox="0 0 120 120">
    <circle cx="60" cy="62" r="42" fill="#f58a1f"/>
    <circle cx="60" cy="62" r="33" fill="#ffbf5e"/>
    <g stroke="#ffe9bf" stroke-width="3">
      <line x1="60" y1="30" x2="60" y2="94"/><line x1="32" y1="48" x2="88" y2="76"/>
      <line x1="32" y1="76" x2="88" y2="48"/>
    </g>
    <circle cx="60" cy="62" r="6" fill="#ffe9bf"/>
  </svg>`,
  `<svg class="mini-melon" viewBox="0 0 120 120">
    <path d="M60 106 C38 96 20 72 20 50 C20 32 38 22 60 22 C82 22 100 32 100 50 C100 72 82 96 60 106 Z" fill="#f03e52"/>
    <path d="M42 28 C48 14 72 14 78 28 C68 21 52 21 42 28 Z" fill="#43a047"/>
    <ellipse cx="42" cy="52" rx="2.4" ry="3.6" fill="#ffe1a8"/><ellipse cx="60" cy="46" rx="2.4" ry="3.6" fill="#ffe1a8"/>
    <ellipse cx="78" cy="52" rx="2.4" ry="3.6" fill="#ffe1a8"/><ellipse cx="51" cy="70" rx="2.4" ry="3.6" fill="#ffe1a8"/>
    <ellipse cx="69" cy="70" rx="2.4" ry="3.6" fill="#ffe1a8"/><ellipse cx="60" cy="88" rx="2.4" ry="3.6" fill="#ffe1a8"/>
  </svg>`,
  `<svg class="mini-melon" viewBox="0 0 120 120">
    <path d="M60 28 C40 28 24 45 24 64 C24 87 41 105 60 105 C79 105 96 87 96 64 C96 45 80 28 60 28 Z" fill="#ffb59e"/>
    <path d="M60 31 C54 49 54 77 60 101" stroke="#e8795a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M60 25 C58 13 66 7 77 9 C77 19 70 25 60 25 Z" fill="#43a047"/>
  </svg>`,
];

const SCENES = {
  desktop: (s) => `
    <div class="mini-window">
      <span class="mini-bar"><i></i><i></i><i></i></span>
      <span class="mini-title">${s.slug}.exe</span>
    </div>
    <i class="mini-heart h1"></i><i class="mini-heart h2"></i><i class="mini-heart h3"></i>
    <div class="mini-taskbar"></div>`,
  picnic: (s) => {
    const h = hash(s.slug);
    const tilt = (h % 21) - 10;
    return FRUIT_MINIS[h % FRUIT_MINIS.length].replace('class="mini-melon"', `class="mini-melon" style="transform:rotate(${tilt}deg)"`)
      + `<i class="mini-seed s1"></i><i class="mini-seed s2"></i><i class="mini-seed s3"></i>`;
  },
  kinetic: (s) => `
    <span class="mini-type">${s.title.toUpperCase().split(' ').join('<br>')}</span>
    <i class="mini-blob"></i>`,
  neon: (s) => `
    <i class="mini-sun"></i>
    <span class="mini-sign">${s.title.toLowerCase()}</span>
    <div class="mini-grid"></div>`,
  scrapbook: (s) => `
    <i class="mini-tape"></i>
    <span class="mini-hand">${s.title.toLowerCase()}</span>
    <span class="mini-line"></span>
    <i class="mini-doodle"></i>`,
};

const ERAS = {
  196: 'the sixties', 197: 'the seventies', 198: 'the eighties', 199: 'the nineties',
  200: 'the two-thousands', 201: 'the twenty-tens', 202: 'the twenty-twenties',
};

const doors = document.getElementById('doors');
const built = [];
const eras = []; // { el, doors: [] }
// masthead counts itself
const tagline = document.querySelector('.masthead p');
if (tagline) tagline.textContent =
  `${ORDER.length} songs, five worlds, one video player each. pick a door — drag things, click things, stay a minute.`;
let era = null;
for (const slug of ORDER) {
  const song = SONGS[slug];
  const decade = Math.floor(song.year / 10);
  if (!era || era.decade !== decade) {
    era = { decade, el: document.createElement('div'), doors: [] };
    era.el.className = 'era';
    era.el.textContent = ERAS[decade] ?? `the ${decade}0s`;
    doors.append(era.el);
    eras.push(era);
  }
  const door = document.createElement('a');
  door.className = `door d-${song.theme}`;
  door.href = `${slug}/`;
  door.innerHTML = `
    <div class="door-scene" aria-hidden="true">${SCENES[song.theme](song)}</div>
    <div class="door-meta">
      <h2>${song.title}</h2>
      <p>${song.artist} · ${song.year} · ${DESC[song.theme]}</p>
      <span class="door-go">enter →</span>
    </div>`;
  built.push({ door, haystack: `${song.title} ${song.artist} ${song.year}`.toLowerCase() });
  era.doors.push(door);
  doors.append(door);
}

/* filter search — hides empty era headers too */
const seek = document.getElementById('seek');
const empty = document.getElementById('seekEmpty');
seek?.addEventListener('input', () => {
  const q = seek.value.trim().toLowerCase();
  let shown = 0;
  for (const { door, haystack } of built) {
    const hit = !q || haystack.includes(q);
    door.style.display = hit ? '' : 'none';
    if (hit) shown++;
  }
  for (const e of eras) e.el.style.display = e.doors.some((d) => d.style.display !== 'none') ? '' : 'none';
  empty.hidden = shown > 0;
});

/* surprise me */
document.getElementById('surprise')?.addEventListener('click', () => {
  location.href = `${ORDER[Math.floor(Math.random() * ORDER.length)]}/`;
});
seek?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { seek.value = ''; seek.dispatchEvent(new Event('input')); }
});
document.getElementById('seekClear')?.addEventListener('click', () => {
  seek.value = ''; seek.dispatchEvent(new Event('input')); seek.focus();
});
