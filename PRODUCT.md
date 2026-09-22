# PRODUCT.md — Every Song Is a Website

**Live:** https://music.significanthobbies.com

## Purpose contract

Every Song Is a Website gives each song its own playable, full-screen visual
world — assembled from curated themes, polished artifacts, and light
interaction — for people who want to *be inside* a song for a minute.

- **Audience:** music fans and web-playful visitors who follow a shared link.
- **Outcome:** each song becomes a memorable, shareable place, not a player.
- **Mechanism:** a small set of curated themes (world grammar), reusable
  artifacts (objects), and behaviours (motion/interaction) composed per song
  from a static config: era reference, mood, imagery, energy, theme, artifacts,
  motion intensity, and a layout seed.
- **Surface mode:** Experience. The artifact leads from the first viewport;
  song title, artist, listening link, and navigation stay accessible but
  visually secondary.

## Explicit non-goals (v0)

- Not a streaming app, not a universal website generator.
- No backend, accounts, payments, runtime AI, audio hosting, or lyric scraping.
- Lyrics are optional collapsible cards with original demo text only; every
  page must work without them.

## First deliverable

Three polished, contrasting demo songs:

1. **Digital Love — Daft Punk** → old-desktop world: draggable windows, chat,
   photographs, pixel hearts, taskbar, gentle motion.
2. **Watermelon Sugar — Harry Styles** → picnic world: gingham cloth,
   watermelon, scattered seeds, draggable/rolling fruit.
3. **Von dutch — Charli XCX** → contemporary world: oversized kinetic type,
   sculptural objects, elastic interactions, sharper transitions.

## Hard requirements

- Responsive desktop + mobile; restrained animation; `prefers-reduced-motion`
  support plus a visible motion toggle.
- Per-song shareable URLs.
- Experiment panel per page: switch theme, toggle artifacts, adjust motion,
  regenerate the seeded layout.
- The three pages must be genuinely different compositions — not one layout
  recoloured. Each needs at least one enjoyable interaction, and controls must
  stay usable over moving objects.
