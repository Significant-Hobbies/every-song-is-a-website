# Every Song Is a Website

Interactive visual worlds for individual songs. Browse the gallery, open a song at its own URL, and explore its windows, objects, and theme controls.

[Open the website](https://music.significanthobbies.com).

## Run locally

This is a dependency-free static website. There is no build step, package manager, backend, or account setup.

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. Serve the pages over HTTP because the runtime uses JavaScript modules. Embedded video availability depends on YouTube and the serving origin.

## Repository layout

- `index.html` and `gallery.js` provide the searchable song gallery.
- Each song has a root directory with its own `index.html` and shareable URL.
- `shared/songs.js` and `shared/catalog.js` define the song registry and catalog.
- `shared/` contains the window runtime, interactions, and reusable artifacts.
- `themes/` contains the desktop, picnic, kinetic, neon, and scrapbook worlds.
- `404.html` provides recovery and song search for unknown URLs.
- `tests/` contains the repository's checks.

The site embeds YouTube playback and Genius lyric cards rather than hosting audio or copying lyrics. Motion controls and reduced-motion preferences are part of the experience.

See [PRODUCT.md](PRODUCT.md) for the product contract and [AGENTS.md](AGENTS.md) for contributor instructions and deployment details.
