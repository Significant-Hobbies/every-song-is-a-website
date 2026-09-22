// Gallery — renders one door per song from the registry. Each door carries a
// miniature of its world's skin; adding a song to shared/songs.js is enough.
import { ORDER, SONGS } from './shared/songs.js';

const DESC = {
  desktop: 'a year-2000 desktop',
  picnic: 'a picnic blanket',
  kinetic: 'an acid poster',
};

const SCENES = {
  desktop: (s) => `
    <div class="mini-window">
      <span class="mini-bar"><i></i><i></i><i></i></span>
      <span class="mini-title">${s.slug}.exe</span>
    </div>
    <i class="mini-heart h1"></i><i class="mini-heart h2"></i><i class="mini-heart h3"></i>
    <div class="mini-taskbar"></div>`,
  picnic: () => `
    <svg class="mini-melon" viewBox="0 0 120 120">
      <path d="M12 40 A52 52 0 0 0 108 40 Z" fill="#3f9e4d"/>
      <path d="M18 40 A46 46 0 0 0 102 40 Z" fill="#eef5dc"/>
      <path d="M24 40 A40 40 0 0 0 96 40 Z" fill="#ff6b7d"/>
      <ellipse cx="46" cy="56" rx="3" ry="4.4" fill="#3a2a2e"/>
      <ellipse cx="74" cy="56" rx="3" ry="4.4" fill="#3a2a2e"/>
      <ellipse cx="60" cy="70" rx="3" ry="4.4" fill="#3a2a2e"/>
    </svg>
    <i class="mini-seed s1"></i><i class="mini-seed s2"></i><i class="mini-seed s3"></i>`,
  kinetic: (s) => `
    <span class="mini-type">${s.title.toUpperCase().split(' ').join('<br>')}</span>
    <i class="mini-blob"></i>`,
};

const doors = document.getElementById('doors');
const built = [];
// masthead counts itself
const tagline = document.querySelector('.masthead p');
if (tagline) tagline.textContent =
  `${ORDER.length} songs, three worlds, one video player each. pick a door — drag things, click things, stay a minute.`;
for (const slug of ORDER) {
  const song = SONGS[slug];
  const door = document.createElement('a');
  door.className = `door d-${song.theme}`;
  door.href = `song/${slug}/`;
  door.innerHTML = `
    <div class="door-scene" aria-hidden="true">${SCENES[song.theme](song)}</div>
    <div class="door-meta">
      <h2>${song.title}</h2>
      <p>${song.artist} · ${song.year} · ${DESC[song.theme]}</p>
      <span class="door-go">enter →</span>
    </div>`;
  built.push({ door, haystack: `${song.title} ${song.artist} ${song.year}`.toLowerCase() });
  doors.append(door);
}

/* filter search */
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
  empty.hidden = shown > 0;
});
seek?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { seek.value = ''; seek.dispatchEvent(new Event('input')); }
});
document.getElementById('seekClear')?.addEventListener('click', () => {
  seek.value = ''; seek.dispatchEvent(new Event('input')); seek.focus();
});
