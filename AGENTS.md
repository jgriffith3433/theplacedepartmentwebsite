# The Place Department website — agent notes

The site for **The Place Department** (theplacedepartment.com), static on GitHub Pages. In the Hawkes
Biomedical line it is sold as *HIPAA-compliant document storage*: "where things that should not exist are
given an address". `Game/v<n>/` is the WebGL build from the Unity project `C:\Projects\breakingthrough`
(its deploy window writes it and points `Game/index.html` at it); don't hand-edit build output. Local dev:
`auto-start.bat` (http://localhost:4173). Publishing is pushing to `main`: ask J first.

## Generative AI: Hawkes Gen

Images, textures, video, 3D, music, voice, sound and Claude all go through **Hawkes Gen**
(`C:\Projects\hawkesgen`, dashboard http://127.0.0.1:8790; start it with `hawkesgen\auto-start.bat`). It holds
the API and AWS keys and runs the shared GPU fleet. This project never holds those keys.

- **Agents:** the `hawkesgen` MCP server is in this folder's `.mcp.json`. Use `hawkesgen_presets` (project
  `theplacedepartment`) for the art direction, then `hawkesgen_run`.
- **Command line:** `C:\Projects\hawkesgen\hawkesgen.cmd run - --project theplacedepartment --preset <name> --param prompt="..." --out <folder>`
- **Art direction:** `hawkesgen/presets/theplacedepartment.json` (style line and named presets). Edit it there.
- **Code:** copy `hawkesgen/clients/js/hawkesgen.mjs` into `tools/` and use `new HawkesGen({ project: 'theplacedepartment' })`.
- GPU tools cost money while a server runs. Ask J before starting servers or running big batches.

## Analytics: Hawkes Analytics only

Every page loads Gen's SDK (hawkesgen `docs/analytics.md`), product `theplacedepartment`, and never any other tracker:
`<script src="https://gen.hawkesgen.com/sdk/analytics@1.js" data-product="theplacedepartment" data-hawkes-analytics="site" defer>`
followed by `site/analytics.js` **without** `defer` (it runs before the SDK so it can switch on debug mode for
playtest browsers; it adds `play_click` for `.nav-play`, `.play-btn` and `[data-play]`; the SDK does page views and
outbound links). The game page uses `data-hawkes-analytics="page"`, which the Unity bridge finds instead of loading
the SDK again, and sets `window.HAWKES_BUILD = { version: PLACE_BUILD }`. A new page gets the same two tags.
`privacy.html` says what is kept; keep it true when tracking changes.
