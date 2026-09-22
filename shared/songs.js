// The song registry. Every field is static curation — no runtime fetching.
// artifacts: generic types re-skinned by whichever theme is active.
// frames: titled cards (window / paper scrap / slab depending on theme).
// youtube: verified official-video id — the player frame embeds it.
// genius: Genius song id — the lyrics frame embeds it.
import { CATALOG } from './catalog.js';
import { makeRng } from './rng.js';

/* Per-theme defaults. Bulk songs inherit the world's whole furniture cast —
   same frames, same artifacts, same little script — and differ only in the
   song's face: title, artist, year, media ids, and a layout seed. */

const DESKTOP_CHAT = [
  { who: 'them', text: 'you still online?' },
  { who: 'me', text: 'dial-up permitting' },
  { who: 'them', text: 'burning you a mix cd tomorrow' },
  { who: 'me', text: 'track one better be good' },
  { who: 'them', text: 'it is. it always is' },
];

const PICNIC_CHAT = [
  { who: 'them', text: 'bringing the blanket' },
  { who: 'me', text: 'the checked one?' },
  { who: 'them', text: 'obviously. save me the shady corner' },
  { who: 'me', text: 'deal. see you when the sun leans over' },
];

const THEME_DEFAULTS = {
  desktop: {
    era: 'a desktop that remembers you',
    mood: 'nostalgic, tender',
    imagery: 'pixel hearts, IM windows, old photos',
    energy: 'gentle',
    hero: { kind: 'window' },
    frames: [
      { id: 'chat', type: 'chat', title: 'instant message — online' },
      { id: 'photos', type: 'photos', title: 'my pictures' },
      { id: 'player', type: 'player', title: 'now playing' },
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
    ],
    artifacts: [
      { type: 'heart', count: 8 },
      { type: 'star', count: 5 },
    ],
    chat: DESKTOP_CHAT,
    lyrics: [
      'the crt hums a borrowed tune',
      'three dots arrive, then a name',
      'some songs never log off',
    ],
  },
  picnic: {
    era: 'endless July afternoon',
    mood: 'warm, bright, unhurried',
    imagery: 'gingham, fruit, paper scraps',
    energy: 'sunny',
    hero: { kind: 'tag' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'menu', type: 'note', title: "today's picnic", note: 'menu' },
      { id: 'player', type: 'player', title: 'the portable radio' },
      { id: 'invite', type: 'chat', title: 'the invitation' },
    ],
    artifacts: [
      { type: 'fruit', kind: 'watermelon', count: 2 },
      { type: 'fruit', kind: 'orange', count: 2 },
      { type: 'fruit', kind: 'strawberry', count: 3 },
      { type: 'flower', count: 4 },
    ],
    chat: PICNIC_CHAT,
    menu: ['one blanket, mostly red', 'something cold in the cooler', 'the good knife this time', 'somewhere to put our feet up'],
    lyrics: [
      'the cloth remembers every summer',
      'a warm wind reads the note aloud',
      'stay until the ants clock out',
    ],
  },
  kinetic: {
    era: 'right now, louder',
    mood: 'brash, elastic, alive',
    imagery: 'oversized type, liquid chrome, acid lime',
    energy: 'high, sharp',
    hero: { kind: 'letters' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'player', type: 'player', title: 'watch' },
      { id: 'spec', type: 'spec', title: 'track spec' },
    ],
    artifacts: [
      { type: 'object', count: 3 },
      { type: 'lozenge', count: 4 },
    ],
    lyrics: [
      'loud enough to hold a room',
      'the chorus lands like chrome',
      'play it once more, bigger',
    ],
    spec: ['bpm: up', 'texture: liquid chrome', 'color: acid on ink', 'format: oversized'],
  },
};

function slugHash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/* Variation pools — the seed picks the cast, so two desktops or two
   picnics share a world but not a room. */

const PICNIC_FRUITS = ['watermelon', 'orange', 'strawberry', 'peach'];
const PICNIC_MENU_POOL = [
  'one blanket, mostly red', 'something cold in the cooler', 'the good knife this time',
  'somewhere to put our feet up', 'napkins — the cloth ones', 'a speaker, charged',
  'the jar of pickles nobody eats', 'sunscreen before the second hour',
];
const FRUIT_EMOJI = { watermelon: '🍉', orange: '🍊', strawberry: '🍓', peach: '🍑' };

