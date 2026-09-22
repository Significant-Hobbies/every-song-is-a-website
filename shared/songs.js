// The song registry. Every field is static curation — no runtime fetching.
// artifacts: generic types re-skinned by whichever theme is active.
// frames: titled cards (window / paper scrap / slab depending on theme).
export const SONGS = {
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
    listen: 'https://open.spotify.com/search/Digital%20Love%20Daft%20Punk',
    hero: { kind: 'window', hint: 'drag windows · click icons · catch hearts' },
    frames: [
      { id: 'chat', type: 'chat', title: 'instant message — daft_lover_88' },
      { id: 'photos', type: 'photos', title: 'my pictures' },
      { id: 'player', type: 'player', title: 'now playing' },
      { id: 'note', type: 'note', title: 'feelings.txt — notepad', note: 'demo lyric card' },
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
    listen: 'https://open.spotify.com/search/Watermelon%20Sugar%20Harry%20Styles',
    hero: { kind: 'tag', hint: 'drag the fruit · click the melon' },
    frames: [
      { id: 'note', type: 'note', title: 'a note, folded twice', note: 'demo lyric card' },
      { id: 'menu', type: 'note', title: "today's picnic", note: 'menu' },
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
    listen: 'https://open.spotify.com/search/Von%20dutch%20Charli%20XCX',
    hero: { kind: 'letters', hint: 'run your cursor through the title · grab the chrome' },
    frames: [
      { id: 'note', type: 'note', title: 'lyrics.txt', note: 'demo lyric card' },
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
};

export const ORDER = ['digital-love', 'watermelon-sugar', 'von-dutch'];

export function neighbors(slug) {
  const i = ORDER.indexOf(slug);
  return {
    prev: SONGS[ORDER[(i + ORDER.length - 1) % ORDER.length]],
    next: SONGS[ORDER[(i + 1) % ORDER.length]],
  };
}
