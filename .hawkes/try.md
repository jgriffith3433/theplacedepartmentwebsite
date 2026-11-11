# Try the home-screen shell (beta)

1. On a phone (or DevTools at ~390px width), open the beta site twice in separate sessions (close the tab, open again). From the second session you should see the dossier card **Keep this address** — Install on Android, or Share → Add to Home Screen steps on iPhone. Tap **Not now**; it must not return.
2. Install / Add to Home Screen. The icon should be the dark file mark; launching it should open **Game/** full screen (landscape), without browser chrome.
3. After a new beta deploy, launch again: you should get the fresh pages (not a stale shell). With the network off, the offline card (“This file is out of reach”) may appear instead of a frozen old home page.
4. Optional shot: append `?a2hs=1` once to force the hint for a screenshot.
