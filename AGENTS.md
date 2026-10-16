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

## Versions and What's new

Every go live is a release, made by Hawkes Studio (`hawkesstudio/src/releases.ts`): a semver version bumped at
go live (minor when players get something new, patch for fixes) plus the build (`Game/v<n>`), shown as
"1.4.0 (build ...)" and tagged `v<version>` in git. Studio adds the release to `releases.json` at the repo root, in the go-live commit (website changes go to this repo's `beta`; the beta build lands on top of it) (newest first) with the
player-facing notes J approved in the go-live plan. `whatsnew.html` ("Notices of change"), the front page's file revision and the game page's label (`Game/index.html`: "v1.0.0 · build 4") read it through `hawkes-release.js` (a copy of
`hawkesstudio/clients/web/hawkes-release.js`: `[data-hawkes-version]`, `[data-hawkes-releases]`). Don't bump versions
by hand; a typo in old notes can be fixed in the file on beta.
