# Every Song Is a Website — agent instructions

Dependency-free static site. No build step, no package manager, no backend.

## Run

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works. Pages must be served over HTTP (ES modules);
opening `index.html` via `file://` will not work.

## Check

```bash
node --check shared/*.js themes/*.js   # syntax check all modules
```

## Structure

- `index.html` — song gallery (registry-driven doors + live filter search).
- `404.html` — recovery page with the same live search; served automatically
  by static hosts (Cloudflare Pages etc.) for unknown URLs. Uses absolute
  `/song/…` links since 404s resolve from arbitrary paths.
- `song/<slug>/index.html` — one directory per song; shareable URL.
- `shared/songs.js` — the song registry: the 8 curated configs plus
  THEME_DEFAULTS that bulk songs inherit (frames, artifacts, chat, seed).
- `shared/catalog.js` — generated `[slug, title, artist, year, theme,
  youtubeId, geniusId]` rows for the bulk catalog (100+ songs).
  Regenerate with `python3 tools/fetch-song-ids.py` — it calls Genius's
  public search endpoint and scrapes YouTube results; review before
  committing, it can return nulls or wrong hits for obscure queries.
- `gallery.js` — renders the index doors from the registry (per-theme mini
  scenes), so new songs appear automatically.
- `shared/` — world runtime: seeded rng, scatter layout, behaviours
  (drag/spring/float/trail), artifact factories, chrome, experiment panel.
- `themes/` — one `.js` + `.css` per world (`desktop`, `picnic`, `kinetic`).
  Themes are runtime-switchable; artifacts must re-skin under every theme via
  `data-theme` scoping and `data-artifact` selectors.

## Deploy

Live at **https://music.significanthobbies.com** — a static-assets Cloudflare
Worker (`wrangler.jsonc`: `assets.directory: ./`, `not_found_handling:
404-page`, custom-domain route). Deploy with `npx wrangler deploy` from this
directory; `.assetsignore` keeps repo artifacts out of the bundle.

## Rules

- Keep it dependency-free. If a framework is ever adopted, say why in
  PRODUCT.md first.
- Lyrics render via Genius's official embed (`shared/artifacts.js` →
  `CONTENT.lyrics`, srcdoc iframe + `embed.js`) — licensed, never scraped.
  Each song carries a verified `genius` id. Keep any hand-written lines as
  original demo text only — never real copyrighted lyrics.
- New artifacts belong in `shared/artifacts.js` with a `data-artifact` name
  and a style block in each theme CSS.
- Respect `data-motion` (`full|calm|off`) and `prefers-reduced-motion`.
- Player frames embed YouTube (`www.youtube.com/embed/<id>`). Restricted
  videos refuse to play on bare-IP origins — `127.0.0.1` shows "unavailable"
  while any named host works. For local playback map a name in /etc/hosts
  (e.g. `127.0.0.1 esw.local`) or serve over the deployed URL.
- Design evidence and review receipts live in `.fleet/` and `artifacts/design/`.
