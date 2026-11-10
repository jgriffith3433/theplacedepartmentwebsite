# Screenshot gallery + share cards (HUD-free)

## What was wrong
The exhibit gallery still showed six old Arcade frames from `v1.5.0 beta · build 41` with a full HUD. There was no lightbox, no srcset, one shared `og-card.jpg` (also HUD-bearing) for every page, and no site scenario that exercised the gallery.

## What changed
- **9 HUD-free exhibits** (`assets/shots/shot-1..9.jpg` + `-640.jpg` srcset): hub doors, Ch.1–6 cutscene beats (process server / Registrar / Order for 4–6), Courier boss, Wallit cast. Built with ffmpeg from breakingthrough `Assets/Resources/Cinematics/Art` (no GPU). Rebuild: `python3 tools/make-gallery.py [breakingthrough]`.
- **Dossier captions** on each figure; tap opens a **lightbox** (arrows desktop, swipe phone, Escape/close) in `site/marketing.js` + `site/dossier.css`.
- **Share cards:** rebuilt `assets/og-card.jpg` (home); new `assets/og-lore.jpg` (lore.html) and `assets/og-game.jpg` (Game/index.html).
- **Playtest:** scenario `gallery` on the landing `hawkesPlaytest` bridge — scrolls to exhibits, opens lightbox, arrows + swipe, Escape, asserts home/lore/Game `og:image`; fails closed on bug problems. Named in `.hawkes/scenario.txt`.

## Checks
- No `package.json` (static site).
- Counted 9 lazy+srcset thumbs; OG tags per home/lore/Game; looked at regenerated JPGs (no HUD).
- Fun-reviewer: **thin** (mid-route stills were empty; swapped Ch.4–6 for server/Registrar/Order beats).
- Reviewer: **revise** notes applied (fail-closed playtest; lore+Game OG fetch checks).

## GPU
None used. Budget was none. No GPU estimate needed for a follow-up.

## For J
Beta playtest should run `gallery` at desktop and ~390px; confirm lightbox swipe/arrows and that share previews resolve once live (og URLs are theplacedepartment.com).