function varyCatalog(slug, d, r) {
  const frames = d.frames.map((f) => ({ ...f }));
  if (d === THEME_DEFAULTS.desktop) {
    const chat = frames.find((f) => f.type === 'chat');
    if (chat) chat.title = `instant message — ${slug.split('-')[0]}@aol`;
    return {
      frames,
      artifacts: [
        { type: 'heart', count: r.int(5, 10) },
        { type: 'star', count: r.int(3, 7) },
      ],
    };
  }
  if (d === THEME_DEFAULTS.picnic) {
    const kinds = [...PICNIC_FRUITS];
    const first = kinds.splice(Math.floor(r.next() * kinds.length), 1)[0];
    const second = kinds.splice(Math.floor(r.next() * kinds.length), 1)[0];
    const menu = [...PICNIC_MENU_POOL]
      .sort(() => r.next() - 0.5)
      .slice(0, r.int(3, 4));
    const menuFrame = frames.find((f) => f.note === 'menu');
    if (menuFrame) menuFrame.title = `${first} ${FRUIT_EMOJI[first]} & friends`;
    return {
      frames,
      menu,
      artifacts: [
        { type: 'fruit', kind: first, count: r.int(2, 3) },
        { type: 'fruit', kind: second, count: r.int(1, 3) },
        { type: 'fruit', kind: 'strawberry', count: r.int(0, 3) },
        { type: 'flower', count: r.int(2, 5) },
      ],
    };
  }
  return {
    frames,
    artifacts: [
      { type: 'object', count: r.int(2, 4) },
      { type: 'lozenge', count: r.int(3, 6) },
    ],
  };
}

// songs pulled from the owner's Apple Music library/suggestions
const YOURS = new Set([
  'dancing-on-my-own', 'imagine', 'counting-stars', 'borrowed-love',
  'glad-you-came', 'make-you-mine', 'nice-to-meet-ya', 'savage-love',
  'numb-little-bug', 'wondering-why', 'die-with-a-smile', 'storm-ii',
  'drag-me-down', 'what-i-need', 'bloom', 'the-hills', 'you-and-me',
  'woman', 'gotta-be-a-reason', 'party-in-the-usa', 'karma', 'true-blue',
  'thursday', 'all-i-am', 'steal-my-girl', 'i-got-to-live', 'remedy',
  'never-did-coke', 'routines-in-the-night', 'hymn-to-virgil',
  'no-judgement', 'stressed-out',
]);

// catalog row: [slug, title, artist, year, theme, youtubeId, geniusId]
function expandCatalog(row) {
  const [slug, title, artist, year, theme, youtube, genius] = row;
  const d = THEME_DEFAULTS[theme];
  const seed = slugHash(slug) % 9973;
  const r = makeRng(seed);
  const varied = varyCatalog(slug, d, r);
  return {
    slug, title, artist, year,
    era: d.era, mood: d.mood, imagery: d.imagery, energy: d.energy,
    theme, motion: 'full',
    seed,
    yours: YOURS.has(slug),
    listen: `https://www.youtube.com/watch?v=${youtube}`,
    youtube, genius,
    hero: d.hero,
    frames: varied.frames,
    artifacts: varied.artifacts,
    chat: d.chat, menu: varied.menu ?? d.menu, spec: d.spec, lyrics: d.lyrics,
  };
}

