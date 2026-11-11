# Add to home screen (PWA shell)

## What was wrong
The site had a minimal `manifest.webmanifest` (SVG icon only, `start_url` at `./`, no landscape/fullscreen, no maskable PNGs, no service worker, no install hint). Installability and “open the game full screen from the home screen” were not there.

## What changed
- **`manifest.webmanifest`**: name / short_name, dossier `#12100e` theme & background, `display: fullscreen` (+ standalone override), `orientation: landscape`, relative `start_url: ./Game/` and `scope: ./` (works on beta subpath and live).
- **`assets/icons/`**: maskable 192/512 PNGs, apple-touch-icon, and iOS startup images — drawn from the dossier file mark (no GPU).
- **`sw.js`**: caches only the shell + `offline.html`. Skips Unity / `.unityweb` / builds. HTML is network-first with `cache: "no-store"` so a new deploy is never a stale page; offline falls back to the offline card, not a cached index.
- **`offline.html`**: dossier-toned “file out of reach” card.
- **`site/a2hs.js`**: registers the worker; phone-only “Keep this address” hint after the **second browser session** (one bump per `sessionStorage` session); dismiss remembered in `localStorage`; Install via `beforeinstallprompt` when present, iOS Share steps otherwise. `?a2hs=1` forces the hint for shots.
- Wired apple / manifest / a2hs on `index.html`, `lore.html`, `privacy.html`, `whatsnew.html`, and `Game/index.html`.
- **`privacy.html`**: notes the shell cache and A2HS localStorage keys.
- **Playtest**: scenario `install-hint` in `site/playtest.js` (named in `.hawkes/scenario.txt`).

## Checks
- No `package.json` / build step.
- Static fetch of manifest, icons, `sw.js`, offline page, page head tags; relative (not root-absolute) asset links.
- Fun-reviewer: **living** (shell tone); gaps none for non-world change.
- Reviewer: first pass **revise** (pageview vs visit); fixed session counting; second pass **merge**.

## Note for J
- Client SW only — no Cache-Control / edge / CDN changes (keeps m_92901cfcc7df for server/edge caching).
- GPU budget unused; icons are code-drawn from the favicon mark. Optional later: Gen-polished maskable icons / splash (~estimate if wanted).
- Lighthouse installability + 390px hint shots: judge on beta playtest (`install-hint`, phone device).
