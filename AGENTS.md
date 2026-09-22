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

- `index.html` — song gallery.
- `song/<slug>/index.html` — one directory per song; shareable URL.
- `shared/songs.js` — the song registry: every song's config (theme, mood,
  imagery, artifacts, motion, seed, lyrics) lives here.
- `shared/` — world runtime: seeded rng, scatter layout, behaviours
  (drag/spring/float/trail), artifact factories, chrome, experiment panel.
- `themes/` — one `.js` + `.css` per world (`desktop`, `picnic`, `kinetic`).
  Themes are runtime-switchable; artifacts must re-skin under every theme via
  `data-theme` scoping and `data-artifact` selectors.

## Rules

- Keep it dependency-free. If a framework is ever adopted, say why in
  PRODUCT.md first.
- Lyrics must be original demo text only — never real copyrighted lyrics.
- New artifacts belong in `shared/artifacts.js` with a `data-artifact` name
  and a style block in each theme CSS.
- Respect `data-motion` (`full|calm|off`) and `prefers-reduced-motion`.
- Design evidence and review receipts live in `.fleet/` and `artifacts/design/`.