export const SONGS = {
  'strawberry-fields-forever': {
    slug: 'strawberry-fields-forever',
    title: 'Strawberry Fields Forever',
    artist: 'The Beatles',
    year: 1967,
    era: 'psychedelic picnic, half-dreamed',
    mood: 'drowsy, wondering',
    imagery: 'strawberries, field flowers, torn paper',
    energy: 'low, floaty',
    theme: 'picnic',
    motion: 'full',
    seed: 1967,
    listen: 'https://www.youtube.com/watch?v=HtUH9z_Oey8',
    youtube: 'HtUH9z_Oey8',
    genius: '68179',
    hero: { kind: 'tag' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'postcard', type: 'chat', title: 'a postcard, unsigned' },
      { id: 'player', type: 'player', title: 'the portable radio' },
    ],
    artifacts: [
      { type: 'fruit', kind: 'strawberry', count: 4 },
      { type: 'fruit', kind: 'watermelon', count: 1 },
      { type: 'flower', count: 6 },
    ],
    lyrics: [
      'the grass bends like a held breath',
      'down where the red fruit grows wild',
      'nothing here needs to be true',
      'let the afternoon decide',
    ],
    chat: [
      { who: 'them', text: 'meet me past the trees' },
      { who: 'me', text: 'the field by the river?' },
      { who: 'them', text: 'where nothing is real' },
      { who: 'me', text: 'nothing to get hung about' },
      { who: 'them', text: 'forever, then' },
    ],
  },

  'never-gonna-give-you-up': {
    slug: 'never-gonna-give-you-up',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    year: 1987,
    era: 'early internet loyalty test',
    mood: 'loyal, bouncy, suspicious of links',
    imagery: 'pixel hearts, pop-ups, promises',
    energy: 'bouncy, stubborn',
    theme: 'desktop',
    motion: 'full',
    seed: 1987,
    listen: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube: 'dQw4w9WgXcQ',
    genius: '84851',
    hero: { kind: 'window' },
    frames: [
      { id: 'chat', type: 'chat', title: 'instant message — rick_4eva' },
      { id: 'player', type: 'player', title: 'now playing' },
      { id: 'photos', type: 'photos', title: 'scanned polaroids' },
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
    ],
    artifacts: [
      { type: 'heart', count: 8 },
      { type: 'star', count: 5 },
    ],
    lyrics: [
      'the dial-up tone sings in key',
      'a promise older than the web',
      'click the link, take the chance',
      'some things never let you down',
    ],
    chat: [
      { who: 'them', text: 'check out this link i found' },
      { who: 'me', text: 'is this another one of those links' },
      { who: 'them', text: 'this one is different. promise' },
      { who: 'me', text: 'you know the rules. and so do i' },
      { who: 'them', text: 'just click it. trust me' },
      { who: 'me', text: '...fine. but if the drums start—' },
    ],
  },

  'digital-love': {
    slug: 'digital-love',
    title: 'Digital Love',
    artist: 'Daft Punk',
    year: 2001,
    era: 'Y2K desktop, dial-up romance',
    mood: 'nostalgic, tender',
    imagery: 'pixel hearts, IM windows, old photos',
    energy: 'gentle',
    theme: 'desktop',
    motion: 'full',
    seed: 2001,
    listen: 'https://www.youtube.com/watch?v=FxzBvqY5PP0',
    youtube: 'FxzBvqY5PP0',
    genius: '72011',
    hero: { kind: 'window' },
    frames: [
      { id: 'chat', type: 'chat', title: 'instant message — daft_lover_88' },
      { id: 'photos', type: 'photos', title: 'my pictures' },
      { id: 'player', type: 'player', title: 'now playing' },
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
    ],
    artifacts: [
      { type: 'heart', count: 9 },
      { type: 'star', count: 5 },
    ],
    lyrics: [
      'the screen glows soft at 2am',
      'your name arrives, the room goes quiet',
      'somewhere a modem hums our song',
      'and every pixel spells stay',
    ],
    chat: [
      { who: 'them', text: 'you still up?' },
      { who: 'me', text: 'always. brb, making tea' },
      { who: 'them', text: 'i keep replaying that song' },
      { who: 'them', text: 'the one from your away message' },
      { who: 'me', text: 'digital love <3' },
      { who: 'them', text: 'wish you were here' },
      { who: 'me', text: 'close your eyes. i am' },
    ],
  },

  'humble': {
    slug: 'humble',
    title: 'HUMBLE.',
    artist: 'Kendrick Lamar',
    year: 2017,
    era: 'monumental minimalism',
    mood: 'defiant, airborne, exact',
    imagery: 'oversized type, chrome weight, negative space',
    energy: 'high, percussive',
    theme: 'kinetic',
    motion: 'full',
    seed: 2017,
    listen: 'https://www.youtube.com/watch?v=tvTRZJ-4EyI',
    youtube: 'tvTRZJ-4EyI',
    genius: '3039923',
    hero: { kind: 'letters' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'player', type: 'player', title: 'watch' },
      { id: 'spec', type: 'spec', title: 'track spec' },
    ],
    artifacts: [
      { type: 'object', count: 4 },
      { type: 'lozenge', count: 5 },
    ],
    lyrics: [
      'be measured, then be more',
      'the room adjusts around the beat',
      'light falls where it is told to',
      'say less — the type says it',
    ],
    spec: ['tempo: marching', 'texture: brushed chrome', 'color: acid on ink', 'format: monumental'],
  },

  'watermelon-sugar': {
    slug: 'watermelon-sugar',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    year: 2019,
    era: 'endless July afternoon',
    mood: 'warm, bright, sweet',
    imagery: 'watermelon, gingham, scattered seeds',
    energy: 'sunny, unhurried',
    theme: 'picnic',
    motion: 'full',
    seed: 707,
    listen: 'https://www.youtube.com/watch?v=E07s5ZYygMg',
    youtube: 'E07s5ZYygMg',
    genius: '5007939',
    hero: { kind: 'tag' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'menu', type: 'note', title: "today's picnic", note: 'menu' },
      { id: 'player', type: 'player', title: 'the portable radio' },
      { id: 'invite', type: 'chat', title: 'the invitation' },
    ],
    artifacts: [
      { type: 'fruit', kind: 'watermelon', count: 2 },
      { type: 'fruit', kind: 'orange', count: 2 },
      { type: 'fruit', kind: 'strawberry', count: 3 },
      { type: 'flower', count: 4 },
    ],
    lyrics: [
      'sweet like the slice we saved for last',
      'juice on our wrists, sun on the cloth',
      'the afternoon refuses to end',
      'and neither do i',
    ],
    menu: ['one blanket, mostly red', 'melon cut too thick', 'crusts off, obviously', 'somewhere to put our feet up'],
    chat: [
      { who: 'them', text: 'packing the basket now' },
      { who: 'me', text: 'did you get the good melon?' },
      { who: 'them', text: 'the one we thumped for ages' },
      { who: 'me', text: 'perfect. see you at the hill' },
    ],
  },

  'peaches': {
    slug: 'peaches',
    title: 'Peaches',
    artist: 'Justin Bieber',
    year: 2021,
    era: 'convertible summer, top down',
    mood: 'soft, ripe, unbothered',
    imagery: 'peaches, roadside fruit stand, gingham',
    energy: 'warm, cruising',
    theme: 'picnic',
    motion: 'full',
    seed: 404,
    listen: 'https://www.youtube.com/watch?v=tQ0yjYUFKAE',
    youtube: 'tQ0yjYUFKAE',
    genius: '6326342',
    hero: { kind: 'tag' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'menu', type: 'note', title: 'fruit stand haul', note: 'menu' },
      { id: 'player', type: 'player', title: 'car radio' },
    ],
    artifacts: [
      { type: 'fruit', kind: 'peach', count: 4 },
      { type: 'fruit', kind: 'orange', count: 2 },
      { type: 'fruit', kind: 'strawberry', count: 2 },
      { type: 'flower', count: 3 },
    ],
    lyrics: [
      'windows down past the orchard rows',
      'sticky hands on a paper map',
      'the radio keeps one song warm',
      'we get there when we get there',
    ],
    menu: ['three peaches, still warm', 'one soda, glass bottle', 'napkins we will not use', 'the long way home'],
  },

  'von-dutch': {
    slug: 'von-dutch',
    title: 'Von dutch',
    artist: 'Charli XCX',
    year: 2024,
    era: 'right now, louder',
    mood: 'brash, elastic, alive',
    imagery: 'oversized type, liquid chrome, acid lime',
    energy: 'high, sharp',
    theme: 'kinetic',
    motion: 'full',
    seed: 360,
    listen: 'https://www.youtube.com/watch?v=cwZ1L_0QLjw',
    youtube: 'cwZ1L_0QLjw',
    genius: '9503812',
    hero: { kind: 'letters' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'player', type: 'player', title: 'watch' },
      { id: 'spec', type: 'spec', title: 'track spec' },
    ],
    artifacts: [
      { type: 'object', count: 3 },
      { type: 'lozenge', count: 4 },
    ],
    lyrics: [
      'every lens finds me first',
      'i bend the room when i walk in',
      'say my name like a headline',
      'watch it stretch and snap back',
    ],
    spec: ['bpm: club', 'texture: liquid chrome', 'color: acid on ink', 'format: oversized'],
  },

  '360': {
    slug: '360',
    title: '360',
    artist: 'Charli XCX',
    year: 2024,
    era: 'mirror-check at the function',
    mood: 'everywhere, razor-clean',
    imagery: 'reflective chrome, flash photography, tight type',
    energy: 'high, spinning',
    theme: 'kinetic',
    motion: 'full',
    seed: 666,
    listen: 'https://www.youtube.com/watch?v=WJW-VvmRKsE',
    youtube: 'WJW-VvmRKsE',
    genius: '10235578',
    hero: { kind: 'letters' },
    frames: [
      { id: 'lyrics', type: 'lyrics', title: 'lyrics — via genius' },
      { id: 'player', type: 'player', title: 'watch' },
    ],
    artifacts: [
      { type: 'object', count: 3 },
      { type: 'lozenge', count: 6 },
    ],
    lyrics: [
      'catch the light from every side',
      'the mirror never blinks first',
      'three sixty and still turning',
      'the party orbits, not the other way',
    ],
  },
};

// expand the bulk catalog into the registry (curated entries above keep
// their bespoke fields; catalog songs inherit theme defaults)
for (const row of CATALOG) {
  const song = expandCatalog(row);
  if (!SONGS[song.slug]) SONGS[song.slug] = song;
}

// chronological — the gallery reads like a timeline of how songs looked
export const ORDER = Object.values(SONGS)
  .sort((a, b) => a.year - b.year)
  .map((s) => s.slug);

export function neighbors(slug) {
  const i = ORDER.indexOf(slug);
  return {
    prev: SONGS[ORDER[(i + ORDER.length - 1) % ORDER.length]],
    next: SONGS[ORDER[(i + 1) % ORDER.length]],
  };
}
