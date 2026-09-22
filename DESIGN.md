# DESIGN.md — Every Song Is a Website

Direction is owner-supplied by the project PRD (three named worlds, artifacts,
interactions). This file records the durable rules of that direction and the
shared system underneath it.

## The composition system

Every song page composes three layers:

- **Theme** — a complete world grammar: surface, typography, palette, artifact
  styling, chrome styling, motion register. Applied via `data-theme` on
  `<html>`; themes are switchable at runtime from the experiment panel.
- **Artifacts** — DOM objects built by `shared/artifacts.js`. They carry a
  generic `data-artifact` type and must re-skin correctly under every theme.
  Author artifacts semantically (a fruit is `role`-less decor unless
  interactive; a window is a focusable region).
- **Behaviours** — pointer drag with inertia, springs, floating, cursor
  trails, seeded scatter. One toolkit in `shared/`, parameterized per song's
  `motion` intensity and the user's motion setting.

Randomness is confined to position, timing, and small surprises — driven by a
seeded PRNG so a layout seed is reproducible. The *design* is never random.

## Motion

Three levels on `<html data-motion>`: `full`, `calm`, `off`.
`prefers-reduced-motion` defaults the level to `calm`. `off` disables loops
and makes interactions instant. Controls and content never depend on motion.

## World 1 — `desktop` ("Digital Love")

A year-2000 desktop OS, played straight and with love.

- **Surface:** teal desktop (#007b7b–#008080 range) with a faint dither;
  bottom taskbar with start button, window task buttons, a real clock.
- **Components:** windows with gradient navy titlebars, beveled 2px borders
  (white/#dfdfdf top-left, #404040 bottom-right), `_ ▢ ✕` controls. Windows
  drag by titlebar, focus raises z-index, close returns them to the taskbar.
- **Artifacts:** pixel-art hearts (box-shadow sprites), IM chat window with
  timed incoming messages, photo frames, a media-player window with a moving
  progress bar, notepad lyric card, desktop icons that open windows.
- **Type:** Tahoma for UI chrome (authentic), Silkscreen for pixel accents.
- **Motion:** gentle bobbing, soft heart-bursts, a heart cursor trail.
- **Song chrome:** a pinned "SONG.EXE" window; the gallery link lives on the
  taskbar.

## World 2 — `picnic` ("Watermelon Sugar")

A picnic blanket seen from above, warm noon light.

- **Surface:** red/white gingham cloth (the subject's real texture — this is
  cloth, not a decorative grid), warm vignette, slow-drifting sun.
- **Components:** everything is a sticker or paper scrap — thick white sticker
  outline, soft offset shadow, small random tilts.
- **Artifacts:** SVG fruit (watermelon wedge, orange, strawberry) that drag
  with momentum and roll (rotation follows travel), watermelon-seed pops on
  click, an ant parade along a wiggly path, a kraft-paper lyric napkin.
- **Type:** Shantell Sans for labels (bouncy hand-drawn axis), Caveat for
  handwriting.
- **Motion:** physics-ish momentum, soft bounce at edges, ants march, sun
  rays rotate slowly.
- **Song chrome:** a kraft tag tied with twine, slightly rotated.

## World 3 — `kinetic` ("Von dutch")

An acid-printed poster you can grab.

- **Surface:** near-black ink ground, acid lime (#d2ff2f) as the only loud
  color, white secondary. No grid overlays, no glow washes.
- **Components:** oversized Archivo variable headline — pointer proximity
  stretches letters along the `wdth` axis and they spring back. Hairline
  rules, mono microcopy, sharp edges (radius ≤ 4px).
- **Artifacts:** liquid-chrome blobs (layered conic/radial gradients) that
  drag with elastic squash-and-overshoot; a bottom marquee ticker; ring-pulse
  click response; acid lozenges.
- **Type:** Archivo (variable width axis is the instrument), JetBrains Mono
  for labels/tickers.
- **Motion:** fast, elastic, high contrast — springs, skew by cursor
  velocity, snap transitions.
- **Song chrome:** top-left mono spec block; acid pill "listen" button.

## Media

Each song's player frame embeds the official YouTube video
(`youtube.com/embed/<id>`, lazy-loaded) inside the theme's chrome — a media
window on the desktop, a taped scrap on the blanket, a slab on the poster.
The frame falls back to the themed faux transport when no id is configured.
Note: restricted videos refuse playback on bare-IP origins (127.0.0.1) —
embeds work on any named host or the deployed URL.

Lyrics are the licensed Genius embed inside a `lyrics` frame — a notepad
window on the desktop, a taped scrap on the blanket, a slab on the poster.
It mounts in a srcdoc iframe so Genius's `embed.js` (which `document.write`s)
runs sandboxed.

## Shared chrome

- Song chip (title · artist · listen ↗ · next song) — themed but always
  present, visually secondary.
- Experiment panel (bottom-right): theme switcher, artifact toggles, motion
  select, "recompose" seed button. Themed skin, identical function.
- Motion toggle sits inside the panel and, on touch layouts, as a chip on the
  song bar.

## Refusals

- No lyric scraping or real copyrighted lyrics — demo text only, labeled.
- No framework/library chrome that fights the worlds (no stock navbars,
  cards, or UI kits; every atom is drawn in the active world's grammar).
- No autoplaying audio, no fake claims (listening links go to search, not to
  fabricated track IDs).
